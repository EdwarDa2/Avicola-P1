
import { getDatabase } from '../../database';

import {
  createProfileRepository,
} from '../../database/repositories/profile.repository';

import type {
  CreateProfileInput,
  UpdateProfileInput,
} from '../../types/profile.types';

// Obtener el repositorio con conexión SQLite
async function getProfilesRepository() {
  const db = await getDatabase();
  return createProfileRepository(db);
}

// Consultar todas las familias
export async function listFamilies() {
  const repository = await getProfilesRepository();
  return repository.findAll();
}

// Consultar familia por ID
export async function findFamily(id: string) {
  const repository = await getProfilesRepository();
  return repository.findById(id);
}

// Registrar familia
export async function saveFamily(
  data: CreateProfileInput
) {
  const repository = await getProfilesRepository();
  return repository.create(data);
}

// Actualizar familia
export async function editFamily(
  id: string,
  changes: UpdateProfileInput
) {
  const repository = await getProfilesRepository();
  return repository.update(id, changes);
}

// Eliminar familia
export async function removeFamily(id: string) {
  const repository = await getProfilesRepository();
  return repository.remove(id);
}
