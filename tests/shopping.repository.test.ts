
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';

import { initializeDatabase } from '../src/database/migrations/001_initial';

import {
  createPlanRepository,
  type PlanDb,
} from '../src/database/repositories/plan.repository';

import {
  createShoppingRepository,
} from '../src/database/repositories/shopping.repository';

type SqlValue = string | number | null;

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
    const shopping = createShoppingRepository(db);

    const now = new Date().toISOString();

    console.log('\nINICIANDO PRUEBAS DE CANASTA\n');

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

    // 2. Crear plan de producción
    await plans.create({
      id: 'plan-001',
      profileId: 'profile-001',
      name: 'Producción de pollo',
      type: 'broiler',
      inputs: {},
      results: {},
    });

    console.log('✓ Plan de producción creado');

    // 3. Crear recurso
    const created = await shopping.create({
      id: 'item-001',
      planId: 'plan-001',
      name: 'Alimento para aves',
      quantity: 25,
      unit: 'kg',
    });

    assert.equal(created.id, 'item-001');
    assert.equal(created.planId, 'plan-001');
    assert.equal(created.quantity, 25);
    assert.equal(created.unit, 'kg');
    assert.equal(created.checked, false);

    console.log('✓ Recurso creado correctamente');

    // 4. Consultar recurso
    const found = await shopping.findById('item-001');

    assert.ok(found);
    assert.equal(found.name, 'Alimento para aves');
    assert.equal(found.checked, false);

    console.log('✓ Consulta por ID correcta');

    // 5. Crear segundo recurso
    await shopping.create({
      id: 'item-002',
      planId: 'plan-001',
      name: 'Bebederos',
      quantity: 3,
      unit: 'piezas',
    });

    const list = await shopping.findByPlan('plan-001');

    assert.equal(list.length, 2);
    assert.ok(
      list.every((item) => item.planId === 'plan-001')
    );

    console.log('✓ Consulta por plan correcta');

    // 6. Actualizar cantidad y marcar adquirido
    const updated = await shopping.update('item-001', {
      quantity: 30,
      checked: true,
    });

    assert.ok(updated);
    assert.equal(updated.quantity, 30);
    assert.equal(updated.checked, true);

    console.log('✓ Actualización correcta');

    // 7. Consultar recursos pendientes
    const pending = await shopping.findPendingByPlan(
      'plan-001'
    );

    assert.equal(pending.length, 1);
    assert.equal(pending[0].id, 'item-002');

    console.log('✓ Filtro de pendientes correcto');

    // 8. Validar cantidad negativa
    await assert.rejects(
      () =>
        shopping.create({
          id: 'item-invalid',
          planId: 'plan-001',
          name: 'Alimento inválido',
          quantity: -5,
          unit: 'kg',
        }),
      /cantidad/i
    );

    console.log('✓ Cantidades negativas rechazadas');

    // 9. Validar nombre vacío
    await assert.rejects(
      () =>
        shopping.create({
          id: 'item-empty',
          planId: 'plan-001',
          name: '   ',
          quantity: 5,
          unit: 'kg',
        }),
      /nombre/i
    );

    console.log('✓ Nombre vacío rechazado');

    // 10. Validar plan inexistente
    await assert.rejects(() =>
      shopping.create({
        id: 'item-orphan',
        planId: 'plan-inexistente',
        name: 'Recurso huérfano',
        quantity: 2,
        unit: 'piezas',
      })
    );

    console.log('✓ Clave foránea validada');

    // 11. Eliminar recurso
    const deleted = await shopping.remove('item-001');

    assert.equal(deleted, true);
    assert.equal(
      await shopping.findById('item-001'),
      null
    );

    console.log('✓ Recurso eliminado correctamente');

    // 12. Eliminación en cascada
    await plans.remove('plan-001');

    const remaining = await shopping.findById(
      'item-002'
    );

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
