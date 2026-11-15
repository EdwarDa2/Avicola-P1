
export interface ShoppingItem {
  id: string;
  planId: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateShoppingItemInput = Pick<
  ShoppingItem,
  'id' | 'planId' | 'name' | 'quantity' | 'unit'
> & Partial<
  Pick<ShoppingItem, 'checked'>
>;

export type UpdateShoppingItemInput = Partial<
  Pick<
    ShoppingItem,
    'name' | 'quantity' | 'unit' | 'checked'
  >
>;
