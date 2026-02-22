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
import Settings from './components/Settings';
import ShoppingList from './components/ShoppingList';
import { ToastProvider } from './components/Toast';

const NAV_ITEMS = [
  { to: '/menu', label: 'Menu', icon: '📅' },
  { to: '/recipes', label: 'Recipes', icon: '📖' },
  { to: '/ingredients', label: 'Ingredients', icon: '🥕' },
];

function Nav() {
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
          <Link
            to="/settings"
            className={`transition-colors ${
              isActive('/settings') ? 'text-white' : 'text-white/70 hover:text-white'
            }`}
            title="Settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
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
      <div className="min-h-screen bg-gray-50 pb-16 sm:pb-0 overflow-x-hidden">
        <Nav />
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
            <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}
