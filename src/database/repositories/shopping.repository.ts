
import type { PlanDb } from './plan.repository';

import type {
  ShoppingItem,
  CreateShoppingItemInput,
  UpdateShoppingItemInput,
} from '../../types/shopping.types';

interface ShoppingRow {
  id: string;
  plan_id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: number;
  created_at: string;
  updated_at: string;
}

function mapShoppingItem(row: ShoppingRow): ShoppingItem {
  return {
    id: row.id,
    planId: row.plan_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    checked: row.checked === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateItem(
  item: Pick<
    ShoppingItem,
    'name' | 'quantity' | 'unit' | 'checked'
  >
): void {
  if (!item.name.trim()) {
    throw new Error('El nombre del recurso es obligatorio');
  }

  if (
    !Number.isFinite(item.quantity) ||
    item.quantity < 0
  ) {
    throw new Error(
      'La cantidad debe ser un número válido no negativo'
    );
  }

  if (!item.unit.trim()) {
    throw new Error('La unidad es obligatoria');
  }

  if (typeof item.checked !== 'boolean') {
    throw new Error('El estado adquirido debe ser booleano');
  }
}

export function createShoppingRepository(db: PlanDb) {
  // Consultar un recurso por ID
  async function findById(
    id: string
  ): Promise<ShoppingItem | null> {
    const row = await db.getFirstAsync<ShoppingRow>(
      'SELECT * FROM shopping_items WHERE id = ?',
      [id]
    );

    return row ? mapShoppingItem(row) : null;
  }

  return {
    // CREATE
    async create(
      input: CreateShoppingItemInput
    ): Promise<ShoppingItem> {
      if (!input.id.trim() || !input.planId.trim()) {
        throw new Error(
          'El ID del recurso y del plan son obligatorios'
        );
      }

      const item = {
        name: input.name,
        quantity: input.quantity,
        unit: input.unit,
        checked: input.checked ?? false,
      };

      validateItem(item);

      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO shopping_items (
          id,
          plan_id,
          name,
          quantity,
          unit,
          checked,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          input.planId,
          item.name.trim(),
          item.quantity,
          item.unit.trim(),
          item.checked ? 1 : 0,
          now,
          now,
        ]
      );

      const created = await findById(input.id);

      if (!created) {
        throw new Error('No se pudo recuperar el recurso');
      }

      return created;
    },

    // READ - Por ID
    findById,

    // READ - Recursos de un plan
    async findByPlan(
      planId: string
    ): Promise<ShoppingItem[]> {
      const rows = await db.getAllAsync<ShoppingRow>(
        `SELECT * FROM shopping_items
         WHERE plan_id = ?
         ORDER BY checked ASC, created_at DESC, id DESC`,
        [planId]
      );

      return rows.map(mapShoppingItem);
    },

    // READ - Recursos pendientes
    async findPendingByPlan(
      planId: string
    ): Promise<ShoppingItem[]> {
      const rows = await db.getAllAsync<ShoppingRow>(
        `SELECT * FROM shopping_items
         WHERE plan_id = ? AND checked = 0
         ORDER BY created_at DESC, id DESC`,
        [planId]
      );

      return rows.map(mapShoppingItem);
    },

    // UPDATE
    async update(
      id: string,
      changes: UpdateShoppingItemInput
    ): Promise<ShoppingItem | null> {
      const current = await findById(id);

      if (!current) return null;

      const updated = {
        name: changes.name ?? current.name,
        quantity: changes.quantity ?? current.quantity,
        unit: changes.unit ?? current.unit,
        checked: changes.checked ?? current.checked,
      };

      validateItem(updated);

      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE shopping_items SET
          name = ?,
          quantity = ?,
          unit = ?,
          checked = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          updated.name.trim(),
          updated.quantity,
          updated.unit.trim(),
          updated.checked ? 1 : 0,
          now,
          id,
        ]
      );

      return findById(id);
    },

    // DELETE
    async remove(id: string): Promise<boolean> {
      const result = await db.runAsync(
        'DELETE FROM shopping_items WHERE id = ?',
        [id]
      );

      return result.changes > 0;
    },
  };
}
