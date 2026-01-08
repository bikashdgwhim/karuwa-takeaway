import React, { useState, useMemo, useEffect } from 'react';
import { Category, MenuItem } from '../types';

interface MenuProps {
  categories: Category[];
  menuItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

const Menu: React.FC<MenuProps> = ({ categories, menuItems, onAddToCart }) => {
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Set the first category as active when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => item.categoryId === activeCategory);
  }, [activeCategory, menuItems]);

  return (
    <div className="py-16 px-4 md:px-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="text-center mb-12">
        <h4 className="text-karuwa-brandOrange font-serif italic mb-2">Our Delicious</h4>
        <h2 className="text-4xl md:text-5xl font-serif text-karuwa-brandGreen mb-3">Menu</h2>
        <div className="w-16 h-1 bg-karuwa-brandGreen mx-auto rounded-full"></div>
      </div>

      {/* Category Navigation */}
      <div className="flex flex-wrap justify-center gap-3 mb-12 sticky top-20 z-20 bg-gray-50/95 backdrop-blur-md py-4 -mx-4 px-4 border-b border-gray-200">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeCategory === cat.id
              ? 'bg-karuwa-brandGreen text-white shadow-lg shadow-karuwa-brandGreen/30'
              : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col"
          >
            {/* Image Section */}
            <div className="h-48 overflow-hidden relative">
              <img
                src={item.image || 'https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&q=80&w=800'}
                alt={item.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                {item.isPopular && (
                  <span className="text-[10px] bg-karuwa-gold text-white px-2 py-1 rounded-sm font-bold uppercase tracking-wide shadow-md">Popular</span>
                )}
                {item.isVegan && (
                  <span className="text-[10px] bg-green-600 text-white px-2 py-1 rounded-sm font-bold uppercase tracking-wide shadow-md flex items-center gap-1">
                    Vegan <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22s5-3 12-9c4-4 8 0 8 0s-3 6-9 12c-6 5-11 5-11 -3z" /></svg>
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-serif text-gray-900 font-bold group-hover:text-karuwa-brandOrange transition-colors">
                  {item.name}
                </h3>
                <span className="text-lg font-bold text-karuwa-brandGreen">£{item.price.toFixed(2)}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {/* Dietary Icons */}
                {item.isVegetarian && !item.isVegan && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div> Veg
                  </span>
                )}
                {!item.isVegetarian && !item.isVegan && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                    <div className="w-2 h-2 rounded-full bg-red-600"></div> Non-Veg
                  </span>
                )}

                {/* Spice Level */}
                {item.spiceLevel ? (
                  <div className="flex items-center gap-0.5 bg-red-50 px-2 py-0.5 rounded border border-red-200" title={`Spice Level: ${item.spiceLevel}/4`}>
                    {Array.from({ length: item.spiceLevel }).map((_, i) => (
                      <span key={i} className="text-base">🌶️</span>
                    ))}
                  </div>
                ) : item.isSpicy && (
                  <span className="text-red-600 bg-red-50 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                    <span className="text-sm">🌶️</span> Spicy
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                {item.description}
              </p>

              {/* Allergens with Icons */}
              {item.allergens && item.allergens.length > 0 && (
                <div className="mb-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-2">Allergens:</p>
                  <div className="flex flex-wrap gap-2">
                    {item.allergens.map(alg => (
                      <AllergenIcon key={alg} allergen={alg} />
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => onAddToCart(item)}
                className="w-full mt-auto py-3 rounded-lg bg-gray-50 text-karuwa-brandGreen font-bold uppercase tracking-wider hover:bg-karuwa-brandGreen hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                Add to Order
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center text-gray-500 py-12 italic">
          No items found in this category.
        </div>
      )}
    </div>
  );
};

// Allergen Icon Component with Tooltip
const AllergenIcon: React.FC<{ allergen: string }> = ({ allergen }) => {
  const allergenLower = allergen.toLowerCase().trim();

  const getAllergenInfo = () => {
    if (allergenLower.includes('gluten') || allergenLower.includes('wheat')) {
      return { icon: '🌾', name: 'Gluten/Wheat', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (allergenLower.includes('dairy') || allergenLower.includes('milk') || allergenLower.includes('lactose')) {
      return { icon: '🥛', name: 'Dairy', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    if (allergenLower.includes('nut') || allergenLower.includes('peanut') || allergenLower.includes('almond')) {
      return { icon: '🥜', name: 'Nuts', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    }
    if (allergenLower.includes('egg')) {
      return { icon: '🥚', name: 'Eggs', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    }
    if (allergenLower.includes('soy') || allergenLower.includes('soya')) {
      return { icon: '🫘', name: 'Soy', color: 'bg-green-100 text-green-700 border-green-200' };
    }
    if (allergenLower.includes('fish')) {
      return { icon: '🐟', name: 'Fish', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' };
    }
    if (allergenLower.includes('shellfish') || allergenLower.includes('seafood') || allergenLower.includes('crustacean')) {
      return { icon: '🦐', name: 'Shellfish', color: 'bg-pink-100 text-pink-700 border-pink-200' };
    }
    if (allergenLower.includes('sesame')) {
      return { icon: '🌰', name: 'Sesame', color: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
    if (allergenLower.includes('mustard')) {
      return { icon: '🟡', name: 'Mustard', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    }
    if (allergenLower.includes('celery')) {
      return { icon: '🥬', name: 'Celery', color: 'bg-lime-100 text-lime-700 border-lime-200' };
    }
    if (allergenLower.includes('sulphite') || allergenLower.includes('sulfite')) {
      return { icon: '⚗️', name: 'Sulphites', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    }
    // Default
    return { icon: '⚠️', name: allergen, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  const info = getAllergenInfo();

  return (
    <div className="group relative">
      <div className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium cursor-help ${info.color}`}>
        <span className="text-sm">{info.icon}</span>
      </div>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        {info.name}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

export default Menu;