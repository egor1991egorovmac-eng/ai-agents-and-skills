'use client';

import { useState } from 'react';

import type { RegistryItem } from '@/lib/registry';

import { ItemCard } from './ItemCard';

export function SearchList({ items }: { items: RegistryItem[] }) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((item) => item.name.toLowerCase().includes(q)) : items;

  return (
    <div>
      <div className="flex items-center gap-3 border border-white/20 bg-paper-deep px-4 py-2.5 font-mono">
        <span className="text-cyan">/</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="поиск по названию…"
          aria-label="Поиск по названию"
          className="w-full bg-transparent text-ink outline-none placeholder:text-ink-dim"
        />
        <span className="shrink-0 text-xs tracking-wider text-ink-dim">
          {filtered.length}/{items.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 font-mono text-sm text-ink-dim">
          Ничего не найдено по запросу «{query.trim()}».
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
