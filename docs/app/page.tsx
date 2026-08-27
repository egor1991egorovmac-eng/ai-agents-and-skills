import type { Metadata } from 'next';

import { SearchList } from '@/components/SearchList';
import { loadRegistry } from '@/lib/registry';

export const metadata: Metadata = {
  title: 'ai-agents-and-skills — агенты и скилы',
};

export default function HomePage() {
  const items = loadRegistry();

  return (
    <div className="pb-10 pt-4 md:pt-8">
      <nav aria-label="Хлебные крошки" className="mb-2 flex flex-wrap items-center text-[14px]">
        <span className="text-basic-400">Каталог</span>
        <span className="mx-2 text-[11px] text-basic-800">›</span>
        <span className="text-basic-400">Агенты и скилы</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[26px] font-extrabold leading-[32px] lg:text-[32px]">
          Агенты и скилы
        </h1>
        <span className="mb-1 font-mono text-[13px] text-basic-400">
          {items.length} позиций · Claude Code · OpenCode · Cursor
        </span>
      </div>

      <SearchList items={items} />
    </div>
  );
}
