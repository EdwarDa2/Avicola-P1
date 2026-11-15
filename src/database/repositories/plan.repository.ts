
import type {
  ProductionPlan,
  CreatePlanInput,
  UpdatePlanInput,
  PlanData,
  ProductionType,
  PlanStatus,
} from '../../types/plan.types';

type SqlValue = string | number | null;

export interface PlanDb {
  runAsync(
    sql: string,
    params: SqlValue[]
  ): Promise<{ changes: number }>;

  getFirstAsync<T>(
    sql: string,
    params: SqlValue[]
  ): Promise<T | null>;

  getAllAsync<T>(
    sql: string,
    params: SqlValue[]
  ): Promise<T[]>;
}

interface PlanRow {
  id: string;
  profile_id: string;
  name: string;
  type: ProductionType;
  status: PlanStatus;
  input_json: string;
  result_json: string;
  calculation_version: number;
  created_at: string;
  updated_at: string;
}

function mapPlan(row: PlanRow): ProductionPlan {
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    type: row.type,
    status: row.status,
    inputs: JSON.parse(row.input_json) as PlanData,
    results: JSON.parse(row.result_json) as PlanData,
    calculationVersion: row.calculation_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePlan(
  input: Pick<
    ProductionPlan,
    'name' | 'inputs' | 'results' | 'calculationVersion'
  >
): void {
  if (!input.name.trim()) {
    throw new Error('El nombre del plan es obligatorio');
  }

  if (
    !Number.isInteger(input.calculationVersion) ||
    input.calculationVersion < 1
  ) {
    throw new Error('Versión de cálculo inválida');
  }

  for (const data of [input.inputs, input.results]) {
    if (
      data === null ||
      typeof data !== 'object' ||
      Array.isArray(data)
    ) {
      throw new Error('Los datos deben ser objetos JSON');
    }
  }
}

export function createPlanRepository(db: PlanDb) {
  async function findById(
    id: string
  ): Promise<ProductionPlan | null> {
    const row = await db.getFirstAsync<PlanRow>(
      'SELECT * FROM production_plans WHERE id = ?',
      [id]
    );

    return row ? mapPlan(row) : null;
  }

  return {
    // CREATE
    async create(
      input: CreatePlanInput
    ): Promise<ProductionPlan> {
      const status = input.status ?? 'draft';
      const calculationVersion =
        input.calculationVersion ?? 1;

      if (!input.id.trim() || !input.profileId.trim()) {
        throw new Error('ID del plan y perfil obligatorios');
      }

      validatePlan({
        name: input.name,
        inputs: input.inputs,
        results: input.results,
        calculationVersion,
      });

      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO production_plans (
          id, profile_id, name, type, status,
          input_json, result_json, calculation_version,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.profileId,
          input.name.trim(),
          input.type,
          status,
          JSON.stringify(input.inputs),
          JSON.stringify(input.results),
          calculationVersion,
          now,
          now,
        ]
      );

      const created = await findById(input.id);

      if (!created) {
        throw new Error('No se pudo recuperar el plan');
      }

      return created;
    },

    // READ
    findById,

    async findByProfile(
      profileId: string
    ): Promise<ProductionPlan[]> {
      const rows = await db.getAllAsync<PlanRow>(
        `SELECT * FROM production_plans
         WHERE profile_id = ?
         ORDER BY created_at DESC`,
        [profileId]
      );

      return rows.map(mapPlan);
    },

    // UPDATE
    async update(
      id: string,
      changes: UpdatePlanInput
    ): Promise<ProductionPlan | null> {
      const current = await findById(id);

      if (!current) return null;

      const updated = {
        name: changes.name ?? current.name,
        status: changes.status ?? current.status,
        inputs: changes.inputs ?? current.inputs,
        results: changes.results ?? current.results,
        calculationVersion:
          changes.calculationVersion ??
          current.calculationVersion,
      };

      validatePlan(updated);

      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE production_plans SET
          name = ?,
          status = ?,
          input_json = ?,
          result_json = ?,
          calculation_version = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          updated.name.trim(),
          updated.status,
          JSON.stringify(updated.inputs),
          JSON.stringify(updated.results),
          updated.calculationVersion,
          now,
          id,
        ]
      );

      return findById(id);
    },

    // DELETE
    async remove(id: string): Promise<boolean> {
      const result = await db.runAsync(
        'DELETE FROM production_plans WHERE id = ?',
        [id]
      );

      return result.changes > 0;
    },
  };
}
