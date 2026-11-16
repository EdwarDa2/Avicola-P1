
import { getDatabase } from '../../database';

import {
  createFamilyRepository,
} from '../../database/repositories/family.repository';

import type {
  Family,
  AgeGroupKey,
} from '../../types';

async function getRepository() {
  const db = await getDatabase();
  return createFamilyRepository(db);
}

export const familyService = {
  async getAll(): Promise<Family[]> {
    const repo = await getRepository();
    return repo.findAll();
  },

  async getById(id: string) {
    const repo = await getRepository();
    return repo.findById(id);
  },

  async create(family: Family): Promise<Family> {
    const repo = await getRepository();
    return repo.create(family);
  },

  async update(
    id: string,
    name: string,
    ageCounts: Record<AgeGroupKey, number>
  ) {
    const repo = await getRepository();
    return repo.update(id, name, ageCounts);
  },

  async archive(id: string) {
    const repo = await getRepository();
    return repo.setArchived(id, true);
  },

  async restore(id: string) {
    const repo = await getRepository();
    return repo.setArchived(id, false);
  },

  async getSelectedFamilyId() {
    const repo = await getRepository();
    return repo.getSelectedFamilyId();
  },

  async setSelectedFamilyId(id: string | null) {
    const repo = await getRepository();
    await repo.setSelectedFamilyId(id);
  },
};
