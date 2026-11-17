
import type { PlanDb } from './plan.repository';
import type { Family, AgeGroupKey } from '../../types';

const AGE_GROUPS: AgeGroupKey[] = [
  '0-3',
  '4-8',
  '9-13',
  '14-18',
  '19+',
];

interface FamilyRow {
  id: string;
  name: string;
  children: number;
  adolescents: number;
  adults: number;
  age_counts_json: string;
  archived: number;
  created_at: string;
  updated_at: string;
}

function validateAgeCounts(
  counts: Record<AgeGroupKey, number>
): void {
  for (const group of AGE_GROUPS) {
    const value = counts[group];

    if (!Number.isInteger(value) || value < 0) {
      throw new Error(
        `Cantidad inválida para el grupo ${group}`
      );
    }
  }
}

function getTotals(counts: Record<AgeGroupKey, number>) {
  return {
    children:
      counts['0-3'] +
      counts['4-8'] +
      counts['9-13'],
    adolescents: counts['14-18'],
    adults: counts['19+'],
  };
}

function mapFamily(row: FamilyRow): Family {
  const parsed: unknown = JSON.parse(row.age_counts_json);

  if (
    parsed === null ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    throw new Error('Grupos de edad inválidos en SQLite');
  }

  const values = parsed as Partial<
    Record<AgeGroupKey, number>
  >;

  // Los registros antiguos pueden carecer del desglose.
  // Evitamos inventar edades al recuperarlos.
  const hasAllGroups = AGE_GROUPS.every(
    (key) => values[key] !== undefined
  );

  if (!hasAllGroups) {
    if (row.children + row.adolescents + row.adults > 0) {
      throw new Error(
        `El perfil ${row.id} requiere revisar sus grupos de edad`
      );
    }

    for (const key of AGE_GROUPS) {
      values[key] = 0;
    }
  }

  const ageCounts = values as Record<AgeGroupKey, number>;
  validateAgeCounts(ageCounts);

  return {
    id: row.id,
    name: row.name,
    archived: row.archived === 1,
    ageCounts,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createFamilyRepository(db: PlanDb) {
  async function findById(
    id: string
  ): Promise<Family | null> {
    const row = await db.getFirstAsync<FamilyRow>(
      'SELECT * FROM profiles WHERE id = ?',
      [id]
    );

    return row ? mapFamily(row) : null;
  }

  return {
    findById,

    // Recuperar todas las familias
    async findAll(): Promise<Family[]> {
      const rows = await db.getAllAsync<FamilyRow>(
        `SELECT * FROM profiles
         ORDER BY created_at DESC, id DESC`,
        []
      );

      return rows.map(mapFamily);
    },

    // Crear una familia
    async create(family: Family): Promise<Family> {
      if (!family.id.trim() || !family.name.trim()) {
        throw new Error(
          'El identificador y nombre son obligatorios'
        );
      }

      validateAgeCounts(family.ageCounts);

      const totals = getTotals(family.ageCounts);

      await db.runAsync(
        `INSERT INTO profiles (
          id, name, children, adolescents, adults,
          consumption_json, age_counts_json, archived,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          family.id,
          family.name.trim(),
          totals.children,
          totals.adolescents,
          totals.adults,
          '{}',
          JSON.stringify(family.ageCounts),
          family.archived ? 1 : 0,
          family.createdAt,
          family.updatedAt,
        ]
      );

      const saved = await findById(family.id);

      if (!saved) {
        throw new Error('No se pudo guardar la familia');
      }

      return saved;
    },

    // Actualizar nombre y composición familiar
    async update(
      id: string,
      name: string,
      ageCounts: Record<AgeGroupKey, number>
    ): Promise<Family | null> {
      if (!name.trim()) {
        throw new Error('El nombre es obligatorio');
      }

      validateAgeCounts(ageCounts);

      const existing = await findById(id);
      if (!existing) return null;

      const totals = getTotals(ageCounts);
      const now = new Date().toISOString();

      await db.runAsync(
        `UPDATE profiles SET
          name = ?,
          children = ?,
          adolescents = ?,
          adults = ?,
          age_counts_json = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          name.trim(),
          totals.children,
          totals.adolescents,
          totals.adults,
          JSON.stringify(ageCounts),
          now,
          id,
        ]
      );

      return findById(id);
    },

    // Archivar o restaurar una familia
    async setArchived(
      id: string,
      archived: boolean
    ): Promise<boolean> {
      const result = await db.runAsync(
        `UPDATE profiles
         SET archived = ?, updated_at = ?
         WHERE id = ?`,
        [
          archived ? 1 : 0,
          new Date().toISOString(),
          id,
        ]
      );

      return result.changes > 0;
    },

    // Recuperar la familia seleccionada
    async getSelectedFamilyId(): Promise<string | null> {
      const row = await db.getFirstAsync<{
        value: string | null;
      }>(
        'SELECT value FROM app_settings WHERE key = ?',
        ['active_family_id']
      );

      return row?.value ?? null;
    },

    // Guardar la familia seleccionada
    async setSelectedFamilyId(
      id: string | null
    ): Promise<void> {
      await db.runAsync(
        `INSERT INTO app_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key)
         DO UPDATE SET value = excluded.value`,
        ['active_family_id', id]
      );
    },
  };
}
