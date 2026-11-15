
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { SQLiteDatabase } from 'expo-sqlite';
import { initializeDatabase } from '../src/database/migrations/001_initial';

// Adaptador para ejecutar la migración Expo desde Node
function adapt(db: DatabaseSync): SQLiteDatabase {
  return {
    execAsync: async (sql: string) => {
      db.exec(sql);
    },
    getFirstAsync: async (sql: string) => {
      return db.prepare(sql).get() ?? null;
    },
  } as unknown as SQLiteDatabase;
}

async function runTests() {
  const directory = mkdtempSync(
    join(tmpdir(), 'avicola-test-')
  );

  const filename = join(directory, 'test.db');
  let db = new DatabaseSync(filename);

  try {
    console.log('Iniciando pruebas SQLite...\n');

    // 1. Ejecutar migración real
    await initializeDatabase(adapt(db));
    await initializeDatabase(adapt(db));

    assert.equal(
      db.prepare('PRAGMA user_version').get()?.user_version,
      1
    );

    console.log('✓ Migración ejecutada correctamente');

    // 2. Comprobar tablas
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
      )
      .all()
      .map((row) => row.name);

    for (const name of [
      'profiles',
      'production_plans',
      'batches',
      'shopping_items',
    ]) {
      assert.ok(tables.includes(name));
    }

    console.log('✓ Las cuatro tablas existen');

    // 3. Crear perfil familiar
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO profiles (
        id, name, children, adolescents, adults,
        consumption_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'profile-001',
      'Familia de prueba',
      2,
      1,
      3,
      '{}',
      now,
      now
    );

    console.log('✓ Perfil familiar creado');

    // 4. Cerrar y reabrir la base de datos
    db.close();
    db = new DatabaseSync(filename);
    db.exec('PRAGMA foreign_keys = ON;');

    const profile = db.prepare(
      'SELECT * FROM profiles WHERE id = ?'
    ).get('profile-001');

    assert.equal(profile?.name, 'Familia de prueba');
    assert.equal(profile?.adults, 3);

    console.log('✓ Los datos persisten al reabrir');

    // 5. Actualizar perfil
    db.prepare(
      'UPDATE profiles SET adults = ? WHERE id = ?'
    ).run(4, 'profile-001');

    const updated = db.prepare(
      'SELECT adults FROM profiles WHERE id = ?'
    ).get('profile-001');

    assert.equal(updated?.adults, 4);

    console.log('✓ Perfil actualizado correctamente');

    // 6. Crear un plan asociado al perfil
    db.prepare(`
      INSERT INTO production_plans (
        id, profile_id, name, type, status,
        input_json, result_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'plan-001',
      'profile-001',
      'Producción de codornices',
      'quail_eggs',
      'draft',
      '{}',
      '{}',
      now,
      now
    );

    console.log('✓ Plan asociado al perfil');

    // 7. Eliminar perfil
    db.prepare(
      'DELETE FROM profiles WHERE id = ?'
    ).run('profile-001');

    const deleted = db.prepare(
      'SELECT * FROM profiles WHERE id = ?'
    ).get('profile-001');

    assert.equal(deleted, undefined);

    // Verificar eliminación en cascada
    const remainingPlan = db.prepare(
      'SELECT * FROM production_plans WHERE id = ?'
    ).get('plan-001');

    assert.equal(remainingPlan, undefined);

    console.log('✓ Eliminación y cascada correctas');

    console.log('\nTODAS LAS PRUEBAS PASARON');
  } finally {
    db.close();
    rmSync(directory, {
      recursive: true,
      force: true,
    });
  }
}

runTests().catch((error) => {
  console.error('\nPRUEBA FALLIDA:', error);
  process.exitCode = 1;
});
