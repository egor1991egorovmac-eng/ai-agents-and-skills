import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';

import './globals.css';

const THEME_SCRIPT = `(function () {
  try {
    var t = localStorage.getItem('theme');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();`;

export const metadata: Metadata = {
  title: 'ai-agents-and-skills — агенты и скилы',
  description:
    'Два агента и десять скилов: bff-pipeline-bff, bff-pipeline-client, realt-flow и stage-скилы для Claude Code, OpenCode, Cursor.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <meta name="color-scheme" content="dark light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Raleway:wght@700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <header className="border-b border-basic-100/10 bg-card shadow-[0_5px_10px_rgba(91,100,115,0.12)]">
          <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-3 px-6 py-4 lg:px-[38px]">
            <a href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-md bg-primary font-mono text-sm font-semibold text-basic-900">
                A
              </span>
              <span className="font-display text-lg font-extrabold leading-none">
                AI-AGENTS<span className="text-primary">&</span>SKILLS
              </span>
            </a>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/egor1991egorovmac-eng/ai-agents-and-skills"
                target="_blank"
                rel="noreferrer"
                className="hidden font-mono text-[13px] text-basic-400 transition-colors hover:text-info-300 sm:block"
              >
                github.com/egor1991egorovmac-eng/ai-agents-and-skills
              </a>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-screen-xl px-6 lg:px-[38px]">{children}</main>

        <footer className="mt-10 bg-footer-bg">
          <div className="mx-auto max-w-screen-xl px-6 py-6 lg:px-[38px]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-footer-border pb-4 text-[13px] text-footer-text">
              <span>
                Скилы и агенты для Claude Code · OpenCode · Cursor. SSG на Next.js.
              </span>
              <span className="font-mono">REV main · SHEET 1 OF 1</span>
            </div>
            <div className="flex flex-wrap justify-between gap-3 pt-4 text-[12px] text-footer-text">
              <span>© {new Date().getFullYear()} ai-agents-and-skills</span>
              <span>
                Установка:{' '}
                <code className="text-footer-dim">
                  npx skills add egor1991egorovmac-eng/ai-agents-and-skills -g
                </code>
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
