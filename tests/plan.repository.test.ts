
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import { initializeDatabase } from '../src/database/migrations/001_initial';

import {
  createPlanRepository,
  type PlanDb,
} from '../src/database/repositories/plan.repository';

// Adaptador para probar el repositorio sin Expo Go

function createTestAdapter(sqlite: DatabaseSync) {
  type SqlValue = string | number | null;

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
      const rows = sqlite.prepare(sql).all(...params);

      return rows as T[];
    },
  };

  return db;
}

async function runTests() {
  const sqlite = new DatabaseSync(':memory:');

  try {
    const db = createTestAdapter(sqlite);

    // Inicializar las tablas reales del proyecto
    await initializeDatabase(db as unknown as SQLiteDatabase);

    const plans = createPlanRepository(db);

    const now = new Date().toISOString();

    console.log('\nINICIANDO PRUEBAS DE PLANES\n');

    // =====================================
    // PRUEBA 1: Crear perfil familiar
    // =====================================

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

    // =====================================
    // PRUEBA 2: Crear plan de producción
    // =====================================

    const created = await plans.create({
      id: 'plan-001',
      profileId: 'profile-001',
      name: 'Producción de codornices',
      type: 'quail_eggs',

      inputs: {
        targetEggs: 150,
        includeReproduction: true,
        fertility: 0.85,
        hatchability: 0.8,
      },

      results: {
        requiredLayers: 30,
        fertileEggsToIncubate: 48,
      },
    });

    assert.equal(created.id, 'plan-001');
    assert.equal(created.profileId, 'profile-001');
    assert.equal(created.type, 'quail_eggs');
    assert.equal(created.status, 'draft');

    console.log('✓ Plan de producción creado');

    // =====================================
    // PRUEBA 3: Consultar plan por ID
    // =====================================

    const found = await plans.findById('plan-001');

    assert.ok(found);
    assert.equal(found.name, 'Producción de codornices');
    assert.equal(found.results.requiredLayers, 30);
    assert.equal(found.inputs.includeReproduction, true);

    console.log('✓ Consulta por ID correcta');

    // =====================================
    // PRUEBA 4: Consultar planes por perfil
    // =====================================

    const profilePlans = await plans.findByProfile(
      'profile-001'
    );

    assert.equal(profilePlans.length, 1);
    assert.equal(profilePlans[0].id, 'plan-001');

    console.log('✓ Consulta por perfil correcta');

    // =====================================
    // PRUEBA 5: Actualizar plan
    // =====================================

    const updated = await plans.update('plan-001', {
      name: 'Producción actualizada',
      status: 'active',
      results: {
        requiredLayers: 35,
        fertileEggsToIncubate: 55,
      },
    });

    assert.ok(updated);
    assert.equal(updated.name, 'Producción actualizada');
    assert.equal(updated.status, 'active');
    assert.equal(updated.results.requiredLayers, 35);

    console.log('✓ Plan actualizado correctamente');

    // =====================================
    // PRUEBA 6: Validar perfil inexistente
    // =====================================

    await assert.rejects(
      () =>
        plans.create({
          id: 'plan-invalid',
          profileId: 'profile-inexistente',
          name: 'Plan inválido',
          type: 'broiler',
          inputs: {},
          results: {},
        })
    );

    console.log('✓ Clave foránea validada');

    // =====================================
    // PRUEBA 7: Validar nombre vacío
    // =====================================

    await assert.rejects(
      () =>
        plans.create({
          id: 'plan-empty',
          profileId: 'profile-001',
          name: '   ',
          type: 'chicken_eggs',
          inputs: {},
          results: {},
        }),
      /nombre del plan/i
    );

    console.log('✓ Validación de nombre correcta');

    // =====================================
    // PRUEBA 8: Eliminar plan
    // =====================================

    const deleted = await plans.remove('plan-001');

    assert.equal(deleted, true);

    const afterDelete = await plans.findById('plan-001');

    assert.equal(afterDelete, null);

    console.log('✓ Plan eliminado correctamente');

    // =====================================
    // PRUEBA 9: Eliminación en cascada
    // =====================================

    await plans.create({
      id: 'plan-002',
      profileId: 'profile-001',
      name: 'Plan de gallinas',
      type: 'chicken_eggs',
      inputs: { targetEggs: 100 },
      results: { requiredLayers: 20 },
    });

    sqlite.prepare(
      'DELETE FROM profiles WHERE id = ?'
    ).run('profile-001');

    const cascadeResult = await plans.findById('plan-002');

    assert.equal(cascadeResult, null);

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
