
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Family } from '../src/types';

import { initializeDatabase } from '../src/database/migrations/001_initial';
import { migrateFamilyMetadata } from '../src/database/migrations/002_family_metadata';

import {
  createFamilyRepository,
} from '../src/database/repositories/family.repository';

import type {
  PlanDb,
} from '../src/database/repositories/plan.repository';

type SqlValue = string | number | null;

function createAdapter(sqlite: DatabaseSync) {
  const db: PlanDb & {
    execAsync(sql: string): Promise<void>;
  } = {
    async execAsync(sql) {
      sqlite.exec(sql);
    },

    async runAsync(sql, params: SqlValue[] = []) {
      const result = sqlite.prepare(sql).run(...params);
      return { changes: Number(result.changes) };
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

  return db;
}

async function runTests() {
  const sqlite = new DatabaseSync(':memory:');

  try {
    const db = createAdapter(sqlite);

    await initializeDatabase(
      db as unknown as SQLiteDatabase
    );

    await migrateFamilyMetadata(
      db as unknown as SQLiteDatabase
    );

    const families = createFamilyRepository(db);
    const now = new Date().toISOString();

    console.log('\nPRUEBAS DE FAMILIAS Y SQLITE\n');

    const example: Family = {
      id: 'fam-test-001',
      name: 'Familia de prueba',
      archived: false,
      ageCounts: {
        '0-3': 1,
        '4-8': 2,
        '9-13': 1,
        '14-18': 2,
        '19+': 3,
      },
      createdAt: now,
      updatedAt: now,
    };

    // 1. Crear familia
    await families.create(example);

    console.log('✓ Familia creada');

    // 2. Consultar y comprobar edades
    const found = await families.findById(example.id);

    assert.ok(found);
    assert.deepEqual(found.ageCounts, example.ageCounts);

    console.log('✓ Cinco grupos de edad recuperados');

    // 3. Verificar contadores compatibles
    const totals = sqlite.prepare(
      `SELECT children, adolescents, adults
       FROM profiles WHERE id = ?`
    ).get(example.id);

    assert.equal(totals?.children, 4);
    assert.equal(totals?.adolescents, 2);
    assert.equal(totals?.adults, 3);

    console.log('✓ Contadores familiares correctos');

    // 4. Actualizar
    const updated = await families.update(
      example.id,
      'Familia actualizada',
      {
        ...example.ageCounts,
        '19+': 4,
      }
    );

    assert.ok(updated);
    assert.equal(updated.name, 'Familia actualizada');
    assert.equal(updated.ageCounts['19+'], 4);

    console.log('✓ Familia actualizada');

    // 5. Archivar
    await families.setArchived(example.id, true);

    const archived = await families.findById(example.id);

    assert.equal(archived?.archived, true);

    console.log('✓ Familia archivada');

    // 6. Restaurar
    await families.setArchived(example.id, false);

    const restored = await families.findById(example.id);

    assert.equal(restored?.archived, false);

    console.log('✓ Familia restaurada');

    // 7. Guardar selección
    await families.setSelectedFamilyId(example.id);

    assert.equal(
      await families.getSelectedFamilyId(),
      example.id
    );

    console.log('✓ Selección guardada');

    // 8. Consultar todas
    const all = await families.findAll();

    assert.equal(all.length, 1);
    assert.equal(all[0].id, example.id);

    console.log('✓ Listado de familias correcto');

    // 9. Validación
    await assert.rejects(
      () =>
        families.create({
          ...example,
          id: 'fam-invalid',
          ageCounts: {
            ...example.ageCounts,
            '4-8': -1,
          },
        }),
      /cantidad inválida/i
    );

    console.log('✓ Cantidades inválidas rechazadas');

    console.log('\nTODAS LAS PRUEBAS PASARON');
  } finally {
    sqlite.close();
  }
}

runTests().catch((error) => {
  console.error('PRUEBA FALLIDA:', error);
  process.exitCode = 1;
});
