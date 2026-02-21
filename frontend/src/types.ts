export interface Ingredient {
  id: number;
  name: string;
  category: string;
  perishability: string;
}

export interface IngredientWithUsage extends Ingredient {
  recipe_count: number;
}

export interface RecipeIngredient {
  id: number;
  ingredient_id: number;
  amount: number;
  unit: string;
  ingredient: Ingredient;
}

export interface RecipeIngredientInput {
  ingredient_id: number;
  amount: number;
  unit: string;
}

export interface RecipeSummary {
  id: number;
  name: string;
  description: string | null;
  servings: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[];
  freezable: boolean;
  created_at: string;
}

export interface Recipe extends RecipeSummary {
  instructions: string;
  source_url: string | null;
  ingredients: RecipeIngredient[];
}

export interface MenuSlot {
  id: number;
  day: number;
  meal: string;
  recipe_id: number;
  servings_override: number | null;
  recipe: RecipeSummary;
}

export interface Menu {
  id: number;
  week_start: string;
  servings: number;
  created_at: string;
  slots: MenuSlot[];
}

export interface ShoppingItem {
  ingredient: Ingredient;
  total_amount: number;
  unit: string;
}

export interface ShoppingList {
  menu_id: number;
  items: ShoppingItem[];
}

export interface ParsedIngredient {
  name: string;
  amount: number;
  unit: string;
  matched_ingredient_id: number | null;
}

export interface ParsedRecipe {
  name: string;
  description: string | null;
  servings: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  instructions: string;
  tags: string[];
  source_url: string | null;
  freezable: boolean;
  ingredients: ParsedIngredient[];
}
