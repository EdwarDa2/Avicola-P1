
import * as SQLite from 'expo-sqlite';

import { initializeDatabase } from './migrations/001_initial';

import { migrateFamilyMetadata } from './migrations/002_family_metadata';

const DATABASE_NAME = 'planificador_avicola.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null =
  null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(
        DATABASE_NAME
      );

      // Crear la estructura inicial
      await initializeDatabase(db);

      // Aplicar la migración de familias
      await migrateFamilyMetadata(db);

      return db;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
