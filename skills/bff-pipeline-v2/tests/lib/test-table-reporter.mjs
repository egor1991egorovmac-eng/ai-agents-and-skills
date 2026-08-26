import { formatFileTable, formatSummary, isLeafTest, toRow } from './test-table.mjs';

export default async function* tableReporter(source) {
  const byFile = new Map();
  const order = [];
  let lastFile = null;

  for await (const event of source) {
    if (!isLeafTest(event)) {
      continue;
    }

    const file = event.data.file ?? 'unknown';

    if (lastFile && lastFile !== file && byFile.has(lastFile)) {
      yield formatFileTable(lastFile, byFile.get(lastFile));
    }

    lastFile = file;

    if (!byFile.has(file)) {
      byFile.set(file, []);
      order.push(file);
    }

    byFile.get(file).push(toRow(event));
  }

  if (lastFile && byFile.has(lastFile)) {
    yield formatFileTable(lastFile, byFile.get(lastFile));
  }

  if (order.length > 0) {
    yield formatSummary(order.map((file) => ({ file, rows: byFile.get(file) })));
  }
}
