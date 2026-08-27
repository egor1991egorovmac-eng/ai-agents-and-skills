import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { loadRegistry } from '@/lib/registry';

// Реестр статичен и читается на этапе экспорта — можно поднять из компонента.
const KNOWN_IDS = new Set(loadRegistry().map((item) => item.id));

// Относительный путь к SKILL.md — на страницу скила: ../x/SKILL.md,
// ../../.claude/skills/x/SKILL.md, ../skills/x/SKILL.md и т.п.
function resolveSkillHref(href: string): string | null {
  const withoutAnchor = href.split('#')[0];
  const match = withoutAnchor.match(/\/([^/]+)\/SKILL\.md$/);

  if (!match || !KNOWN_IDS.has(match[1])) {
    return null;
  }

  return `/skill/${match[1]}/`;
}

export function MarkdownBody({ body }: { body: string }) {
  const link = ({ href, children }: { href?: string; children?: ReactNode }) => {
    if (!href) {
      return <>{children}</>;
    }

    if (/^https?:\/\//i.test(href)) {
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    }

    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      return <a href={href}>{children}</a>;
    }

    const resolved = resolveSkillHref(href);

    if (!resolved) {
      return <span>{children}</span>;
    }

    return <a href={resolved}>{children}</a>;
  };

  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: link }}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
