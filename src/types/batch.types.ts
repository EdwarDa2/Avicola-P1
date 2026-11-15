
export type BatchStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface ProductionBatch {
  id: string;
  planId: string;
  name: string;
  startDate: string | null;
  status: BatchStatus;
  details: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type CreateBatchInput = Pick<
  ProductionBatch,
  'id' | 'planId' | 'name'
> & Partial<
  Pick<
    ProductionBatch,
    'startDate' | 'status' | 'details'
  >
>;

export type UpdateBatchInput = Partial<
  Pick<
    ProductionBatch,
    'name' | 'startDate' | 'status' | 'details'
  >
>;
