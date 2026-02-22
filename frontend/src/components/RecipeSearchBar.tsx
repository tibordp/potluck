import { useEffect, useRef, useState } from 'react';
import { getIngredients } from '../api';
import { ALL_TAGS, tagClasses, tagEmoji } from '../helpers';
import type { Ingredient } from '../types';

export type SearchFilter =
  | { kind: 'tag'; value: string }
  | { kind: 'ingredient'; id: number; name: string };

type Suggestion = { type: 'tag'; value: string } | { type: 'ingredient'; id: number; name: string };

export default function RecipeSearchBar({
  search,
  onSearchChange,
  filters,
  onAddFilter,
  onRemoveFilter,
  compact,
  placeholder,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  filters: SearchFilter[];
  onAddFilter: (f: SearchFilter) => void;
  onRemoveFilter: (idx: number) => void;
  compact?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [ingredientResults, setIngredientResults] = useState<Ingredient[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const query = search.trim().toLowerCase();

  // Clear ingredient results synchronously when query is empty
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    if (!query) setIngredientResults([]);
  }

  // Debounced ingredient search
  useEffect(() => {
    if (!query) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      getIngredients(query).then(setIngredientResults);
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build suggestions
  const selectedTags = new Set(filters.filter((f) => f.kind === 'tag').map((f) => f.value));
  const selectedIngIds = new Set(filters.filter((f) => f.kind === 'ingredient').map((f) => f.id));

  const tagSuggestions = query
    ? ALL_TAGS.filter((t) => t.includes(query) && !selectedTags.has(t)).map((t) => ({
        type: 'tag' as const,
        value: t,
      }))
    : [];

  const ingredientSuggestions = ingredientResults
    .filter((i) => !selectedIngIds.has(i.id))
    .slice(0, 6)
    .map((i) => ({ type: 'ingredient' as const, id: i.id, name: i.name }));

  const suggestions = [...tagSuggestions, ...ingredientSuggestions];

  // Reset highlight when suggestions change
  const [prevSugLen, setPrevSugLen] = useState(suggestions.length);
  if (suggestions.length !== prevSugLen) {
    setPrevSugLen(suggestions.length);
    setHighlightIdx(0);
  }

  const selectSuggestion = (s: Suggestion) => {
    if (s.type === 'tag') {
      onAddFilter({ kind: 'tag', value: s.value });
    } else {
      onAddFilter({ kind: 'ingredient', id: s.id, name: s.name });
    }
    onSearchChange('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !search && filters.length > 0) {
      onRemoveFilter(filters.length - 1);
      return;
    }

    if (!open || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIdx]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const showDropdown = open && query;

  return (
    <div ref={wrapperRef} className={`relative ${compact ? '' : 'mb-6'}`}>
      <div
        className={`flex flex-wrap items-center gap-1.5 bg-white border border-gray-200 focus-within:ring-2 focus-within:ring-brand-300 focus-within:border-brand-300 ${
          compact ? 'rounded-lg px-3 py-1.5' : 'rounded-xl px-3 py-2'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {!compact && <span className="text-gray-400">{'\uD83D\uDD0D'}</span>}
        {filters.map((f, idx) =>
          f.kind === 'tag' ? (
            <span
              key={`tag-${f.value}`}
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tagClasses(f.value)}`}
            >
              {tagEmoji(f.value)} {f.value}
              <button onClick={() => onRemoveFilter(idx)} className="ml-0.5 hover:opacity-70">
                x
              </button>
            </span>
          ) : (
            <span
              key={`ing-${f.id}`}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700"
            >
              {f.name}
              <button onClick={() => onRemoveFilter(idx)} className="ml-0.5 hover:opacity-70">
                x
              </button>
            </span>
          )
        )}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={filters.length > 0 ? '' : (placeholder ?? 'Search recipes...')}
          className={`flex-1 min-w-[60px] bg-transparent focus:outline-none ${compact ? 'text-sm' : ''}`}
        />
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-3 py-3 text-sm text-gray-400 italic text-center">
              No matching tags or ingredients
            </div>
          ) : (
            <>
              {tagSuggestions.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">Tags</div>
                  {tagSuggestions.map((s, i) => (
                    <button
                      key={s.value}
                      onClick={() => selectSuggestion(s)}
                      className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                        highlightIdx === i ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${tagClasses(s.value)}`}>
                        {tagEmoji(s.value)}
                      </span>
                      {s.value}
                    </button>
                  ))}
                </>
              )}
              {ingredientSuggestions.length > 0 && (
                <>
                  <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">Ingredients</div>
                  {ingredientSuggestions.map((s, i) => {
                    const globalIdx = tagSuggestions.length + i;
                    return (
                      <button
                        key={s.type === 'ingredient' ? s.id : ''}
                        onClick={() => selectSuggestion(s)}
                        className={`w-full text-left px-3 py-1.5 text-sm ${
                          highlightIdx === globalIdx
                            ? 'bg-brand-50 text-brand-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {s.type === 'ingredient' ? s.name : ''}
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
