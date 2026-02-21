import type {
  Ingredient,
  IngredientWithUsage,
  Menu,
  ParsedRecipe,
  Recipe,
  RecipeIngredientInput,
  RecipeSummary,
  ShoppingList,
} from './types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const authCheck = () => request<{ authenticated: boolean }>('/api/auth/check');
export const login = async (password: string): Promise<{ ok: boolean; error?: string }> => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: body.detail || 'Invalid password' };
  }
  if (!res.ok) {
    return { ok: false, error: `Request failed: ${res.status}` };
  }
  return { ok: true };
};
export const logout = () => request('/api/auth/logout', { method: 'POST' });

// Ingredients
export const getIngredients = (search?: string, category?: string) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  return request<IngredientWithUsage[]>(`/api/ingredients?${params}`);
};
export const createIngredient = (data: Omit<Ingredient, 'id'>) =>
  request<Ingredient>('/api/ingredients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const updateIngredient = (id: number, data: Partial<Ingredient>) =>
  request<Ingredient>(`/api/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteIngredient = (id: number) =>
  request<void>(`/api/ingredients/${id}`, { method: 'DELETE' });

// Recipes
export const getRecipes = (search?: string, tag?: string) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  return request<RecipeSummary[]>(`/api/recipes?${params}`);
};
export const getRecipe = (id: number) => request<Recipe>(`/api/recipes/${id}`);
export const createRecipe = (data: {
  name: string;
  description?: string;
  servings: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  instructions: string;
  tags: string[];
  source_url?: string;
  freezable?: boolean;
  ingredients: RecipeIngredientInput[];
}) =>
  request<Recipe>('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
export const updateRecipe = (id: number, data: Record<string, unknown>) =>
  request<Recipe>(`/api/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteRecipe = (id: number) =>
  request<void>(`/api/recipes/${id}`, { method: 'DELETE' });

// Import
export const importFromUrl = (url: string) =>
  request<ParsedRecipe>('/api/import/url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
export const importFromText = (text: string) =>
  request<ParsedRecipe>('/api/import/text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
export const importFromImage = async (file: File): Promise<ParsedRecipe> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/import/image', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
};

// Menus
export const generateMenu = (week_start: string, servings: number) =>
  request<Menu>('/api/menus/generate', {
    method: 'POST',
    body: JSON.stringify({ week_start, servings }),
  });
export const getMenu = (id: number) => request<Menu>(`/api/menus/${id}`);
export const getCurrentMenu = () => request<Menu | null>('/api/menus/current');
export const updateMenuSlot = (
  menuId: number,
  slotId: number,
  data: { recipe_id?: number; reroll?: boolean }
) =>
  request<Menu>(`/api/menus/${menuId}/slots/${slotId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Shopping
export const getShoppingList = (menuId: number, unitSystem?: string) => {
  const params = unitSystem ? `?unit_system=${unitSystem}` : '';
  return request<ShoppingList>(`/api/menus/${menuId}/shopping-list${params}`);
};
