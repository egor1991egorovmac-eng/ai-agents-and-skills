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
      <div className="flex items-center gap-3 rounded-md border border-basic-100/15 bg-card px-4 py-2.5 focus-within:border-primary">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="#A4AAB4" strokeWidth="1.6" />
          <path d="M11 11l3.5 3.5" stroke="#A4AAB4" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск агента или скила по названию…"
          aria-label="Поиск по названию"
          className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-basic-400"
        />
        <span className="shrink-0 rounded-full bg-basic-800 px-2.5 py-0.5 font-mono text-[12px] text-basic-300">
          {filtered.length} / {items.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-md border border-basic-100/10 bg-card p-8 text-center">
          <p className="font-display text-lg font-bold">Ничего не найдено</p>
          <p className="mt-1 text-[14px] text-basic-400">
            По запросу «{query.trim()}» нет совпадений. Попробуй другое название.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
