
import type { SQLiteDatabase } from 'expo-sqlite';

interface VersionRow {
  user_version: number;
}

interface IndexRow {
  sql: string;
}

export async function migratePlanCompatibility(
  db: SQLiteDatabase
): Promise<void> {
  const versionRow =
    await db.getFirstAsync<VersionRow>(
      'PRAGMA user_version;'
    );

  const version = versionRow?.user_version ?? 0;

  if (version >= 3) return;

  if (version < 2) {
    throw new Error(
      'Primero deben aplicarse las migraciones v1 y v2'
    );
  }

  // Guardar los índices actuales para reconstruirlos
  // después de reemplazar la tabla.
  const indexes = await db.getAllAsync<IndexRow>(
    `SELECT sql
     FROM sqlite_master
     WHERE type = 'index'
       AND tbl_name = 'production_plans'
       AND sql IS NOT NULL`
  );

  const indexStatements = indexes
    .map((index) =>
      `${index.sql.trim().replace(/;\s*$/, '')};`
    )
    .join('\n');

  // Debe desactivarse fuera de la transacción
  // para poder reemplazar una tabla referenciada
  // por otras tablas como batches.
  await db.execAsync('PRAGMA foreign_keys = OFF;');

  try {
    await db.execAsync(`
      BEGIN IMMEDIATE;

      CREATE TABLE production_plans_v3 (
        id TEXT PRIMARY KEY NOT NULL,

        profile_id TEXT NOT NULL
          REFERENCES profiles(id)
          ON DELETE CASCADE,

        name TEXT NOT NULL,

        type TEXT NOT NULL CHECK (
          type IN (
            'chicken_eggs',
            'broiler',
            'hen_eggs',
            'chicken_meat',
            'quail_eggs',
            'quail_meat'
          )
        ),

        status TEXT NOT NULL DEFAULT 'draft' CHECK (
          status IN (
            'draft',
            'active',
            'completed',
            'inactive',
            'archived'
          )
        ),

        input_json TEXT NOT NULL DEFAULT '{}',
        result_json TEXT NOT NULL DEFAULT '{}',

        calculation_version INTEGER NOT NULL DEFAULT 1,

        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO production_plans_v3 (
        id,
        profile_id,
        name,
        type,
        status,
        input_json,
        result_json,
        calculation_version,
        created_at,
        updated_at
      )
      SELECT
        id,
        profile_id,
        name,
        type,
        status,
        input_json,
        result_json,
        calculation_version,
        created_at,
        updated_at
      FROM production_plans;

      DROP TABLE production_plans;

      ALTER TABLE production_plans_v3
        RENAME TO production_plans;

      ${indexStatements}

      CREATE INDEX IF NOT EXISTS
        idx_production_plans_profile_v3
      ON production_plans(profile_id);

      PRAGMA user_version = 3;

      COMMIT;
    `);

  } catch (error) {
    try {
      await db.execAsync('ROLLBACK;');
    } catch {
      // Puede que la transacción ya haya terminado.
    }

    throw error;

  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }

  // Comprobar relaciones después de la migración.
  const violations = await db.getAllAsync(
    'PRAGMA foreign_key_check;'
  );

  if (violations.length > 0) {
    throw new Error(
      'La migración v3 detectó relaciones inválidas'
    );
  }

  console.log(
    'SQLite: migración de planes v3 completada'
  );
}
