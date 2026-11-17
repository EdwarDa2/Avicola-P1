
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import { initializeDatabase } from
  '../src/database/migrations/001_initial';

import { migrateFamilyMetadata } from
  '../src/database/migrations/002_family_metadata';

import { migratePlanCompatibility } from
  '../src/database/migrations/003_plan_compatibility';

import { createPlanRepository } from
  '../src/database/repositories/plan.repository';

import type { PlanDb } from
  '../src/database/repositories/plan.repository';

type SqlValue = string | number | null;

async function runTests() {
  const sqlite = new DatabaseSync(':memory:');

  const db: PlanDb & {
    execAsync(sql: string): Promise<void>;
  } = {
    async execAsync(sql) {
      sqlite.exec(sql);
    },

    async runAsync(sql, params: SqlValue[] = []) {
      const result = sqlite.prepare(sql).run(...params);
      return {
        changes: Number(result.changes),
      };
    },

    async getFirstAsync<T>(
      sql: string,
      params: SqlValue[] = []
    ): Promise<T | null> {
      return (
        sqlite.prepare(sql).get(...params) ?? null
      ) as T | null;
    },

    async getAllAsync<T>(
      sql: string,
      params: SqlValue[] = []
    ): Promise<T[]> {
      return sqlite.prepare(sql).all(...params) as T[];
    },
  };

  try {
    const nativeDb = db as unknown as SQLiteDatabase;

    await initializeDatabase(nativeDb);
    await migrateFamilyMetadata(nativeDb);

    // Crear familia para satisfacer la clave foránea.
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO profiles (
        id, name, children, adolescents, adults,
        consumption_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'family-v3',
        'Familia de migración',
        0,
        0,
        2,
        '{}',
        now,
        now,
      ]
    );

    const plans = createPlanRepository(db);

    // Un plan creado con el esquema anterior.
    await plans.create({
      id: 'legacy-plan',
      profileId: 'family-v3',
      name: 'Plan anterior',
      type: 'broiler',
      status: 'draft',
      inputs: { test: true },
      results: { birds: 10 },
    });

    // Un lote asociado debe sobrevivir.
    await db.runAsync(
      `INSERT INTO batches (
        id, plan_id, name, start_date,
        status, details_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'batch-v3',
        'legacy-plan',
        'Lote anterior',
        '2026-11-16',
        'planned',
        '{}',
        now,
        now,
      ]
    );

    console.log('\nPRUEBAS DE MIGRACIÓN V3\n');

    await migratePlanCompatibility(nativeDb);

    // Debe poder ejecutarse dos veces sin duplicar.
    await migratePlanCompatibility(nativeDb);

    const version = sqlite.prepare(
      'PRAGMA user_version'
    ).get() as { user_version: number };

    assert.equal(version.user_version, 3);

    console.log('✓ Migración v3 aplicada');

    const legacy = await plans.findById('legacy-plan');

    assert.ok(legacy);
    assert.equal(legacy.type, 'broiler');
    assert.equal(legacy.results.birds, 10);

    console.log('✓ Plan anterior conservado');

    const batch = sqlite.prepare(
      'SELECT id FROM batches WHERE id = ?'
    ).get('batch-v3');

    assert.ok(batch);

    console.log('✓ Lote anterior conservado');

    // Ahora se puede guardar carne de codorniz.
    await plans.create({
      id: 'quail-meat-v3',
      profileId: 'family-v3',
      name: 'Carne de codorniz',
      type: 'quail_meat',
      status: 'inactive',
      inputs: {
        scenarioKey: 'quail_meat_reference',
      },
      results: {
        formulaVersion: 'avicola-1.0.0',
      },
    });

    const newPlan = await plans.findById(
      'quail-meat-v3'
    );

    assert.ok(newPlan);
    assert.equal(newPlan.type, 'quail_meat');
    assert.equal(newPlan.status, 'inactive');
    assert.equal(
      newPlan.results.formulaVersion,
      'avicola-1.0.0'
    );

    console.log('✓ Carne de codorniz admitida');
    console.log('✓ Versión textual conservada en JSON');

    const violations = sqlite.prepare(
      'PRAGMA foreign_key_check'
    ).all();

    assert.equal(violations.length, 0);

    console.log('✓ Integridad referencial correcta');

    // Verificar que la relación ON DELETE CASCADE
    // sigue funcionando tras reconstruir la tabla.
    await plans.remove('legacy-plan');

    const deletedBatch = sqlite.prepare(
      'SELECT id FROM batches WHERE id = ?'
    ).get('batch-v3');

    assert.equal(deletedBatch, undefined);

    console.log('✓ Eliminación en cascada conservada');

    console.log('\nTODAS LAS PRUEBAS PASARON\n');

  } finally {
    sqlite.close();
  }
}

runTests().catch((error) => {
  console.error('PRUEBA FALLIDA:', error);
  process.exitCode = 1;
});
