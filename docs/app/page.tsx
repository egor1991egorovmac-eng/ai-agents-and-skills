import type { Metadata } from 'next';

import { SearchList } from '@/components/SearchList';
import { loadRegistry } from '@/lib/registry';

export const metadata: Metadata = {
  title: 'ai-agents-and-skills — агенты и скилы',
};

export default function HomePage() {
  const items = loadRegistry();

  return (
    <div className="px-6 py-10">
      <section className="pb-8">
        <p className="font-mono text-[13px] uppercase tracking-[0.14em] text-cyan">
          Claude Code · OpenCode · Cursor
        </p>
        <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(26px,5vw,44px)] font-normal leading-tight">
          Два агента и десять скилов на каждый день
        </h1>
        <p className="mt-3 max-w-[60ch] text-ink-dim">
          <b className="text-ink">bff-pipeline-bff</b> и{' '}
          <b className="text-ink">bff-pipeline-client</b> ведут GraphQL-фичу по этапам 0–6,
          <b className="text-ink"> realt-flow</b> доводит сторю от YouTrack до готовых MR. Ставятся
          отдельной командой на каждого.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="whitespace-nowrap font-display text-lg">Каталог</h2>
          <span className="h-px flex-1 bg-white/20" />
        </div>
        <SearchList items={items} />
      </section>
    </div>
  );
}
