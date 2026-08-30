import { describe, it, expect, afterEach } from "vitest";
import {
  encryptText,
  decryptText,
  encryptJson,
  decryptJson,
  isEncryptedValue,
  isEncryptionEnabled,
  maybeEncryptJson,
  maybeDecryptJson,
} from "@/lib/crypto";

describe("crypto — cifrado en reposo PII", () => {
  const keyB64 = Buffer.from("a".repeat(32)).toString("base64");
  const keyHex = Buffer.from("b".repeat(32)).toString("hex");

  afterEach(() => {
    delete process.env.DATA_ENCRYPTION_KEY;
  });

  it("debería estar deshabilitado sin clave", () => {
    delete process.env.DATA_ENCRYPTION_KEY;
    expect(isEncryptionEnabled()).toBe(false);
    expect(encryptText("plain")).toBe("plain");
    expect(decryptText("plain")).toBe("plain");
  });

  it("debería cifrar y descifrar texto con clave base64", () => {
    process.env.DATA_ENCRYPTION_KEY = keyB64;
    const plain = "Calle 123 #45-67, Bogotá";
    const enc = encryptText(plain);
    expect(isEncryptedValue(enc)).toBe(true);
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(decryptText(enc)).toBe(plain);
  });

  it("debería cifrar y descifrar JSON", () => {
    process.env.DATA_ENCRYPTION_KEY = keyB64;
    const obj = { name: "Ana", phone: "+57 300 1234567", address: "Cra 7" };
    const enc = encryptJson(obj);
    expect(isEncryptedValue(enc)).toBe(true);
    expect(decryptJson(enc)).toEqual(obj);
  });

  it("debería aceptar clave hex", () => {
    process.env.DATA_ENCRYPTION_KEY = keyHex;
    expect(isEncryptionEnabled()).toBe(true);
    const enc = encryptText("test hex");
    expect(decryptText(enc)).toBe("test hex");
  });

  it("debería rechazar clave inválida", () => {
    process.env.DATA_ENCRYPTION_KEY = "corta";
    expect(isEncryptionEnabled()).toBe(false);
  });

  it("maybe* deberían ser tolerantes con datos en claro (compat)", () => {
    process.env.DATA_ENCRYPTION_KEY = keyB64;
    const plainObj = { city: "Medellín" };
    // sin cifrar previo
    expect(maybeDecryptJson(plainObj)).toEqual(plainObj);
    // cifrado
    const enc = maybeEncryptJson(plainObj) as string;
    expect(isEncryptedValue(enc)).toBe(true);
    expect(maybeDecryptJson(enc)).toEqual(plainObj);
  });

  it("debería mantener compatibilidad: descifrar valor no cifrado lo deja igual", () => {
    process.env.DATA_ENCRYPTION_KEY = keyB64;
    expect(decryptText("no-cifrado")).toBe("no-cifrado");
  });

  it("debería no reutilizar IV (ciphertexts distintos para mismo plain)", () => {
    process.env.DATA_ENCRYPTION_KEY = keyB64;
    const enc1 = encryptText("same");
    const enc2 = encryptText("same");
    expect(enc1).not.toBe(enc2);
    expect(decryptText(enc1)).toBe("same");
    expect(decryptText(enc2)).toBe("same");
  });

  it("debería manejar maybeDecrypt con clave ausente (devuelve ciphertext)", () => {
    process.env.DATA_ENCRYPTION_KEY = keyB64;
    const enc = encryptText("secret");
    delete process.env.DATA_ENCRYPTION_KEY;
    // sin clave, maybeDecrypt devuelve el ciphertext tal cual
    const result = maybeDecryptJson(enc);
    expect(result).toBe(enc);
  });
});
