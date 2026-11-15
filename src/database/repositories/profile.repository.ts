
import type { PlanDb } from './plan.repository';

import type {
  FamilyProfile,
  CreateProfileInput,
  UpdateProfileInput,
} from '../../types/profile.types';

// Validaciones de los datos familiares
function validateProfile(
  input: CreateProfileInput
): void {
  if (!input.id.trim()) {
    throw new Error(
      'El identificador del perfil es obligatorio'
    );
  }

  if (!input.name.trim()) {
    throw new Error(
      'El nombre del perfil es obligatorio'
    );
  }

  const quantities = [
    input.children,
    input.adolescents,
    input.adults,
  ];

  if (
    quantities.some(
      (value) =>
        !Number.isInteger(value) || value < 0
    )
  ) {
    throw new Error(
      'Las cantidades deben ser enteros no negativos'
    );
  }
}

// Repositorio con conexión inyectable
export function createProfileRepository(db: PlanDb) {
  // READ - Obtener perfil por ID
  async function findById(
    id: string
  ): Promise<FamilyProfile | null> {
    return db.getFirstAsync<FamilyProfile>(
      'SELECT * FROM profiles WHERE id = ?',
      [id]
    );
  }

  return {
    // CREATE - Crear perfil
    async create(
      input: CreateProfileInput
    ): Promise<FamilyProfile> {
      validateProfile(input);

      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO profiles (
          id,
          name,
          children,
          adolescents,
          adults,
          consumption_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.name.trim(),
          input.children,
          input.adolescents,
          input.adults,
          '{}',
          now,
          now,
        ]
      );

      const created = await findById(input.id);

      if (!created) {
        throw new Error(
          'No se pudo recuperar el perfil creado'
        );
      }

      return created;
    },

    // READ - Obtener todos los perfiles
    async findAll(): Promise<FamilyProfile[]> {
      return db.getAllAsync<FamilyProfile>(
        `SELECT * FROM profiles
         ORDER BY created_at DESC, id DESC`,
        []
      );
    },

    // READ - Obtener por ID
    findById,

    // UPDATE - Actualizar perfil
    async update(
      id: string,
      changes: UpdateProfileInput
    ): Promise<FamilyProfile | null> {
      const current = await findById(id);

      if (!current) {
        return null;
      }

      const updated: CreateProfileInput = {
        id,
        name: changes.name ?? current.name,
        children:
          changes.children ?? current.children,
        adolescents:
          changes.adolescents ?? current.adolescents,
        adults:
          changes.adults ?? current.adults,
      };

      validateProfile(updated);

      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE profiles SET
          name = ?,
          children = ?,
          adolescents = ?,
          adults = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          updated.name.trim(),
          updated.children,
          updated.adolescents,
          updated.adults,
          now,
          id,
        ]
      );

      return findById(id);
    },

    // DELETE - Eliminar perfil
    async remove(id: string): Promise<boolean> {
      const result = await db.runAsync(
        'DELETE FROM profiles WHERE id = ?',
        [id]
      );

      return result.changes > 0;
    },
  };
}

// Compatibilidad con las funciones anteriores.
// La conexión Expo se carga solo cuando se utiliza.
async function getNativeProfileRepository() {
  const { getDatabase } = await import('../index');
  const db = await getDatabase();

  return createProfileRepository(db);
}

export async function createProfile(
  input: CreateProfileInput
): Promise<FamilyProfile> {
  const repository = await getNativeProfileRepository();
  return repository.create(input);
}

export async function getProfiles(): Promise<FamilyProfile[]> {
  const repository = await getNativeProfileRepository();
  return repository.findAll();
}

export async function getProfileById(
  id: string
): Promise<FamilyProfile | null> {
  const repository = await getNativeProfileRepository();
  return repository.findById(id);
}

export async function updateProfile(
  id: string,
  changes: UpdateProfileInput
): Promise<FamilyProfile | null> {
  const repository = await getNativeProfileRepository();
  return repository.update(id, changes);
}

export async function deleteProfile(
  id: string
): Promise<boolean> {
  const repository = await getNativeProfileRepository();
  return repository.remove(id);
}
