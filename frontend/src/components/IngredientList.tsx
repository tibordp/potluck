import { Fragment, type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createIngredient, deleteIngredient, getIngredients, updateIngredient } from '../api';
import { useToast } from './Toast';
import { categoryEmoji } from '../helpers';
import type { IngredientWithUsage } from '../types';

const CATEGORIES = ['produce', 'meat', 'dairy', 'pantry', 'frozen', 'spice', 'other'];
const PERISHABILITIES = ['few-days', 'one-week', 'two-weeks', 'one-month', 'long-lasting'];

const PERISHABILITY_CLASSES: Record<string, string> = {
  'few-days': 'bg-red-50 text-red-600',
  'one-week': 'bg-amber-50 text-amber-600',
  'two-weeks': 'bg-yellow-50 text-yellow-600',
  'one-month': 'bg-blue-50 text-blue-600',
  'long-lasting': 'bg-gray-100 text-gray-600',
};

function InlineEditForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: { name: string; category: string; perishability: string };
  onSave: (data: { name: string; category: string; perishability: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState(initial.category);
  const [perishability, setPerishability] = useState(initial.perishability);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ name, category, perishability });
  };

  return (
    <tr>
      <td colSpan={5} className="px-4 py-3 bg-brand-50 border-t border-brand-100">
        <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryEmoji(c)} {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Perishability</label>
            <select
              value={perishability}
              onChange={(e) => setPerishability(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {PERISHABILITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
          >
            ✓ Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </form>
      </td>
    </tr>
  );
}

type SortKey = 'name' | 'category' | 'perishability' | 'recipe_count';
type SortDir = 'asc' | 'desc';

const PERISHABILITY_RANK: Record<string, number> = {
  'few-days': 0,
  'one-week': 1,
  'two-weeks': 2,
  'one-month': 3,
  'long-lasting': 4,
};

function sortIngredients(
  list: IngredientWithUsage[],
  key: SortKey,
  dir: SortDir
): IngredientWithUsage[] {
  const sorted = [...list].sort((a, b) => {
    let cmp: number;
    if (key === 'perishability') {
      cmp =
        (PERISHABILITY_RANK[a.perishability] ?? 99) - (PERISHABILITY_RANK[b.perishability] ?? 99);
    } else if (key === 'recipe_count') {
      cmp = a.recipe_count - b.recipe_count;
    } else {
      cmp = a[key].localeCompare(b[key]);
    }
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

export default function IngredientList() {
  const [ingredients, setIngredients] = useState<IngredientWithUsage[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('other');
  const [newPerishability, setNewPerishability] = useState('long-lasting');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const toast = useToast();

  const load = () => {
    getIngredients(search || undefined, filterCategory || undefined).then(setIngredients);
  };

  useEffect(load, [search, filterCategory]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const sorted = sortIngredients(ingredients, sortKey, sortDir);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    await createIngredient({
      name: newName,
      category: newCategory,
      perishability: newPerishability,
    });
    toast('Ingredient added');
    setNewName('');
    setNewCategory('other');
    setNewPerishability('long-lasting');
    setShowNewForm(false);
    load();
  };

  const handleUpdate = async (
    id: number,
    data: { name: string; category: string; perishability: string }
  ) => {
    await updateIngredient(id, data);
    toast('Ingredient updated');
    setEditId(null);
    load();
  };

  const handleDelete = async (ing: IngredientWithUsage) => {
    if (!confirm(`Delete "${ing.name}"?`)) return;
    try {
      await deleteIngredient(ing.id);
      toast('Ingredient deleted');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'An error occurred', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Ingredients</h1>
        <button
          onClick={() => {
            setShowNewForm(!showNewForm);
            setEditId(null);
          }}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            showNewForm
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm'
          }`}
        >
          {showNewForm ? 'Cancel' : '+ New Ingredient'}
        </button>
      </div>

      {showNewForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex gap-3 items-end flex-wrap"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryEmoji(c)} {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Perishability</label>
            <select
              value={newPerishability}
              onChange={(e) => setNewPerishability(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              {PERISHABILITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
          >
            + Add
          </button>
        </form>
      )}

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients..."
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryEmoji(c)} {c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {(
                [
                  ['name', 'Name'],
                  ['category', 'Category'],
                  ['perishability', 'Perishability'],
                  ['recipe_count', 'Used in'],
                ] as const
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 transition-colors"
                >
                  {label}
                  <span className="text-xs text-gray-400">{sortIndicator(key)}</span>
                </th>
              ))}
              <th className="px-4 py-3 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((ing) => {
              const isEditing = editId === ing.id;
              const isOrphan = ing.recipe_count === 0;
              return (
                <Fragment key={ing.id}>
                  <tr
                    className={`border-t border-gray-50 transition-colors ${
                      isEditing ? 'bg-brand-50/50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-medium text-gray-800">{ing.name}</td>
                    <td className="px-4 py-2.5 capitalize text-gray-600">
                      {categoryEmoji(ing.category)} {ing.category}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          PERISHABILITY_CLASSES[ing.perishability] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ing.perishability}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {isOrphan ? (
                        <span className="text-xs text-gray-400 italic">unused</span>
                      ) : (
                        <Link
                          to={`/recipes?ingredient_id=${ing.id}&ingredient_name=${encodeURIComponent(ing.name)}`}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          {ing.recipe_count} {ing.recipe_count === 1 ? 'recipe' : 'recipes'}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditId(isEditing ? null : ing.id);
                            setShowNewForm(false);
                          }}
                          className={`text-xs font-medium transition-colors ${
                            isEditing
                              ? 'text-gray-500 hover:text-gray-700'
                              : 'text-brand-600 hover:text-brand-700'
                          }`}
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                        {isOrphan && (
                          <button
                            onClick={() => handleDelete(ing)}
                            className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isEditing && (
                    <InlineEditForm
                      initial={{
                        name: ing.name,
                        category: ing.category,
                        perishability: ing.perishability,
                      }}
                      onSave={(data) => handleUpdate(ing.id, data)}
                      onCancel={() => setEditId(null)}
                    />
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {ingredients.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🥕</div>
            <p className="text-gray-500">No ingredients found</p>
          </div>
        )}
      </div>
    </div>
  );
}
