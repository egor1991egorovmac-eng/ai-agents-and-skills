import type { RegistryItem } from '@/lib/registry';

export function KindBadge({ item }: { item: RegistryItem }) {
  const label = item.alsoAgent ? 'агент + скил' : item.kind === 'agent' ? 'агент' : 'скил';
  const highlight = item.kind === 'agent' || item.alsoAgent;

  return (
    <span
      className={
        highlight
          ? 'shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-basic-900'
          : 'shrink-0 rounded-full bg-basic-800 px-2 py-0.5 text-[11px] font-semibold text-basic-300'
      }
    >
      {label}
    </span>
  );
}

export function ItemCard({ item }: { item: RegistryItem }) {
  const href = `/${item.kind}/${encodeURIComponent(item.id)}/`;

  return (
    <a
      href={href}
      className="group flex w-full flex-col gap-2 rounded-md border border-basic-100/10 bg-card p-4 transition-all hover:border-basic-100/20 hover:bg-card-hover hover:shadow-[0_5px_10px_rgba(91,100,115,0.18)] md:flex-row md:items-center md:gap-5 md:px-5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <h3 className="shrink-0 font-display text-[17px] font-bold leading-snug text-ink">
          {item.name}
        </h3>
        <KindBadge item={item} />
      </div>

      <p className="min-w-0 flex-1 text-[14px] leading-5 text-basic-400 md:flex-[2]">
        {item.description}
      </p>

      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-basic-100/10 pt-2 md:border-t-0 md:pt-0">
        <span className="font-mono text-[12px] text-basic-400">
          {item.kind === 'agent' ? 'этапы 0–6' : 'npx skills'}
        </span>
        <span className="font-mono text-[12px] font-semibold uppercase tracking-wide text-info-300 opacity-0 transition-opacity group-hover:opacity-100">
          открыть →
        </span>
      </div>
    </a>
  );
}
