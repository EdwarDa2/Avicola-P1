
import { getDatabase } from '../../database';

import {
  createPlanRepository,
} from '../../database/repositories/plan.repository';

import {
  fromStoredPlan,
  toStoredPlanInput,
} from '../mappers/plan.mapper';

import type { Plan } from '../../types';

export const planPersistenceService = {

  // Guardar un plan nuevo.
  async create(plan: Plan): Promise<Plan> {
    const db = await getDatabase();
    const repository = createPlanRepository(db);

    const input = toStoredPlanInput(plan);

    const saved = await repository.create(input);

    return fromStoredPlan(saved);
  },

  // Recuperar un plan por identificador.
  async getById(id: string): Promise<Plan | null> {
    const db = await getDatabase();
    const repository = createPlanRepository(db);

    const saved = await repository.findById(id);

    return saved ? fromStoredPlan(saved) : null;
  },

  // Consultar los planes de una familia.
  async getByFamilyId(
    familyId: string
  ): Promise<Plan[]> {
    const db = await getDatabase();
    const repository = createPlanRepository(db);

    const saved = await repository.findByProfile(
      familyId
    );

    return saved.map(fromStoredPlan);
  },

  // Recuperar planes de todas las familias.
  async getAllForFamilies(
    familyIds: string[]
  ): Promise<Plan[]> {
    const db = await getDatabase();
    const repository = createPlanRepository(db);

    const groups = await Promise.all(
      familyIds.map((id) =>
        repository.findByProfile(id)
      )
    );

    return groups
      .flat()
      .map(fromStoredPlan)
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt)
      );
  },

  // Actualizar el estado de un plan.
  async updateStatus(
    id: string,
    status: Plan['status']
  ): Promise<Plan> {
    const db = await getDatabase();
    const repository = createPlanRepository(db);

    const updated = await repository.update(
      id,
      { status }
    );

    if (!updated) {
      throw new Error(
        'No se encontró el plan que deseas actualizar.'
      );
    }

    return fromStoredPlan(updated);
  },

  // Eliminar un plan.
  async remove(id: string): Promise<void> {
    const db = await getDatabase();
    const repository = createPlanRepository(db);

    const removed = await repository.remove(id);

    if (!removed) {
      throw new Error(
        'No se encontró el plan que deseas eliminar.'
      );
    }
  },
};
