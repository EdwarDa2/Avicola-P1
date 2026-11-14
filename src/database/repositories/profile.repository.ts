
import { getDatabase } from '../index';

import type {
  FamilyProfile,
  CreateProfileInput,
  UpdateProfileInput,
} from '../../types/profile.types';

// Validar información del perfil
function validateProfile(input: CreateProfileInput): void {
  if (!input.id.trim()) {
    throw new Error('El identificador es obligatorio');
  }

  if (!input.name.trim()) {
    throw new Error('El nombre es obligatorio');
  }

  const quantities = [
    input.children,
    input.adolescents,
    input.adults,
  ];

  if (
    quantities.some(
      (value) => !Number.isInteger(value) || value < 0
    )
  ) {
    throw new Error(
      'Las cantidades deben ser enteros no negativos'
    );
  }
}

// CREATE - Crear un perfil
export async function createProfile(
  input: CreateProfileInput
): Promise<FamilyProfile> {
  validateProfile(input);

  const db = await getDatabase();
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

  return {
    ...input,
    name: input.name.trim(),
    consumption_json: '{}',
    created_at: now,
    updated_at: now,
  };
}

// READ - Obtener todos los perfiles
export async function getProfiles(): Promise<FamilyProfile[]> {
  const db = await getDatabase();

  return db.getAllAsync<FamilyProfile>(
    'SELECT * FROM profiles ORDER BY created_at DESC'
  );
}

// READ - Obtener un perfil por ID
export async function getProfileById(
  id: string
): Promise<FamilyProfile | null> {
  const db = await getDatabase();

  return db.getFirstAsync<FamilyProfile>(
    'SELECT * FROM profiles WHERE id = ?',
    [id]
  );
}

// UPDATE - Actualizar un perfil
export async function updateProfile(
  id: string,
  changes: UpdateProfileInput
): Promise<FamilyProfile | null> {
  const current = await getProfileById(id);

  if (!current) {
    return null;
  }

  const updated = {
    id,
    name: changes.name ?? current.name,
    children: changes.children ?? current.children,
    adolescents:
      changes.adolescents ?? current.adolescents,
    adults: changes.adults ?? current.adults,
  };

  validateProfile(updated);

  const db = await getDatabase();
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

  return getProfileById(id);
}

// DELETE - Eliminar un perfil
export async function deleteProfile(
  id: string
): Promise<boolean> {
  const db = await getDatabase();

  const result = await db.runAsync(
    'DELETE FROM profiles WHERE id = ?',
    [id]
  );

  return result.changes > 0;
}
