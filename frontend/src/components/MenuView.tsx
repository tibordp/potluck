import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateMenu, getCurrentMenu, getRecipes, updateMenuSlot } from '../api';
import { useToast } from './Toast';
import type { Menu, RecipeSummary } from '../types';
import RecipeSearchBar, { type SearchFilter } from './RecipeSearchBar';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getNextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function MenuSkeleton() {
  return (
    <div className="grid gap-3">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="skeleton h-5 w-24 mb-3" />
          <div className="skeleton h-10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function RecipePicker({
  currentRecipeId,
  onPick,
  onReroll,
  onClose,
}: {
  currentRecipeId: number;
  onPick: (recipeId: number) => void;
  onReroll: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [initialSuggestions, setInitialSuggestions] = useState<RecipeSummary[]>([]);
  const [searchResults, setSearchResults] = useState<RecipeSummary[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const hasQuery = search.trim().length > 0 || filters.length > 0;

  // Clear search results synchronously when query is cleared
  const [prevHasQuery, setPrevHasQuery] = useState(hasQuery);
  if (hasQuery !== prevHasQuery) {
    setPrevHasQuery(hasQuery);
    if (!hasQuery) setSearchResults([]);
  }

  // Fetch initial random suggestions
  useEffect(() => {
    getRecipes().then((recipes) => {
      const others = recipes.filter((r) => r.id !== currentRecipeId);
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      setInitialSuggestions(shuffled.slice(0, 5));
    });
  }, [currentRecipeId]);

  // Fetch search results when search or filters change
  useEffect(() => {
    if (!hasQuery) return;
    const tagFilter = filters.find((f) => f.kind === 'tag');
    const ingFilter = filters.find((f) => f.kind === 'ingredient');
    getRecipes(
      search || undefined,
      tagFilter?.kind === 'tag' ? tagFilter.value : undefined,
      ingFilter?.kind === 'ingredient' ? ingFilter.id : undefined
    ).then((results) => {
      setSearchResults(results.filter((r) => r.id !== currentRecipeId));
    });
  }, [search, filters, currentRecipeId, hasQuery]);

  const displayList = hasQuery ? searchResults : initialSuggestions;

  return (
    <div className="border border-brand-200 bg-brand-50 rounded-lg p-3 mt-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1" ref={wrapperRef}>
          <RecipeSearchBar
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onAddFilter={(f) => setFilters((prev) => [...prev, f])}
            onRemoveFilter={(idx) => setFilters((prev) => prev.filter((_, i) => i !== idx))}
            compact
            placeholder="Search recipes..."
          />
        </div>
        <button
          onClick={onReroll}
          className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors shrink-0 font-medium"
          title="Random swap"
        >
          🎲
        </button>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1.5 py-1.5 shrink-0"
        >
          ✕
        </button>
      </div>
      {!hasQuery && displayList.length > 0 && (
        <p className="text-xs text-gray-400 mb-1.5 px-1">Suggestions</p>
      )}
      {hasQuery && displayList.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-3">No recipes found</p>
      )}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {displayList.map((r) => (
          <button
            key={r.id}
            onClick={() => onPick(r.id)}
            className="w-full text-left text-sm px-2.5 py-1.5 rounded-lg hover:bg-brand-100 transition-colors text-gray-700 truncate"
          >
            {r.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ServingsBadge({
  slot,
  menuServings,
  onUpdate,
}: {
  slot: Menu['slots'][number];
  menuServings: number;
  onUpdate: (servingsOverride: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const effective = slot.servings_override ?? menuServings;
  const isOverridden = slot.servings_override != null;

  const handleOpen = () => {
    setValue(String(effective));
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleCommit = () => {
    setEditing(false);
    const num = parseInt(value, 10);
    if (!value.trim() || isNaN(num) || num < 1 || num === menuServings) {
      onUpdate(null);
    } else {
      onUpdate(num);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleCommit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="w-12 text-xs text-center border border-brand-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />
    );
  }

  return (
    <button
      onClick={handleOpen}
      className={`text-xs px-1.5 py-0.5 rounded transition-colors shrink-0 ${
        isOverridden
          ? 'bg-brand-100 text-brand-700 font-semibold'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      }`}
      title={
        isOverridden
          ? `Override: ${effective} servings (default: ${menuServings})`
          : `${effective} servings (click to override)`
      }
    >
      x{effective}
    </button>
  );
}

export default function MenuView() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [servings, setServings] = useState<number | ''>(4);
  const [pickerSlotId, setPickerSlotId] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    getCurrentMenu()
      .then(setMenu)
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const m = await generateMenu(getNextMonday(), servings || 4);
      setMenu(m);
      toast('Menu generated!');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'An error occurred', 'error');
    }
    setGenerating(false);
  };

  const handleReroll = async (slotId: number) => {
    if (!menu) return;
    const updated = await updateMenuSlot(menu.id, slotId, { reroll: true });
    setMenu(updated);
    setPickerSlotId(null);
    toast('Meal swapped');
  };

  const handlePickRecipe = async (slotId: number, recipeId: number) => {
    if (!menu) return;
    const updated = await updateMenuSlot(menu.id, slotId, { recipe_id: recipeId });
    setMenu(updated);
    setPickerSlotId(null);
    toast('Recipe changed');
  };

  const handleServingsOverride = async (slotId: number, servingsOverride: number | null) => {
    if (!menu) return;
    const updated = await updateMenuSlot(menu.id, slotId, { servings_override: servingsOverride });
    setMenu(updated);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Weekly Menu</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <span className="text-sm text-gray-500">👥</span>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value ? Number(e.target.value) : '')}
              className="w-12 text-sm focus:outline-none"
              min={1}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-5 py-2 rounded-lg font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm disabled:opacity-50 text-sm"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">🎲</span> Generating...
              </span>
            ) : (
              '🎲 Generate Menu'
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <MenuSkeleton />
      ) : menu ? (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              📅 Week of {menu.week_start}
            </span>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              👥 {menu.servings} servings
            </span>
            <Link
              to={`/menus/${menu.id}/shopping`}
              className="hidden sm:inline-flex text-sm bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium hover:bg-green-200 transition-colors ml-auto"
            >
              🛒 Shopping List
            </Link>
          </div>
          <Link
            to={`/menus/${menu.id}/shopping`}
            className="flex sm:hidden items-center justify-center w-full text-sm bg-green-100 text-green-800 px-5 py-2.5 rounded-lg font-medium hover:bg-green-200 transition-colors mb-4 border border-green-200"
          >
            🛒 Shopping List
          </Link>

          <div className="grid gap-3">
            {DAYS.map((dayName, dayIdx) => {
              const slot = menu.slots.find((s) => s.day === dayIdx && s.meal === 'dinner');
              if (!slot) return null;
              const isPickerOpen = pickerSlotId === slot.id;
              return (
                <div key={dayIdx} className="bg-white rounded-xl border border-gray-100 p-3 group">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 text-sm">
                      <span className="sm:hidden">{DAY_SHORT[dayIdx]}</span>
                      <span className="hidden sm:inline">{dayName}</span>
                    </h3>
                    <button
                      onClick={() => setPickerSlotId(isPickerOpen ? null : slot.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-all shrink-0 font-medium ${
                        isPickerOpen
                          ? 'bg-brand-100 text-brand-700'
                          : 'sm:opacity-0 sm:group-hover:opacity-100 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                      title="Change recipe"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 mt-1">
                    <Link
                      to={`/recipes/${slot.recipe.id}`}
                      className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors truncate"
                    >
                      {slot.recipe.name}
                    </Link>
                    <ServingsBadge
                      slot={slot}
                      menuServings={menu.servings}
                      onUpdate={(v) => handleServingsOverride(slot.id, v)}
                    />
                  </div>
                  {slot.recipe.freezable && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
                        🧊 freezable
                      </span>
                    </div>
                  )}
                  {isPickerOpen && (
                    <RecipePicker
                      currentRecipeId={slot.recipe.id}
                      onPick={(recipeId) => handlePickRecipe(slot.id, recipeId)}
                      onReroll={() => handleReroll(slot.id)}
                      onClose={() => setPickerSlotId(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No menu yet</h2>
          <p className="text-gray-500 mb-6">
            Generate a weekly menu to get started with meal planning!
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm disabled:opacity-50"
          >
            🎲 Generate Your First Menu
          </button>
        </div>
      )}
    </div>
  );
}
