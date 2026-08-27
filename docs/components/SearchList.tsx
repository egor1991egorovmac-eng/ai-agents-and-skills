'use client';

import { useState } from 'react';

import type { RegistryItem } from '@/lib/registry';

import { ItemCard } from './ItemCard';

type Filter = 'all' | 'agents' | 'skills';

function SectionBlock({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: RegistryItem[];
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="font-display text-[20px] font-bold leading-[26px]">{title}</h2>
        <span className="rounded-full bg-basic-800 px-2.5 py-0.5 font-mono text-[12px] text-basic-300">
          {count}
        </span>
        <span className="h-px flex-1 bg-basic-100/10" />
      </div>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

export function SearchList({ items }: { items: RegistryItem[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const q = query.trim().toLowerCase();
  const match = (item: RegistryItem) => !q || item.name.toLowerCase().includes(q);

  const isAgent = (item: RegistryItem) => item.kind === 'agent' || item.alsoAgent;

  const agentsAll = items.filter(isAgent);
  const skillsAll = items.filter((item) => item.kind === 'skill');

  const agents = agentsAll.filter(match);
  const skills = skillsAll.filter(match);

  const tabs: Array<[Filter, string, number]> = [
    ['all', 'Все', items.length],
    ['agents', 'Агенты', agentsAll.length],
    ['skills', 'Скилы', skillsAll.length],
  ];

  const totalShown = (filter === 'agents' ? agents.length : filter === 'skills' ? skills.length : agents.length + skills.length);
  const empty = totalShown === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-basic-100/15 bg-card px-4 py-2.5 focus-within:border-basic-400">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-basic-400">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск агента или скила по названию…"
          aria-label="Поиск по названию"
          className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-basic-400"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Фильтр по типу">
        {tabs.map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={
              filter === key
                ? 'rounded-md bg-primary px-3.5 py-1.5 text-[14px] font-semibold text-basic-900 transition-colors'
                : 'rounded-md border border-basic-100/15 bg-card px-3.5 py-1.5 text-[14px] font-semibold text-basic-400 transition-colors hover:border-basic-100/30 hover:text-ink'
            }
          >
            {label} <span className="font-mono text-[12px] opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {empty ? (
        <div className="mt-6 rounded-md border border-basic-100/10 bg-card p-8 text-center">
          <p className="font-display text-lg font-bold">Ничего не найдено</p>
          <p className="mt-1 text-[14px] text-basic-400">
            По запросу «{query.trim()}» нет совпадений. Попробуй другое название.
          </p>
        </div>
      ) : filter === 'agents' ? (
        <SectionBlock title="Агенты" count={agents.length} items={agents} />
      ) : filter === 'skills' ? (
        <SectionBlock title="Скилы" count={skills.length} items={skills} />
      ) : (
        <>
          <SectionBlock title="Агенты" count={agents.length} items={agents} />
          <SectionBlock title="Скилы" count={skills.length} items={skills} />
        </>
      )}
    </div>
  );
}
