
import * as SQLite from 'expo-sqlite';

import { initializeDatabase } from './migrations/001_initial';

import { migrateFamilyMetadata } from './migrations/002_family_metadata';

import { migratePlanCompatibility } from './migrations/003_plan_compatibility';

const DATABASE_NAME = 'planificador_avicola.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync(
        DATABASE_NAME
      );

    
      await initializeDatabase(db);

    
      await migrateFamilyMetadata(db);

       
      await migratePlanCompatibility(db);

      return db;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
