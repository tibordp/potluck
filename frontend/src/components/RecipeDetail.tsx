import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteRecipe, getRecipe } from '../api';
import { useToast } from './Toast';
import { convertUnit, tagClasses, tagEmoji, useUnitSystem } from '../helpers';

function useWakeLock() {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;

    const request = () => {
      navigator.wakeLock.request('screen').then(
        (lock) => {
          wakeLock.current = lock;
        },
        () => {}
      );
    };

    request();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      wakeLock.current?.release();
      wakeLock.current = null;
    };
  }, []);
}
import type { Recipe } from '../types';

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="skeleton h-8 w-2/3 mb-3" />
      <div className="skeleton h-4 w-1/2 mb-6" />
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-4 w-full mb-2" />
          ))}
        </div>
        <div className="md:col-span-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-4 w-full mb-2" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [unitSystem, setUnitSystem] = useUnitSystem();
  useWakeLock();

  useEffect(() => {
    if (id) getRecipe(Number(id)).then(setRecipe);
  }, [id]);

  if (!recipe) return <DetailSkeleton />;

  const handleDelete = async () => {
    if (!confirm('Delete this recipe?')) return;
    await deleteRecipe(recipe.id);
    toast('Recipe deleted');
    navigate('/recipes');
  };

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-2">
        <Link
          to="/recipes"
          className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block"
        >
          ← Back to recipes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-800">{recipe.name}</h1>
            {recipe.description && (
              <p className="text-gray-500 mt-2 text-lg">{recipe.description}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              to={`/recipes/${recipe.id}/edit`}
              className="bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-medium hover:bg-brand-100 transition-colors text-sm"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex items-center gap-3 mt-4 mb-6 flex-wrap">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-600">
          <span>👥</span> {recipe.servings} servings
        </div>
        {recipe.prep_time_minutes && (
          <div className="flex items-center gap-1.5 bg-blue-50 rounded-full px-3 py-1 text-sm text-blue-600">
            <span>⏱️</span> {recipe.prep_time_minutes}m prep
          </div>
        )}
        {recipe.cook_time_minutes && (
          <div className="flex items-center gap-1.5 bg-orange-50 rounded-full px-3 py-1 text-sm text-orange-600">
            <span>🔥</span> {recipe.cook_time_minutes}m cook
          </div>
        )}
        {totalTime > 0 && (
          <div className="flex items-center gap-1.5 bg-purple-50 rounded-full px-3 py-1 text-sm text-purple-600">
            <span>⏰</span> {totalTime}m total
          </div>
        )}
        {recipe.freezable && (
          <div className="flex items-center gap-1.5 bg-cyan-50 rounded-full px-3 py-1 text-sm text-cyan-600 font-medium">
            Freezable
          </div>
        )}
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className={`text-sm px-3 py-1 rounded-full font-medium ${tagClasses(tag)}`}
            >
              {tagEmoji(tag)} {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-brand-50 rounded-xl p-5 border border-brand-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-brand-800">Ingredients</h2>
              <div className="flex bg-brand-100 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setUnitSystem('original')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    unitSystem === 'original'
                      ? 'bg-white text-brand-700 font-medium shadow-sm'
                      : 'text-brand-500 hover:text-brand-700'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setUnitSystem('metric')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    unitSystem === 'metric'
                      ? 'bg-white text-brand-700 font-medium shadow-sm'
                      : 'text-brand-500 hover:text-brand-700'
                  }`}
                >
                  Metric
                </button>
              </div>
            </div>
            <ul className="space-y-2">
              {recipe.ingredients.map((ri) => {
                const converted = convertUnit(ri.amount, ri.unit, unitSystem);
                return (
                  <li key={ri.id} className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold text-brand-700 whitespace-nowrap">
                      {converted.amount} {converted.unit}
                    </span>
                    <span className="text-gray-700">{ri.ingredient.name}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h2>
            <div className="prose prose-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {recipe.instructions}
            </div>
          </div>
        </div>
      </div>

      {recipe.source_url && (
        <p className="mt-6 text-sm text-gray-400">
          Source:{' '}
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-brand-500 hover:text-brand-600 underline"
          >
            {recipe.source_url}
          </a>
        </p>
      )}
    </div>
  );
}
