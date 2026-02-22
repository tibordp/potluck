// Tag → emoji mapping
const TAG_EMOJIS: Record<string, string> = {
  vegetarian: '🥗',
  vegan: '🌱',
  quick: '⚡',
  italian: '🇮🇹',
  mexican: '🇲🇽',
  asian: '🥢',
  chinese: '🥡',
  japanese: '🇯🇵',
  indian: '🍛',
  thai: '🌶️',
  french: '🇫🇷',
  mediterranean: '🫒',
  american: '🇺🇸',
  seafood: '🐟',
  meat: '🥩',
  chicken: '🍗',
  pasta: '🍝',
  soup: '🍲',
  salad: '🥬',
  dessert: '🍰',
  breakfast: '🍳',
  grilled: '🔥',
  baked: '🫕',
  healthy: '💚',
  comfort: '🏠',
  spicy: '🌶️',
};

export const ALL_TAGS: string[] = Object.keys(TAG_EMOJIS);

export function tagEmoji(tag: string): string {
  return TAG_EMOJIS[tag.toLowerCase()] || '🏷️';
}

// Tag → color classes
const TAG_COLORS: Record<string, string> = {
  vegetarian: 'bg-green-100 text-green-700',
  vegan: 'bg-emerald-100 text-emerald-700',
  quick: 'bg-yellow-100 text-yellow-700',
  healthy: 'bg-lime-100 text-lime-700',
  spicy: 'bg-red-100 text-red-700',
  comfort: 'bg-orange-100 text-orange-700',
  seafood: 'bg-cyan-100 text-cyan-700',
  dessert: 'bg-pink-100 text-pink-700',
  breakfast: 'bg-amber-100 text-amber-700',
  soup: 'bg-blue-100 text-blue-700',
};

export function tagClasses(tag: string): string {
  return TAG_COLORS[tag.toLowerCase()] || 'bg-brand-100 text-brand-700';
}

// Category → emoji for shopping list
const CATEGORY_EMOJIS: Record<string, string> = {
  produce: '🥬',
  meat: '🥩',
  dairy: '🧀',
  pantry: '🫙',
  frozen: '🧊',
  spice: '🌿',
  other: '📦',
};

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJIS[category.toLowerCase()] || '📦';
}

// Category → color for shopping list headers
const CATEGORY_COLORS: Record<string, string> = {
  produce: 'text-green-700 bg-green-50 border-green-200',
  meat: 'text-red-700 bg-red-50 border-red-200',
  dairy: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  pantry: 'text-amber-700 bg-amber-50 border-amber-200',
  frozen: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  spice: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  other: 'text-gray-700 bg-gray-50 border-gray-200',
};

export function categoryHeaderClasses(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] || CATEGORY_COLORS.other;
}

// --- Unit conversion ---

type UnitSystem = 'metric' | 'imperial';

const UNIT_ALIASES: Record<string, [string, number]> = {
  // Mass → grams
  g: ['g', 1],
  gram: ['g', 1],
  grams: ['g', 1],
  kg: ['g', 1000],
  kilogram: ['g', 1000],
  kilograms: ['g', 1000],
  oz: ['g', 28.35],
  ounce: ['g', 28.35],
  ounces: ['g', 28.35],
  lb: ['g', 453.592],
  lbs: ['g', 453.592],
  pound: ['g', 453.592],
  pounds: ['g', 453.592],
  // Volume → milliliters
  ml: ['ml', 1],
  milliliter: ['ml', 1],
  milliliters: ['ml', 1],
  l: ['ml', 1000],
  liter: ['ml', 1000],
  liters: ['ml', 1000],
  litre: ['ml', 1000],
  litres: ['ml', 1000],
  cup: ['ml', 236.588],
  cups: ['ml', 236.588],
  tbsp: ['ml', 14.787],
  tablespoon: ['ml', 14.787],
  tablespoons: ['ml', 14.787],
  tsp: ['ml', 4.929],
  teaspoon: ['ml', 4.929],
  teaspoons: ['ml', 4.929],
  'fl oz': ['ml', 29.574],
  'fluid ounce': ['ml', 29.574],
  'fluid ounces': ['ml', 29.574],
};

function toDisplay(
  amount: number,
  canonical: string,
  system: UnitSystem
): { amount: number; unit: string } {
  if (canonical === 'g') {
    if (system === 'imperial') {
      const oz = amount / 28.35;
      if (oz >= 16) return { amount: Math.round((oz / 16) * 100) / 100, unit: 'lb' };
      return { amount: Math.round(oz * 100) / 100, unit: 'oz' };
    }
    if (amount >= 1000) return { amount: Math.round((amount / 1000) * 100) / 100, unit: 'kg' };
    return { amount: Math.round(amount * 10) / 10, unit: 'g' };
  }
  if (canonical === 'ml') {
    if (system === 'imperial') {
      const flOz = amount / 29.574;
      if (flOz >= 8) return { amount: Math.round((flOz / 8) * 100) / 100, unit: 'cup' };
      return { amount: Math.round(flOz * 100) / 100, unit: 'fl oz' };
    }
    if (amount >= 1000) return { amount: Math.round((amount / 1000) * 100) / 100, unit: 'l' };
    return { amount: Math.round(amount * 10) / 10, unit: 'ml' };
  }
  return { amount: Math.round(amount * 100) / 100, unit: canonical };
}

export function convertUnit(
  amount: number,
  unit: string,
  system: UnitSystem
): { amount: number; unit: string } {
  const key = unit.trim().toLowerCase();
  const alias = UNIT_ALIASES[key];
  if (alias) {
    const [canonical, multiplier] = alias;
    return toDisplay(amount * multiplier, canonical, system);
  }
  return { amount, unit };
}
