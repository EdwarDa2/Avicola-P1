
import { getDatabase } from '../../database';

import {
  createPlanRepository,
} from '../../database/repositories/plan.repository';

import {
  fromStoredPlan,
  toStoredPlanInput,
} from '../mappers/plan.mapper';

import type { Plan } from '../../types';
import type { ProductionPlan } from '../../types/plan.types';

// Resultado de leer planes: los que sí se pudieron interpretar
// y cuántas filas hubo que descartar.
export type PlansReadResult = {
  plans: Plan[];
  skipped: number;
};

// Interpretar las filas de SQLite sin que una fila ilegible
// invalide el resto de la lista.
function mapStoredPlans(
  rows: ProductionPlan[]
): PlansReadResult {
  const plans: Plan[] = [];
  let skipped = 0;

  for (const row of rows) {
    try {
      plans.push(fromStoredPlan(row));
    } catch (error) {
      skipped += 1;

      console.warn(
        'Plan omitido porque no se pudo interpretar:',
        row.id,
        error
      );
    }
  }

  return { plans, skipped };
}

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
  ): Promise<PlansReadResult> {
    const db = await getDatabase();
    const repository = createPlanRepository(db);

    const saved = await repository.findByProfile(
      familyId
    );

    return mapStoredPlans(saved);
  },

  // Recuperar planes de todas las familias.
  async getAllForFamilies(
    familyIds: string[]
  ): Promise<PlansReadResult> {
    const db = await getDatabase();
    const repository = createPlanRepository(db);

    const groups = await Promise.all(
      familyIds.map((id) =>
        repository.findByProfile(id)
      )
    );

    const { plans, skipped } = mapStoredPlans(
      groups.flat()
    );

    plans.sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt)
    );

    return { plans, skipped };
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
