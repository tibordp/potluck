import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { authCheck, logout } from './api';
import ImportRecipe from './components/ImportRecipe';
import IngredientList from './components/IngredientList';
import Login from './components/Login';
import MenuView from './components/MenuView';
import RecipeDetail from './components/RecipeDetail';
import RecipeForm from './components/RecipeForm';
import RecipeList from './components/RecipeList';
import ShoppingList from './components/ShoppingList';
import { ToastProvider } from './components/Toast';

const NAV_ITEMS = [
  { to: '/menu', label: 'Menu', icon: '📅' },
  { to: '/recipes', label: 'Recipes', icon: '📖' },
  { to: '/ingredients', label: 'Ingredients', icon: '🥕' },
];

function Nav({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Desktop nav */}
      <nav className="bg-brand-600 shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2 text-white text-2xl"
              style={{ fontFamily: 'Pacifico, cursive' }}
            >
              Potluck
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label, icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(to)
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1.5">{icon}</span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors ${
                isActive(to) ? 'text-brand-600' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [auth, setAuth] = useState<boolean | null>(null);

  useEffect(() => {
    authCheck()
      .then((res) => setAuth(res.authenticated))
      .catch(() => setAuth(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setAuth(false);
  };

  if (auth === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🍽️</div>
      </div>
    );
  }

  if (!auth) {
    return (
      <ToastProvider>
        <Login onLogin={() => setAuth(true)} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0">
        <Nav onLogout={handleLogout} />
        <main className="max-w-5xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/menu" replace />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/recipes/new" element={<RecipeForm />} />
            <Route path="/recipes/import" element={<ImportRecipe />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route path="/recipes/:id/edit" element={<RecipeForm />} />
            <Route path="/ingredients" element={<IngredientList />} />
            <Route path="/menu" element={<MenuView />} />
            <Route path="/menus/:menuId/shopping" element={<ShoppingList />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
