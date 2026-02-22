import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getShoppingList } from '../api';
import { categoryEmoji, categoryHeaderClasses } from '../helpers';
import type { ShoppingList as ShoppingListType } from '../types';

function ShoppingSkeleton() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="skeleton h-7 w-48 mb-6" />
      {[...Array(3)].map((_, g) => (
        <div key={g} className="mb-6">
          <div className="skeleton h-5 w-32 mb-3 rounded-full" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-8 w-full mb-2" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ShoppingList() {
  const { menuId } = useParams<{ menuId: string }>();
  const [list, setList] = useState<ShoppingListType | null>(null);
  const storageKey = `shopping-checked-${menuId}`;
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (menuId) getShoppingList(Number(menuId), 'metric').then(setList);
  }, [menuId]);

  if (!list) return <ShoppingSkeleton />;

  const toggle = (key: string) => {
    const next = new Set(checked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setChecked(next);
    localStorage.setItem(storageKey, JSON.stringify([...next]));
  };

  // Group by category
  const groups: Record<string, typeof list.items> = {};
  for (const item of list.items) {
    const cat = item.ingredient.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  const totalItems = list.items.length;
  const checkedCount = checked.size;

  return (
    <div className="max-w-xl mx-auto">
      <Link to="/menu" className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block">
        ← Back to menu
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🛒 Shopping List</h1>
        {totalItems > 0 && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {checkedCount}/{totalItems} items
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalItems > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(checkedCount / totalItems) * 100}%` }}
          />
        </div>
      )}

      {Object.entries(groups).map(([category, items]) => (
        <div key={category} className="mb-6">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold capitalize mb-3 border ${categoryHeaderClasses(category)}`}
          >
            <span>{categoryEmoji(category)}</span>
            {category}
            <span className="text-xs opacity-60">({items.length})</span>
          </div>
          <ul className="space-y-1">
            {items.map((item) => {
              const key = `${item.ingredient.id}-${item.unit}`;
              const isChecked = checked.has(key);
              return (
                <li
                  key={key}
                  onClick={() => toggle(key)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    isChecked ? 'bg-gray-50 opacity-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                      isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                    }`}
                  >
                    {isChecked && <span className="text-xs">✓</span>}
                  </div>
                  <span
                    className={`font-medium w-24 text-right text-sm shrink-0 ${
                      isChecked ? 'text-gray-400' : 'text-brand-700'
                    }`}
                  >
                    {item.total_amount} {item.unit}
                  </span>
                  <span
                    className={`text-sm transition-all ${
                      isChecked ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {item.ingredient.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {list.items.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-500">No items in shopping list.</p>
        </div>
      )}
    </div>
  );
}
