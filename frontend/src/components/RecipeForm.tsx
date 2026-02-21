import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createIngredient, createRecipe, getIngredients, getRecipe, updateRecipe } from '../api';
import { useToast } from './Toast';
import type { Ingredient, RecipeIngredientInput } from '../types';

interface IngredientRow extends RecipeIngredientInput {
  name: string;
}

function IngredientAutocomplete({
  allIngredients,
  value,
  onChange,
  onAddNew,
}: {
  allIngredients: Ingredient[];
  value: { id: number; name: string };
  onChange: (ing: Ingredient) => void;
  onAddNew: (name: string) => void;
}) {
  const [query, setQuery] = useState(value.name);
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync display when parent value changes (e.g. after creating new ingredient)
  const [prevName, setPrevName] = useState(value.name);
  if (value.name !== prevName) {
    setPrevName(value.name);
    setQuery(value.name);
  }

  const filtered = query.trim()
    ? allIngredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    : allIngredients;

  const exactMatch = allIngredients.some(
    (i) => i.name.toLowerCase() === query.trim().toLowerCase()
  );
  const showCreate = query.trim().length > 0 && !exactMatch;

  const options = filtered.slice(0, 8);
  const totalOptions = options.length + (showCreate ? 1 : 0);

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setHighlightIdx(0);
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Reset to current value if user clicked away without selecting
        setQuery(value.name);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value.name]);

  const selectIngredient = (ing: Ingredient) => {
    onChange(ing);
    setQuery(ing.name);
    setOpen(false);
  };

  const handleCreate = () => {
    onAddNew(query.trim());
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, totalOptions - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIdx < options.length) {
        selectIngredient(options[highlightIdx]);
      } else if (showCreate) {
        handleCreate();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(value.name);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search ingredient..."
        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
      />
      {open && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {options.map((ing, idx) => (
            <button
              key={ing.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectIngredient(ing)}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                idx === highlightIdx
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {ing.name}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCreate}
              className={`w-full text-left px-3 py-1.5 text-sm border-t border-gray-100 transition-colors ${
                highlightIdx === options.length
                  ? 'bg-green-50 text-green-700'
                  : 'text-green-600 hover:bg-green-50'
              }`}
            >
              + Create "{query.trim()}"
            </button>
          )}
          {options.length === 0 && !showCreate && (
            <div className="px-3 py-3 text-sm text-gray-400 text-center">No ingredients found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecipeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState<number | ''>(4);
  const [prepTime, setPrepTime] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [instructions, setInstructions] = useState('');
  const [tags, setTags] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [freezable, setFreezable] = useState(false);
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getIngredients().then(setAllIngredients);
  }, []);

  useEffect(() => {
    if (isEdit) {
      getRecipe(Number(id)).then((r) => {
        setName(r.name);
        setDescription(r.description || '');
        setServings(r.servings);
        setPrepTime(r.prep_time_minutes || '');
        setCookTime(r.cook_time_minutes || '');
        setInstructions(r.instructions);
        setTags(r.tags.join(', '));
        setSourceUrl(r.source_url || '');
        setFreezable(r.freezable);
        setIngredientRows(
          r.ingredients.map((ri) => ({
            ingredient_id: ri.ingredient_id,
            amount: ri.amount,
            unit: ri.unit,
            name: ri.ingredient.name,
          }))
        );
      });
    }
  }, [id, isEdit]);

  const addIngredientRow = () => {
    setIngredientRows([
      ...ingredientRows,
      {
        ingredient_id: 0,
        amount: 1,
        unit: 'piece',
        name: '',
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredientRows(ingredientRows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: string, value: string | number) => {
    const rows = [...ingredientRows];
    rows[index] = { ...rows[index], [field]: value };
    setIngredientRows(rows);
  };

  const handleIngredientSelect = (index: number, ing: Ingredient) => {
    const rows = [...ingredientRows];
    rows[index] = { ...rows[index], ingredient_id: ing.id, name: ing.name };
    setIngredientRows(rows);
  };

  const handleCreateIngredient = async (index: number, ingredientName: string) => {
    try {
      const created = await createIngredient({
        name: ingredientName,
        category: 'other',
        perishability: 'long-lasting',
      });
      // Add to local list so it appears in autocomplete for other rows
      setAllIngredients((prev) =>
        prev.some((i) => i.id === created.id)
          ? prev
          : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      const rows = [...ingredientRows];
      rows[index] = { ...rows[index], ingredient_id: created.id, name: created.name };
      setIngredientRows(rows);
      toast(`Added "${created.name}" to ingredients`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'An error occurred', 'error');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate all ingredients are selected
    const unset = ingredientRows.some((r) => r.ingredient_id === 0);
    if (unset) {
      setError('Please select an ingredient for each row, or remove empty rows.');
      return;
    }

    try {
      const data = {
        name,
        description: description || undefined,
        servings: servings || 1,
        prep_time_minutes: prepTime || undefined,
        cook_time_minutes: cookTime || undefined,
        instructions,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        source_url: sourceUrl || undefined,
        freezable,
        ingredients: ingredientRows.map(({ ingredient_id, amount, unit }) => ({
          ingredient_id,
          amount,
          unit,
        })),
      };
      if (isEdit) {
        await updateRecipe(Number(id), data);
        toast('Recipe updated');
        navigate(`/recipes/${id}`);
      } else {
        const created = await createRecipe(data);
        toast('Recipe created');
        navigate(`/recipes/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Recipe' : 'New Recipe'}
      </h1>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
              min={1}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prep time (min)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cook time (min)</label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
            placeholder="quick, italian, vegetarian"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="freezable"
            checked={freezable}
            onChange={(e) => setFreezable(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-300"
          />
          <label htmlFor="freezable" className="text-sm font-medium text-gray-700">
            Freezable (can be batch-cooked and frozen)
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 h-40 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
            required
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-3 block">Ingredients</label>
          <div className="space-y-2">
            {ingredientRows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-lg p-2">
                <IngredientAutocomplete
                  allIngredients={allIngredients}
                  value={{ id: row.ingredient_id, name: row.name }}
                  onChange={(ing) => handleIngredientSelect(i, ing)}
                  onAddNew={(ingName) => handleCreateIngredient(i, ingName)}
                />
                <input
                  type="number"
                  value={row.amount || ''}
                  onChange={(e) =>
                    updateRow(i, 'amount', e.target.value ? Number(e.target.value) : 0)
                  }
                  className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                  step="any"
                  min={0}
                />
                <input
                  value={row.unit}
                  onChange={(e) => updateRow(i, 'unit', e.target.value)}
                  className="w-20 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder="unit"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          {ingredientRows.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-lg">
              No ingredients added yet
            </p>
          )}
          <button
            type="button"
            onClick={addIngredientRow}
            className="text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors font-medium mt-2"
          >
            + Add ingredient
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm"
          >
            {isEdit ? 'Save Changes' : 'Create Recipe'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
