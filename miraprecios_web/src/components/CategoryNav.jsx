'use client';

import { useState, useEffect } from 'react';

export default function CategoryNav({ onSelectCategory, selectedCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categorias');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categorias || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 no-scrollbar w-full max-w-4xl mx-auto opacity-50">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse shrink-0"></div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-2 no-scrollbar scroll-smooth">
        <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 px-6 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm ${
            !selectedCategory
              ? 'bg-blue-600 text-white shadow-blue-200 border border-transparent'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`shrink-0 px-6 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm flex items-center gap-2 ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-blue-200 border border-transparent'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
            }`}
          >
            {cat.nombre}
            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
