
export interface FamilyProfile {
  id: string;
  name: string;
  children: number;
  adolescents: number;
  adults: number;
  consumption_json: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileInput {
  id: string;
  name: string;
  children: number;
  adolescents: number;
  adults: number;
}

export type UpdateProfileInput = Partial<
  Omit<CreateProfileInput, 'id'>
>;
