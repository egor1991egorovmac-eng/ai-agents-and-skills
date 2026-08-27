import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'ai-agents-and-skills — агенты и скилы',
  description:
    'Два агента и десять скилов на каждый день: bff-pipeline-bff, bff-pipeline-client, realt-flow и stage-скилы для Claude Code, OpenCode, Cursor.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <div className="m-3.5 min-h-[calc(100vh-28px)] border border-white/20 outline outline-1 outline-white/5 outline-offset-[5px]">
          <header className="flex flex-wrap justify-between border-b border-white/20 font-mono text-xs uppercase tracking-wider text-ink-dim">
            <div className="border-r border-white/20 px-6 py-3.5">
              <strong className="block font-display text-[15px] font-semibold tracking-wide normal-case text-ink">
                AI-AGENTS-AND-SKILLS
              </strong>
              агенты и скилы · Realt frontend
            </div>
            <div className="ml-auto px-6 py-3.5 text-right">REV main<br />SHEET 1 OF 1</div>
          </header>

          <main>{children}</main>

          <footer className="mt-auto border-t border-white/20">
            <div className="flex flex-wrap justify-between gap-4 px-6 py-4.5 font-mono text-xs tracking-wider text-ink-dim">
              <span>
                github.com/
                <a
                  className="text-cyan hover:underline"
                  href="https://github.com/egor1991egorovmac-eng/ai-agents-and-skills"
                >
                  egor1991egorovmac-eng/ai-agents-and-skills
                </a>
              </span>
              <span>SSG · Next.js · Tailwind</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
