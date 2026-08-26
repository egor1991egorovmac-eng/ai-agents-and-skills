import { fail } from "./repos.ts";

export type Story = {
  id: string;
  slug: string;
  title: string;
  url: string;
};

export function parseStoryUrl(input: string): { id: string; slug: string } {
  const m = input.match(/youtrack\.realt\.by\/issue\/(REALT-(\d+))(?:\/([^/?#]+))?/i);
  if (!m) {
    fail("Не удалось разобрать ссылку на сторю. Ожидается вид https://youtrack.realt.by/issue/REALT-{id}/{slug}");
  }
  return { id: m[2], slug: m[3] ?? "" };
}

async function fetchStory(id: string): Promise<{ summary: string } | null> {
  const token = process.env.YOUTRACK_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://youtrack.realt.by/api/issues/REALT-${id}?fields=idReadable,summary`,
      { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) {
      console.error(`Ошибка YouTrack API: HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as { summary: string };
  } catch (e) {
    console.error(`YouTrack недоступен: ${e instanceof Error ? e.message : e}`);
    return null;
  }
}

const arg = process.argv[2];
if (!arg) fail("Использование: bun run get-story.ts <ссылка на сторю>");

const { id, slug } = parseStoryUrl(arg);
const story = await fetchStory(id);

if (!story) {
  console.log(JSON.stringify({ ok: false, manualFallback: true, id, slug }, null, 2));
  console.error("\nYouTrack недоступен или YOUTRACK_TOKEN не задан.");
  console.error("Ручной режим: агент должен запросить у пользователя:");
  console.error("  1. REALT-" + id + " (id)");
  console.error("  2. slug из ссылки (для имени ветки)" + (slug ? ` — уже известен: ${slug}` : ""));
  console.error("  3. короткий понятный title (для MR)");
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, id, slug, title: story.summary, url: `https://youtrack.realt.by/issue/REALT-${id}` }, null, 2));
