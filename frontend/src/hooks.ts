import useSWR, { type SWRConfiguration } from 'swr';
import type {
  Ingredient,
  IngredientWithUsage,
  Menu,
  Recipe,
  RecipeSummary,
  ShoppingList,
} from './types';

const keepPreviousData: SWRConfiguration = {
  keepPreviousData: true,
};

// --- Key helpers ---

export function authCheckKey() {
  return '/api/auth/check';
}

export function recipesKey(search?: string, tag?: string, ingredientId?: number) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  if (ingredientId != null) params.set('ingredient_id', String(ingredientId));
  return `/api/recipes?${params}`;
}

export function recipeKey(id?: number) {
  return id != null ? `/api/recipes/${id}` : null;
}

export function ingredientsKey(search?: string, category?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  return `/api/ingredients?${params}`;
}

export function currentMenuKey() {
  return '/api/menus/current';
}

export function shoppingListKey(menuId?: number, unitSystem?: string) {
  if (menuId == null) return null;
  const params = unitSystem ? `?unit_system=${unitSystem}` : '';
  return `/api/menus/${menuId}/shopping-list${params}`;
}

export function recipeSuggestionsKey(excludeIds?: number[], limit?: number) {
  const params = new URLSearchParams();
  if (excludeIds && excludeIds.length > 0) params.set('exclude_ids', excludeIds.join(','));
  if (limit != null) params.set('limit', String(limit));
  return `/api/recipes/suggestions?${params}`;
}

function ingredientSearchKey(query: string) {
  return query ? `/api/ingredients?search=${encodeURIComponent(query)}` : null;
}

// --- Hooks ---

export function useAuthCheck() {
  return useSWR<{ authenticated: boolean }>(authCheckKey());
}

export function useRecipes(search?: string, tag?: string, ingredientId?: number) {
  return useSWR<RecipeSummary[]>(recipesKey(search, tag, ingredientId), keepPreviousData);
}

export function useRecipe(id?: number) {
  return useSWR<Recipe>(recipeKey(id));
}

export function useIngredients(search?: string, category?: string) {
  return useSWR<IngredientWithUsage[]>(ingredientsKey(search, category), keepPreviousData);
}

export function useCurrentMenu() {
  return useSWR<Menu | null>(currentMenuKey());
}

export function useShoppingList(menuId?: number, unitSystem?: string) {
  return useSWR<ShoppingList>(shoppingListKey(menuId, unitSystem));
}

export function useRecipeSuggestions(excludeIds?: number[], limit?: number) {
  return useSWR<RecipeSummary[]>(recipeSuggestionsKey(excludeIds, limit));
}

export function useIngredientSearch(query: string) {
  return useSWR<Ingredient[]>(ingredientSearchKey(query));
}
