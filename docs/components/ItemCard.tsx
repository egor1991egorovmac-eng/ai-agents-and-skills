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
      className="group flex flex-col overflow-hidden rounded-md border border-basic-100/10 bg-card transition-all hover:-translate-y-0.5 hover:border-basic-100/20 hover:shadow-[0_5px_10px_rgba(91,100,115,0.18)]"
    >
      <div className="relative flex aspect-[400/235] items-center justify-center overflow-hidden rounded-t-md bg-gradient-to-br from-[#262b33] to-[#1a1e24]">
        <span className="font-mono text-[44px] font-semibold text-basic-400/60 transition-colors group-hover:text-primary/70">
          {item.id.slice(0, 2)}
        </span>
        <span className="absolute left-3 top-3">
          <KindBadge item={item} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-[17px] font-bold leading-snug text-ink">
            {item.name}
          </h3>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[14px] leading-5 text-basic-400">
          {item.description}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-basic-100/10 pt-3">
          <span className="font-mono text-[12px] text-basic-400">
            {item.kind === 'agent' ? 'этапы 0–6' : 'npx skills'}
          </span>
          <span className="font-mono text-[12px] font-semibold uppercase tracking-wide text-info-300 opacity-0 transition-opacity group-hover:opacity-100">
            открыть →
          </span>
        </div>
      </div>
    </a>
  );
}
