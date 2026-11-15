
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import { initializeDatabase } from '../src/database/migrations/001_initial';

import {
  createPlanRepository,
  type PlanDb,
} from '../src/database/repositories/plan.repository';

import {
  createBatchRepository,
} from '../src/database/repositories/batch.repository';

type SqlValue = string | number | null;

// Adaptador para Node.js
function createTestAdapter(sqlite: DatabaseSync) {
  const db: PlanDb & {
    execAsync(sql: string): Promise<void>;
  } = {
    async execAsync(sql: string) {
      sqlite.exec(sql);
    },

    async runAsync(
      sql: string,
      params: SqlValue[] = []
    ) {
      const result = sqlite.prepare(sql).run(...params);

      return {
        changes: Number(result.changes),
      };
    },

    async getFirstAsync<T>(
      sql: string,
      params: SqlValue[] = []
    ): Promise<T | null> {
      const row = sqlite.prepare(sql).get(...params);
      return (row ?? null) as T | null;
    },

    async getAllAsync<T>(
      sql: string,
      params: SqlValue[] = []
    ): Promise<T[]> {
      return sqlite.prepare(sql).all(...params) as T[];
    },
  };

  return db;
}

async function runTests() {
  const sqlite = new DatabaseSync(':memory:');

  try {
    const db = createTestAdapter(sqlite);

    await initializeDatabase(
      db as unknown as SQLiteDatabase
    );

    const plans = createPlanRepository(db);
    const batches = createBatchRepository(db);

    const now = new Date().toISOString();

    console.log('\nINICIANDO PRUEBAS DE LOTES\n');

    // 1. Crear perfil familiar
    sqlite.prepare(`
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

    // 2. Crear plan con el repositorio real
    await plans.create({
      id: 'plan-001',
      profileId: 'profile-001',
      name: 'Plan de producción',
      type: 'chicken_eggs',
      inputs: {},
      results: {},
    });

    console.log('✓ Plan de producción creado');

    // 3. Crear primer lote
    const created = await batches.create({
      id: 'batch-001',
      planId: 'plan-001',
      name: 'Lote de prueba 1',
      startDate: '2026-11-15',
      details: {
        initialBirds: 25,
        notes: 'Lote inicial',
      },
    });

    assert.equal(created.id, 'batch-001');
    assert.equal(created.planId, 'plan-001');
    assert.equal(created.status, 'planned');
    assert.equal(created.details.initialBirds, 25);

    console.log('✓ Lote creado correctamente');

    // 4. Consultar lote por ID
    const found = await batches.findById('batch-001');

    assert.ok(found);
    assert.equal(found.name, 'Lote de prueba 1');
    assert.equal(found.startDate, '2026-11-15');

    console.log('✓ Consulta por ID correcta');

    // 5. Crear segundo lote
    await batches.create({
      id: 'batch-002',
      planId: 'plan-001',
      name: 'Lote de prueba 2',
      details: {
        initialBirds: 20,
      },
    });

    const list = await batches.findByPlan('plan-001');

    assert.equal(list.length, 2);
    assert.equal(
      list.every((batch) => batch.planId === 'plan-001'),
      true
    );

    console.log('✓ Consulta por plan correcta');

    // 6. Actualizar lote
    const updated = await batches.update('batch-001', {
      name: 'Lote actualizado',
      status: 'active',
      details: {
        initialBirds: 25,
        notes: 'En producción',
      },
    });

    assert.ok(updated);
    assert.equal(updated.name, 'Lote actualizado');
    assert.equal(updated.status, 'active');
    assert.equal(updated.details.notes, 'En producción');
    assert.equal(updated.startDate, '2026-11-15');

    console.log('✓ Lote actualizado correctamente');

    // 7. Validar plan inexistente
    await assert.rejects(() =>
      batches.create({
        id: 'batch-invalid',
        planId: 'plan-inexistente',
        name: 'Lote inválido',
      })
    );

    console.log('✓ Clave foránea validada');

    // 8. Validar datos incorrectos
    await assert.rejects(
      () =>
        batches.create({
          id: 'batch-empty',
          planId: 'plan-001',
          name: '   ',
        }),
      /nombre del lote/i
    );

    await assert.rejects(
      () =>
        batches.create({
          id: 'batch-date',
          planId: 'plan-001',
          name: 'Fecha inválida',
          startDate: '2026-02-30',
        }),
      /fecha/i
    );

    console.log('✓ Validaciones correctas');

    // 9. Eliminar primer lote
    const deleted = await batches.remove('batch-001');

    assert.equal(deleted, true);
    assert.equal(
      await batches.findById('batch-001'),
      null
    );

    console.log('✓ Lote eliminado correctamente');

    // 10. Verificar eliminación en cascada
    await plans.remove('plan-001');

    const remaining = await batches.findById('batch-002');

    assert.equal(remaining, null);

    console.log('✓ Eliminación en cascada correcta');

    console.log('\nTODAS LAS PRUEBAS PASARON\n');
  } finally {
    sqlite.close();
  }
}

runTests().catch((error) => {
  console.error('\nPRUEBA FALLIDA:', error);
  process.exitCode = 1;
});
