import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecipes } from '../api';
import { tagClasses, tagEmoji } from '../helpers';
import type { RecipeSummary } from '../types';

function RecipeSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="skeleton h-5 w-3/4 mb-3" />
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-2/3 mb-4" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export default function RecipeList() {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [prevSearch, setPrevSearch] = useState(search);
  if (search !== prevSearch) {
    setPrevSearch(search);
    setLoading(true);
  }

  useEffect(() => {
    getRecipes(search || undefined)
      .then(setRecipes)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recipes</h1>
        <div className="flex gap-2">
          <Link
            to="/recipes/import"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-sm text-sm"
          >
            ✨ Import
          </Link>
          <Link
            to="/recipes/new"
            className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm text-sm"
          >
            + New Recipe
          </Link>
        </div>
      </div>

      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <RecipeSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <Link
              key={r.id}
              to={`/recipes/${r.id}`}
              className="group block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-200"
            >
              <h2 className="font-semibold text-lg text-gray-800 group-hover:text-brand-600 transition-colors">
                {r.name}
              </h2>
              {r.description && (
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{r.description}</p>
              )}
              {r.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagClasses(tag)}`}
                    >
                      {tagEmoji(tag)} {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                <span>👥 {r.servings}</span>
                {r.prep_time_minutes && <span>⏱️ {r.prep_time_minutes}m prep</span>}
                {r.cook_time_minutes && <span>🔥 {r.cook_time_minutes}m cook</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && recipes.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No recipes yet</h2>
          <p className="text-gray-500 mb-6">
            Get started by creating a recipe or importing one from a URL!
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/recipes/import"
              className="bg-green-50 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-100 transition-colors"
            >
              ✨ Import a recipe
            </Link>
            <Link
              to="/recipes/new"
              className="bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-medium hover:bg-brand-100 transition-colors"
            >
              + Create manually
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
