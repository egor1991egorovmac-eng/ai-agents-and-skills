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
  const badgeLabel = item.alsoAgent ? 'агент + скил' : item.kind === 'agent' ? 'агент' : 'скил';
  const badgeHighlight = item.kind === 'agent' || item.alsoAgent;

  const metaRows: Array<[string, string]> = [
    ['Тип', badgeLabel],
    ['Установка', item.install],
    ['Исходник', item.source],
  ];

  return (
    <div className="pb-10 pt-4 md:pt-8">
      <nav aria-label="Хлебные крошки" className="mb-2 flex flex-wrap items-center text-[14px]">
        <a href="/" className="text-basic-400 transition-colors hover:text-info-300">
          Каталог
        </a>
        <span className="mx-2 text-[11px] text-basic-800">›</span>
        <span className="text-basic-400">{kind === 'skill' ? 'Скилы' : 'Агенты'}</span>
        <span className="mx-2 text-[11px] text-basic-800">›</span>
        <span className="text-basic-400">{item.name}</span>
      </nav>

      <div className="flex flex-wrap">
        <div className="min-w-0 flex-grow basis-0 pr-0 lg:w-8/12 lg:pr-6">
          <div className="mb-4 rounded-md bg-card p-4 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={
                  badgeHighlight
                    ? 'rounded-full bg-primary px-2 py-1 text-[12px] font-semibold text-basic-900'
                    : 'rounded-full bg-basic-800 px-2 py-1 text-[12px] font-semibold text-basic-300'
                }
              >
                {badgeLabel}
              </span>
              <span className="text-[12px] text-basic-400">{item.source}</span>
            </div>

            <h1 className="mt-3 font-display text-[26px] font-extrabold leading-[32px] lg:text-[32px] lg:leading-[38px]">
              {item.name}
            </h1>

            <div className="mt-4 flex aspect-[400/235] items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-preview-a to-preview-b">
              <span className="font-mono text-[64px] font-semibold text-basic-400/50 lg:text-[96px]">
                {item.id}
              </span>
            </div>
          </div>

          <section className="mb-4 rounded-md bg-card p-4 lg:p-6">
            <h2 className="mb-2 w-full font-display text-[20px] font-bold leading-[26px]">
              Описание
            </h2>
            <p className="text-[16px] leading-6 text-basic-300">{item.description}</p>
          </section>

          <section className="mb-4 rounded-md bg-card p-4 lg:p-6">
            <h2 className="mb-2 w-full font-display text-[20px] font-bold leading-[26px]">
              Параметры
            </h2>
            {metaRows.map(([label, value]) => (
              <div key={label} className="param-row">
                <span className="param-label">{label}</span>
                <span className="param-dash" />
                <span className="param-value">{value}</span>
              </div>
            ))}
          </section>

          <section className="rounded-md bg-card p-4 lg:p-6">
            <h2 className="mb-2 w-full font-display text-[20px] font-bold leading-[26px]">
              Содержимое SKILL.md
            </h2>
            <div className="markdown-body">
              <MarkdownBody body={item.body} />
            </div>
          </section>
        </div>

        <aside className="w-full lg:w-4/12">
          <div className="rounded-md bg-card p-4 lg:sticky lg:top-8 lg:p-6">
            <h2 className="font-display text-[22px] font-extrabold leading-[28px]">
              {item.install.split('--skill ')[1]}
            </h2>
            <p className="mt-0.5 text-[14px] text-basic-400">команда установки</p>

            <div className="mt-4">
              <InstallBlock command={item.install} />
            </div>

            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block text-[14px] font-semibold text-info-300 transition-colors hover:text-info-100"
            >
              Исходник на GitHub →
            </a>

            <div className="mt-4 border-t border-basic-100/10 pt-4">
              <p className="text-[12px] text-basic-400">Форматы</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-basic-800 px-2.5 py-1 text-[12px] text-basic-300">
                  Claude Code
                </span>
                <span className="rounded-full bg-basic-800 px-2.5 py-1 text-[12px] text-basic-300">
                  OpenCode
                </span>
                <span className="rounded-full bg-basic-800 px-2.5 py-1 text-[12px] text-basic-300">
                  Cursor
                </span>
              </div>
            </div>

            <div className="mt-4 border-t border-basic-100/10 pt-4 text-[12px] leading-4 text-basic-400">
              Устанавливается через npx skills отдельной командой на каждого агента или скила.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
