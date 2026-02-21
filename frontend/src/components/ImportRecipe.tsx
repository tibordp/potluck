import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createIngredient,
  createRecipe,
  getIngredients,
  importFromImage,
  importFromText,
  importFromUrl,
} from '../api';
import { useToast } from './Toast';
import { tagClasses, tagEmoji } from '../helpers';
import type { Ingredient, ParsedRecipe } from '../types';

export default function ImportRecipe() {
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState<'url' | 'text' | 'scan'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [ingredientMap, setIngredientMap] = useState<Record<number, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getIngredients().then(setAllIngredients);
  }, []);

  const handleImageSelect = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const applyResult = (result: ParsedRecipe) => {
    setParsed(result);
    const map: Record<number, number> = {};
    result.ingredients.forEach((pi, idx) => {
      const match = allIngredients.find((i) => i.name.toLowerCase() === pi.name.toLowerCase());
      if (match) map[idx] = match.id;
    });
    setIngredientMap(map);
  };

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setParsed(null);
    try {
      let result: ParsedRecipe;
      if (mode === 'url') {
        result = await importFromUrl(url);
      } else if (mode === 'text') {
        result = await importFromText(text);
      } else {
        if (!imageFile) throw new Error('Please select an image');
        result = await importFromImage(imageFile);
      }
      applyResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!parsed) return;
    setError('');
    try {
      const finalMap = { ...ingredientMap };
      for (let i = 0; i < parsed.ingredients.length; i++) {
        if (!finalMap[i]) {
          const pi = parsed.ingredients[i];
          const created = await createIngredient({
            name: pi.name,
            category: 'other',
            perishability: 'long-lasting',
          });
          finalMap[i] = created.id;
        }
      }

      const recipe = await createRecipe({
        name: parsed.name,
        description: parsed.description || undefined,
        servings: parsed.servings,
        prep_time_minutes: parsed.prep_time_minutes || undefined,
        cook_time_minutes: parsed.cook_time_minutes || undefined,
        instructions: parsed.instructions,
        tags: parsed.tags,
        source_url: parsed.source_url || undefined,
        freezable: parsed.freezable,
        ingredients: parsed.ingredients.map((pi, idx) => ({
          ingredient_id: finalMap[idx],
          amount: pi.amount,
          unit: pi.unit,
        })),
      });
      toast('Recipe imported!');
      navigate(`/recipes/${recipe.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (parsed) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Review Import</h1>
        <p className="text-gray-500 text-sm mb-6">
          Check the parsed recipe below and save when ready.
        </p>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-50 to-brand-100 px-6 py-4 border-b border-brand-100">
            <h2 className="text-xl font-bold text-gray-800">{parsed.name}</h2>
            {parsed.description && (
              <p className="text-gray-600 text-sm mt-1">{parsed.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>👥 {parsed.servings}</span>
              {parsed.prep_time_minutes && <span>⏱️ {parsed.prep_time_minutes}m prep</span>}
              {parsed.cook_time_minutes && <span>🔥 {parsed.cook_time_minutes}m cook</span>}
              {parsed.freezable && <span className="text-cyan-600 font-medium">Freezable</span>}
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Ingredients</h3>
              <div className="space-y-1.5">
                {parsed.ingredients.map((pi, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <span className="font-medium text-brand-700 w-24 text-right shrink-0">
                      {pi.amount} {pi.unit}
                    </span>
                    <span className="flex-1 text-gray-700">{pi.name}</span>
                    {ingredientMap[idx] ? (
                      <span className="text-green-600 bg-green-50 text-xs px-2 py-0.5 rounded-full font-medium">
                        ✓ matched
                      </span>
                    ) : (
                      <span className="text-amber-600 bg-amber-50 text-xs px-2 py-0.5 rounded-full font-medium">
                        + new
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {parsed.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {parsed.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagClasses(tag)}`}
                  >
                    {tagEmoji(tag)} {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Instructions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 leading-relaxed">
                {parsed.instructions}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm"
          >
            ✓ Save Recipe
          </button>
          <button
            onClick={() => setParsed(null)}
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Import Recipe</h1>
      <p className="text-gray-500 text-sm mb-6">
        Paste a URL, text, or scan a photo — AI will parse and translate it.
      </p>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">
          {error}
        </div>
      )}

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setMode('url')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'url'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔗 From URL
        </button>
        <button
          onClick={() => setMode('text')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'text'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 From Text
        </button>
        <button
          onClick={() => setMode('scan')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'scan'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📷 Scan
        </button>
      </div>

      <form onSubmit={handleImport}>
        {mode === 'url' && (
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/recipe..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
            required
          />
        )}
        {mode === 'text' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste recipe text in any language..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 h-60 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
            required
          />
        )}
        {mode === 'scan' && (
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              capture="environment"
              onChange={(e) => handleImageSelect(e.target.files?.[0])}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Recipe preview"
                  className="w-full max-h-80 object-contain rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-gray-600 hover:text-gray-800 rounded-lg px-2.5 py-1 text-xs font-medium shadow-sm transition-colors"
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl px-4 py-12 text-center hover:border-brand-300 hover:bg-brand-50 transition-all cursor-pointer"
              >
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm font-medium text-gray-600">Take a photo or choose an image</p>
                <p className="text-xs text-gray-400 mt-1">
                  Cookbook pages, handwritten recipes, screenshots
                </p>
              </button>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={loading || (mode === 'scan' && !imageFile)}
          className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">✨</span> Parsing with AI...
            </span>
          ) : (
            '✨ Import'
          )}
        </button>
      </form>
    </div>
  );
}
