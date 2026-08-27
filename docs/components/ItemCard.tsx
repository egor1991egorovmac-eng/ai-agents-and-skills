import type { RegistryItem } from '@/lib/registry';

export function KindBadge({ item }: { item: RegistryItem }) {
  const label = item.alsoAgent ? 'агент + скил' : item.kind === 'agent' ? 'агент' : 'скил';

  return (
    <span className="shrink-0 rounded-full border border-white/20 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim">
      {label}
    </span>
  );
}

export function ItemCard({ item }: { item: RegistryItem }) {
  const href = `/${item.kind}/${encodeURIComponent(item.id)}/`;

  return (
    <a
      href={href}
      className="group flex flex-col gap-2 border border-white/20 bg-paper p-4 transition-colors hover:bg-paper-deep focus-visible:outline-cyan"
    >
      <div className="flex items-center justify-between gap-2">
        <code className="font-mono text-sm text-cyan">{item.id}</code>
        <KindBadge item={item} />
      </div>
      <p className="line-clamp-3 text-sm text-ink-dim">{item.description}</p>
      <span className="mt-auto pt-1 font-mono text-xs uppercase tracking-wider text-ink-dim opacity-0 transition-opacity group-hover:opacity-100">
        открыть →
      </span>
    </a>
  );
}
