
import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateFamilyMetadata(
  db: SQLiteDatabase
): Promise<void> {
  const result = await db.getFirstAsync<{
    user_version: number;
  }>('PRAGMA user_version;');

  const version = result?.user_version ?? 0;

  // La migración inicial debe haberse ejecutado
  if (version < 1) {
    throw new Error(
      'Primero debe ejecutarse la migración inicial'
    );
  }

  // No repetir una migración ya aplicada
  if (version >= 2) return;

  await db.execAsync(`
    BEGIN TRANSACTION;

    ALTER TABLE profiles
    ADD COLUMN age_counts_json TEXT NOT NULL DEFAULT '{}';

    ALTER TABLE profiles
    ADD COLUMN archived INTEGER NOT NULL DEFAULT 0
      CHECK (archived IN (0, 1));

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_archived
      ON profiles(archived);

    PRAGMA user_version = 2;

    COMMIT;
  `);

  console.log(
    'SQLite: migración de familias v2 completada'
  );
}
