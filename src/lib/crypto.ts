import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Cifrado en reposo para PII (Ley 1581).
 *
 * - Usa AES-256-GCM con clave de 32 bytes en `DATA_ENCRYPTION_KEY` (base64, hex o utf8).
 * - Formato persistido: `enc:v1:<base64(iv+authTag+ciphertext)>`.
 * - Si `DATA_ENCRYPTION_KEY` no está configurado: NO cifra (devuelve el valor en claro)
 *   y loguea warning solo en producción. Así `lowdb`/`memory` en dev/tests no requieren clave.
 * - Descifrado es tolerante: si el valor no tiene prefijo `enc:v1:` se asume en claro
 *   (compatibilidad con datos preexistentes anteriores a la migración).
 */

const PREFIX = "enc:v1:";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getRawKey(): string | undefined {
  return process.env.DATA_ENCRYPTION_KEY?.trim() || undefined;
}

function deriveKey(): Buffer | null {
  const raw = getRawKey();
  if (!raw) return null;

  // 1) base64 32 bytes -> 44 chars con padding
  try {
    const b64 = Buffer.from(raw, "base64");
    if (b64.length === 32) return b64;
  } catch {}

  // 2) hex 64 chars -> 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    try {
      const hex = Buffer.from(raw, "hex");
      if (hex.length === 32) return hex;
    } catch {}
  }

  // 3) utf8 exact 32 bytes
  const utf8 = Buffer.from(raw, "utf8");
  if (utf8.length === 32) return utf8;

  // 4) cualquier longitud: derivar via SHA256? Mejor fallar explícito en prod
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[crypto] DATA_ENCRYPTION_KEY inválida: debe ser 32 bytes en base64 (44 chars), hex 64 chars o utf8 32 chars"
    );
  }
  return null;
}

let warnedMissing = false;

export function isEncryptionEnabled(): boolean {
  return deriveKey() !== null;
}

function getKeyOrNull(): Buffer | null {
  const key = deriveKey();
  if (!key && process.env.NODE_ENV === "production" && !warnedMissing) {
    warnedMissing = true;
    console.warn(
      "[crypto] DATA_ENCRYPTION_KEY no configurada — PII se guardará en claro (configúrala en producción)"
    );
  }
  return key;
}

export function encryptText(plaintext: string): string {
  const key = getKeyOrNull();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, enc]).toString("base64");
  return `${PREFIX}${payload}`;
}

export function decryptText(ciphertext: string): string {
  if (!ciphertext.startsWith(PREFIX)) return ciphertext;

  const key = getKeyOrNull();
  if (!key) {
    // Sin clave no podemos descifrar; devolvemos el valor cifrado tal cual para no perder datos
    console.warn("[crypto] Intento de descifrado sin DATA_ENCRYPTION_KEY — dato permanece cifrado");
    return ciphertext;
  }

  const raw = ciphertext.slice(PREFIX.length);
  const buf = Buffer.from(raw, "base64");
  if (buf.length < IV_LEN + TAG_LEN) {
    throw new Error("Payload cifrado inválido");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}

export function encryptJson(obj: unknown): string {
  return encryptText(JSON.stringify(obj));
}

export function decryptJson<T = unknown>(payload: string): T {
  const plain = decryptText(payload);
  return JSON.parse(plain) as T;
}

/** Helpers para órdenes: cifran/descifran campos PII de forma tolerante. */

export function isEncryptedValue(v: unknown): boolean {
  return typeof v === "string" && v.startsWith(PREFIX);
}

/** Cifra un objeto si hay clave, si no lo devuelve tal cual. */
export function maybeEncryptJson(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (!isEncryptionEnabled()) return obj;
  try {
    return encryptJson(obj);
  } catch (e) {
    console.error("[crypto] Error al cifrar JSON", e);
    return obj;
  }
}

/** Descifra si el valor parece cifrado, si no lo devuelve tal cual. */
export function maybeDecryptJson<T>(value: unknown): T {
  if (isEncryptedValue(value)) {
    try {
      return decryptJson<T>(value as string);
    } catch (e) {
      console.error("[crypto] Error al descifrar JSON — devolviendo valor cifrado", e);
      // En caso de clave incorrecta, mejor devolver undefined que exponer ciphertext
      return value as unknown as T;
    }
  }
  return value as T;
}
