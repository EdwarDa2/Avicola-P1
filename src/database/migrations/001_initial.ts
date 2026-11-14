
import type { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(
  db: SQLiteDatabase
): Promise<void> {
  // Configuración inicial
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // Comprobar versión del esquema
  const result = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version;');

  const version = result?.user_version ?? 0;

  if (version >= 1) {
    return;
  }

  // Primera migración
  await db.execAsync(`
    BEGIN TRANSACTION;

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      children INTEGER NOT NULL DEFAULT 0
        CHECK (children >= 0),
      adolescents INTEGER NOT NULL DEFAULT 0
        CHECK (adolescents >= 0),
      adults INTEGER NOT NULL DEFAULT 0
        CHECK (adults >= 0),
      consumption_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS production_plans (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL
        CHECK (type IN (
          'chicken_eggs',
          'broiler',
          'quail_eggs'
        )),
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN (
          'draft',
          'active',
          'completed'
        )),
      input_json TEXT NOT NULL,
      result_json TEXT NOT NULL,
      calculation_version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      FOREIGN KEY (profile_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY NOT NULL,
      plan_id TEXT NOT NULL,
      name TEXT NOT NULL,
      start_date TEXT,
      status TEXT NOT NULL DEFAULT 'planned',
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      FOREIGN KEY (plan_id)
        REFERENCES production_plans(id)
        ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shopping_items (
      id TEXT PRIMARY KEY NOT NULL,
      plan_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0
        CHECK (quantity >= 0),
      unit TEXT NOT NULL,
      checked INTEGER NOT NULL DEFAULT 0
        CHECK (checked IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      FOREIGN KEY (plan_id)
        REFERENCES production_plans(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_plans_profile
      ON production_plans(profile_id);

    CREATE INDEX IF NOT EXISTS idx_plans_status
      ON production_plans(status);

    CREATE INDEX IF NOT EXISTS idx_batches_plan
      ON batches(plan_id);

    CREATE INDEX IF NOT EXISTS idx_shopping_plan
      ON shopping_items(plan_id);

    PRAGMA user_version = 1;

    COMMIT;
  `);

  console.log('SQLite: migración inicial completada');
}
