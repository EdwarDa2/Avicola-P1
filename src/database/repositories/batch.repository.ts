
import type { PlanDb } from './plan.repository';

import type {
  ProductionBatch,
  CreateBatchInput,
  UpdateBatchInput,
  BatchStatus,
} from '../../types/batch.types';

interface BatchRow {
  id: string;
  plan_id: string;
  name: string;
  start_date: string | null;
  status: BatchStatus;
  details_json: string;
  created_at: string;
  updated_at: string;
}

const VALID_STATUSES: BatchStatus[] = [
  'planned',
  'active',
  'completed',
  'cancelled',
];

function mapBatch(row: BatchRow): ProductionBatch {
  return {
    id: row.id,
    planId: row.plan_id,
    name: row.name,
    startDate: row.start_date,
    status: row.status,
    details: JSON.parse(row.details_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function validateBatch(
  batch: Pick<
    ProductionBatch,
    'name' | 'startDate' | 'status' | 'details'
  >
): void {
  if (!batch.name.trim()) {
    throw new Error('El nombre del lote es obligatorio');
  }

  if (!VALID_STATUSES.includes(batch.status)) {
    throw new Error('Estado del lote inválido');
  }

  if (
    batch.startDate !== null &&
    !isValidDate(batch.startDate)
  ) {
    throw new Error(
      'La fecha debe tener formato YYYY-MM-DD'
    );
  }

  if (
    batch.details === null ||
    typeof batch.details !== 'object' ||
    Array.isArray(batch.details)
  ) {
    throw new Error(
      'Los detalles deben ser un objeto JSON'
    );
  }
}

export function createBatchRepository(db: PlanDb) {
  // READ - Buscar por ID
  async function findById(
    id: string
  ): Promise<ProductionBatch | null> {
    const row = await db.getFirstAsync<BatchRow>(
      'SELECT * FROM batches WHERE id = ?',
      [id]
    );

    return row ? mapBatch(row) : null;
  }

  return {
    // CREATE - Crear lote
    async create(
      input: CreateBatchInput
    ): Promise<ProductionBatch> {
      if (!input.id.trim() || !input.planId.trim()) {
        throw new Error(
          'El ID del lote y del plan son obligatorios'
        );
      }

      const batch = {
        name: input.name,
        startDate: input.startDate ?? null,
        status: input.status ?? 'planned',
        details: input.details ?? {},
      };

      validateBatch(batch);

      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO batches (
          id,
          plan_id,
          name,
          start_date,
          status,
          details_json,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.planId,
          batch.name.trim(),
          batch.startDate,
          batch.status,
          JSON.stringify(batch.details),
          now,
          now,
        ]
      );

      const created = await findById(input.id);

      if (!created) {
        throw new Error('No se pudo recuperar el lote');
      }

      return created;
    },

    // READ - Consultar lote
    findById,

    // READ - Consultar lotes de un plan
    async findByPlan(
      planId: string
    ): Promise<ProductionBatch[]> {
      const rows = await db.getAllAsync<BatchRow>(
        `SELECT * FROM batches
         WHERE plan_id = ?
         ORDER BY created_at DESC, id DESC`,
        [planId]
      );

      return rows.map(mapBatch);
    },

    // UPDATE - Actualizar lote
    async update(
      id: string,
      changes: UpdateBatchInput
    ): Promise<ProductionBatch | null> {
      const current = await findById(id);

      if (!current) return null;

      const updated = {
        name: changes.name ?? current.name,
        startDate:
          changes.startDate !== undefined
            ? changes.startDate
            : current.startDate,
        status: changes.status ?? current.status,
        details: changes.details ?? current.details,
      };

      validateBatch(updated);

      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE batches SET
          name = ?,
          start_date = ?,
          status = ?,
          details_json = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          updated.name.trim(),
          updated.startDate,
          updated.status,
          JSON.stringify(updated.details),
          now,
          id,
        ]
      );

      return findById(id);
    },

    // DELETE - Eliminar lote
    async remove(id: string): Promise<boolean> {
      const result = await db.runAsync(
        'DELETE FROM batches WHERE id = ?',
        [id]
      );

      return result.changes > 0;
    },
  };
}
