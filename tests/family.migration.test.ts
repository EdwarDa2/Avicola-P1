
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import { initializeDatabase } from '../src/database/migrations/001_initial';

import { migrateFamilyMetadata } from '../src/database/migrations/002_family_metadata';

async function runTests() {
  const sqlite = new DatabaseSync(':memory:');

  const db = {
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },

    async getFirstAsync<T>(sql: string) {
      return (sqlite.prepare(sql).get() ?? null) as T | null;
    },
  } as unknown as SQLiteDatabase;

  try {
    console.log('\nPRUEBAS DE MIGRACIÓN DE FAMILIAS\n');

    // Crear esquema anterior
    await initializeDatabase(db);

    // Aplicar nueva migración
    await migrateFamilyMetadata(db);

    // Repetir para comprobar que sea segura
    await migrateFamilyMetadata(db);

    const version = sqlite
      .prepare('PRAGMA user_version')
      .get() as { user_version: number };

    assert.equal(version.user_version, 2);

    console.log('✓ Versión SQLite actualizada a 2');

    const columns = sqlite
      .prepare('PRAGMA table_info(profiles)')
      .all() as { name: string }[];

    const names = columns.map((column) => column.name);

    assert.ok(names.includes('age_counts_json'));
    assert.ok(names.includes('archived'));

    console.log('✓ Nuevos campos de familias creados');

    const settings = sqlite
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='app_settings'"
      )
      .get();

    assert.ok(settings);

    console.log('✓ Tabla de configuraciones creada');

    console.log('\nTODAS LAS PRUEBAS PASARON');
  } finally {
    sqlite.close();
  }
}

runTests().catch((error) => {
  console.error('PRUEBA FALLIDA:', error);
  process.exitCode = 1;
});
