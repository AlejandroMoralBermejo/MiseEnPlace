export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface MealType {
  id: number;
  name: string;
}

export interface Meal {
  id: string;
  name: string;
  ingredients: string[] | null;
  preparation: string | null;
  date: string;
  meal_type_id: number;
  responsible_id: string | null;
  created_at: string;
  updated_at: string;
  meal_types?: MealType;
  profiles?: Profile;
  responsible?: Profile;
}

export interface InventoryItem {
  id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: number;
  ingredient_name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  date: string | null;
  created_at: string;
}

export interface MealFormData {
  name: string;
  ingredients: string[];
  preparation: string;
  date: string;
  meal_type_id: number;
  responsible_id: string;
}

export interface InventoryFormData {
  ingredient_name: string;
  quantity: number;
  unit: string;
}

export interface ShoppingFormData {
  ingredient_name: string;
  quantity: number;
  unit: string;
}