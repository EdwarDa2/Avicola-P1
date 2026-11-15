
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import { initializeDatabase } from '../src/database/migrations/001_initial';

import {
  createProfileRepository,
} from '../src/database/repositories/profile.repository';

import {
  createPlanRepository,
  type PlanDb,
} from '../src/database/repositories/plan.repository';

type SqlValue = string | number | null;

// Adaptador para ejecutar SQLite sin Expo Go
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

    const profiles = createProfileRepository(db);
    const plans = createPlanRepository(db);

    console.log('\nINICIANDO PRUEBAS DE PERFILES\n');

    // ======================================
    // PRUEBA 1: Crear perfil familiar
    // ======================================

    const created = await profiles.create({
      id: 'profile-001',
      name: 'Familia de prueba',
      children: 2,
      adolescents: 1,
      adults: 3,
    });

    assert.equal(created.id, 'profile-001');
    assert.equal(created.name, 'Familia de prueba');
    assert.equal(created.children, 2);
    assert.equal(created.adolescents, 1);
    assert.equal(created.adults, 3);
    assert.equal(created.consumption_json, '{}');

    console.log('✓ Perfil familiar creado');

    // ======================================
    // PRUEBA 2: Consultar perfil por ID
    // ======================================

    const found = await profiles.findById('profile-001');

    assert.ok(found);
    assert.equal(found.name, 'Familia de prueba');
    assert.equal(found.adults, 3);

    console.log('✓ Consulta por ID correcta');

    // ======================================
    // PRUEBA 3: Crear otro perfil y listar
    // ======================================

    await profiles.create({
      id: 'profile-002',
      name: 'Segunda familia',
      children: 1,
      adolescents: 0,
      adults: 2,
    });

    const all = await profiles.findAll();

    assert.equal(all.length, 2);
    assert.ok(
      all.some((profile) => profile.id === 'profile-001')
    );
    assert.ok(
      all.some((profile) => profile.id === 'profile-002')
    );

    console.log('✓ Consulta de perfiles correcta');

    // ======================================
    // PRUEBA 4: Actualizar perfil
    // ======================================

    const updated = await profiles.update('profile-001', {
      name: 'Familia actualizada',
      adults: 4,
    });

    assert.ok(updated);
    assert.equal(updated.name, 'Familia actualizada');
    assert.equal(updated.adults, 4);

    // Los campos no modificados deben conservarse
    assert.equal(updated.children, 2);
    assert.equal(updated.adolescents, 1);
    assert.equal(updated.consumption_json, '{}');

    console.log('✓ Perfil actualizado correctamente');

    // ======================================
    // PRUEBA 5: Rechazar nombre vacío
    // ======================================

    await assert.rejects(
      () =>
        profiles.create({
          id: 'profile-invalid',
          name: '   ',
          children: 0,
          adolescents: 0,
          adults: 2,
        }),
      /nombre/i
    );

    console.log('✓ Nombre vacío rechazado');

    // ======================================
    // PRUEBA 6: Rechazar cantidades negativas
    // ======================================
    
    await assert.rejects(
      () =>
        profiles.create({
          id: 'profile-negative',
          name: 'Familia inválida',
          children: -1,
          adolescents: 0,
          adults: 2,
        }),
      /cantidades/i
    );

    console.log('✓ Cantidades negativas rechazadas');

    // ======================================
    // PRUEBA 7: Rechazar números decimales
    // ======================================

    await assert.rejects(
      () =>
        profiles.update('profile-001', {
          children: 1.5,
        }),
      /cantidades/i
    );

    console.log('✓ Cantidades decimales rechazadas');

    // ======================================
    // PRUEBA 8: Rechazar ID duplicado
    // ======================================

    await assert.rejects(() =>
      profiles.create({
        id: 'profile-001',
        name: 'Perfil duplicado',
        children: 0,
        adolescents: 0,
        adults: 2,
      })
    );

    console.log('✓ Identificador duplicado rechazado');

    // ======================================
    // PRUEBA 9: Consultar perfil inexistente
    // ======================================

    const missing = await profiles.findById(
      'profile-inexistente'
    );

    assert.equal(missing, null);

    const missingUpdate = await profiles.update(
      'profile-inexistente',
      { adults: 3 }
    );

    assert.equal(missingUpdate, null);

    console.log('✓ Perfil inexistente controlado');

    // ======================================
    // PRUEBA 10: Asociar un plan a un perfil
    // ======================================

    await plans.create({
      id: 'plan-profile-test',
      profileId: 'profile-001',
      name: 'Plan familiar de prueba',
      type: 'chicken_eggs',
      inputs: {},
      results: {},
    });

    const associatedPlan = await plans.findById(
      'plan-profile-test'
    );

    assert.ok(associatedPlan);
    assert.equal(associatedPlan.profileId, 'profile-001');

    console.log('✓ Plan asociado al perfil');

    // ======================================
    // PRUEBA 11: Eliminar perfil y sus planes
    // ======================================

    const deleted = await profiles.remove('profile-001');

    assert.equal(deleted, true);
    assert.equal(
      await profiles.findById('profile-001'),
      null
    );
    assert.equal(
      await plans.findById('plan-profile-test'),
      null
    );

    console.log('✓ Eliminación en cascada correcta');

    // ======================================
    // PRUEBA 12: Conservar otros perfiles
    // ======================================

    const remaining = await profiles.findAll();

    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, 'profile-002');

    const deleteMissing = await profiles.remove(
      'profile-inexistente'
    );

    assert.equal(deleteMissing, false);

    console.log('✓ Otros perfiles conservados');

    console.log('\nTODAS LAS PRUEBAS PASARON\n');
  } finally {
    sqlite.close();
  }
}

runTests().catch((error) => {
  console.error('\nPRUEBA FALLIDA:', error);
  process.exitCode = 1;
});
