import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { InstallBlock } from '@/components/InstallBlock';
import { MarkdownBody } from '@/components/MarkdownBody';
import { getItem, loadRegistry } from '@/lib/registry';

interface Props {
  params: Promise<{ kind: string; slug: string }>;
}

export function generateStaticParams() {
  return loadRegistry().flatMap((item) => [
    { kind: item.kind, slug: item.id },
    ...(item.alsoAgent ? [{ kind: 'agent', slug: item.id }] : []),
  ]);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind, slug } = await params;
  const item = getItem(slug);

  if (!item || (item.kind !== kind && !(kind === 'agent' && item.alsoAgent))) {
    return { title: 'Не найдено' };
  }

  return { title: `${item.name} — ai-agents-and-skills`, description: item.description };
}

export default async function DetailPage({ params }: Props) {
  const { kind, slug } = await params;
  const item = getItem(slug);

  if (!item || (item.kind !== kind && !(kind === 'agent' && item.alsoAgent))) {
    notFound();
  }

  const sourceUrl = `https://github.com/egor1991egorovmac-eng/ai-agents-and-skills/blob/main/${item.source}`;
  const badge = item.alsoAgent ? 'агент + скил' : item.kind === 'agent' ? 'агент' : 'скил';

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-dim">
          {kind === 'skill' ? 'скил' : 'агент'} · {badge}
        </p>
        <h1 className="mt-2 font-display text-[clamp(22px,4vw,34px)] font-normal">
          {item.name}
        </h1>

        <p className="mt-3 text-ink-dim">{item.description}</p>

        <div className="mt-6">
          <p className="mb-2 font-mono text-xs uppercase tracking-wider text-ink-dim">
            Установка
          </p>
          <InstallBlock command={item.install} />
        </div>

        <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs text-ink-dim">
          <a
            href={sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-cyan hover:underline"
          >
            исходник на GitHub →
          </a>
          <span>{item.source}</span>
        </div>

        <div className="mt-8 border-t border-white/20 pt-2">
          <MarkdownBody body={item.body} />
        </div>
      </div>
    </div>
  );
}
