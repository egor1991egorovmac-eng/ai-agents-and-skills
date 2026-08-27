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
      // clipboard недоступен — игнорируем
    }
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-basic-100/10 bg-footer px-4 py-3 font-mono text-[13px] text-basic-300">
        <span className="select-none text-primary">$</span> {command}
      </div>
      <button
        type="button"
        onClick={copy}
        className="mt-3 w-full rounded-md bg-primary px-[15px] py-[9px] text-[16px] font-semibold text-basic-900 transition-colors hover:bg-primary-500 active:bg-primary-300"
      >
        {copied ? 'Скопировано ✓' : 'Скопировать команду'}
      </button>
    </div>
  );
}
