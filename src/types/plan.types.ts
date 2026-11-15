
export type ProductionType =
  | 'chicken_eggs'
  | 'broiler'
  | 'quail_eggs';

export type PlanStatus =
  | 'draft'
  | 'active'
  | 'completed';

export type PlanData = Record<string, unknown>;

export interface ProductionPlan {
  id: string;
  profileId: string;
  name: string;
  type: ProductionType;
  status: PlanStatus;
  inputs: PlanData;
  results: PlanData;
  calculationVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type CreatePlanInput = Pick<
  ProductionPlan,
  'id' | 'profileId' | 'name' | 'type' | 'inputs' | 'results'
> & Partial<
  Pick<ProductionPlan, 'status' | 'calculationVersion'>
>;

export type UpdatePlanInput = Partial<
  Pick<
    ProductionPlan,
    | 'name'
    | 'status'
    | 'inputs'
    | 'results'
    | 'calculationVersion'
  >
>;
