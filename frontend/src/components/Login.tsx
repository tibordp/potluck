import { type FormEvent, useState } from 'react';
import { login } from '../api';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(password);
    setLoading(false);
    if (res.ok) {
      onLogin();
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-80 border border-brand-100"
      >
        <div className="text-center mb-6">
          <h1 className="text-4xl text-brand-600" style={{ fontFamily: 'Pacifico, cursive' }}>
            Potluck
          </h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to continue</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4 border border-red-100">
            {error}
          </div>
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-300 transition-shadow"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
