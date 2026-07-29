/**
 * Script de backup para datos de Switch&Tech (lowdb).
 *
 * Copia el archivo data/db.json a un directorio de backups con
 * marca de tiempo. Uso programado recomendado (cron / tarea programada):
 *
 *   # Ejecutar diariamente a las 3:00 AM
 *   0 3 * * * cd /ruta/proyecto && npx tsx scripts/backup.ts
 *
 * También puede ejecutarse manualmente:
 *   npx tsx scripts/backup.ts
 *
 * Requisitos:
 *   - tsx (npx tsx)
 *   - El archivo data/db.json debe existir (generado por lowdb al iniciar la app)
 */

import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const PROJECT_ROOT = resolve(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'data');
const BACKUP_DIR = join(DATA_DIR, 'backups');
const DB_FILE = join(DATA_DIR, 'db.json');

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function timestamp(): string {
  const d = new Date();
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  return `${date}_${time}`;
}

function main(): void {
  // Verificar que el archivo de datos existe
  if (!existsSync(DB_FILE)) {
    console.error(`[Backup] ERROR: No se encontró el archivo de datos: ${DB_FILE}`);
    console.error('[Backup] Asegúrate de que la aplicación se haya ejecutado al menos una vez.');
    process.exit(1);
  }

  // Crear directorio de backups si no existe
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`[Backup] Directorio creado: ${BACKUP_DIR}`);
  }

  // Generar nombre de archivo con marca de tiempo
  const backupFile = join(BACKUP_DIR, `db_${timestamp()}.json`);

  try {
    copyFileSync(DB_FILE, backupFile);
    console.log(`[Backup] ✅ Backup exitoso:`);
    console.log(`[Backup]    Origen:  ${DB_FILE}`);
    console.log(`[Backup]    Destino: ${backupFile}`);

    // Mostrar tamaño
    const stats = statSync(backupFile);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`[Backup]    Tamaño:  ${sizeKB} KB`);
  } catch (err) {
    console.error('[Backup] ERROR: Falló la copia del archivo:', err);
    process.exit(1);
  }
}

main();
