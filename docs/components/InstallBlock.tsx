'use client';

import { useState } from 'react';

export function InstallBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard недоступен — просто игнорируем
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border border-white/20 bg-paper-deep px-4 py-3 font-mono text-[13.5px]">
      <span className="text-cyan">$</span>
      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 border border-white/20 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink transition-colors hover:border-cyan hover:text-cyan"
      >
        {copied ? 'Скопировано' : 'Копировать'}
      </button>
    </div>
  );
}
