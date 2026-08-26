import { createCheck } from './result.mjs';
import {
  collectTypeDefinitions,
  findOperationField,
  parseGqlDocument,
} from './gql-ast.mjs';

function fieldSignature(field) {
  const type = printType(field.type);
  return `${field.name.value}:${type}`;
}

function printType(typeNode) {
  if (typeNode.kind === 'NonNullType') {
    return `${printType(typeNode.type)}!`;
  }

  if (typeNode.kind === 'ListType') {
    return `[${printType(typeNode.type)}]`;
  }

  return typeNode.name.value;
}

function buildTypeMap(source, graphql) {
  const ast = parseGqlDocument(source, graphql);
  const defs = collectTypeDefinitions(ast, graphql);

  return Object.fromEntries(
    [...defs.entries()].map(([name, fields]) => [
      name,
      fields.map((field) => fieldSignature(field)).sort(),
    ])
  );
}

function buildOperationSignature(source, manifest, graphql) {
  const ast = parseGqlDocument(source, graphql);
  const field = findOperationField(ast, manifest.kind, manifest.operation, graphql);

  if (!field) {
    return null;
  }

  return fieldSignature(field);
}

export function detectBreakingChanges(baselineSource, currentSource, manifest, graphql) {
  const issues = [];

  const baselineOp = buildOperationSignature(baselineSource, manifest, graphql);
  const currentOp = buildOperationSignature(currentSource, manifest, graphql);

  if (baselineOp && currentOp && baselineOp !== currentOp) {
    issues.push(`operation signature changed: ${baselineOp} → ${currentOp}`);
  }

  const baselineTypes = buildTypeMap(baselineSource, graphql);
  const currentTypes = buildTypeMap(currentSource, graphql);

  for (const [typeName, baselineFields] of Object.entries(baselineTypes)) {
    const currentFields = currentTypes[typeName];

    if (!currentFields) {
      issues.push(`type removed: ${typeName}`);
      continue;
    }

    const removed = baselineFields.filter((field) => !currentFields.includes(field));

    if (removed.length > 0) {
      issues.push(`fields removed from ${typeName}: ${removed.join(', ')}`);
    }
  }

  return issues;
}

export async function checkBreakingChange(
  { bffRoot, relPath, currentSource, manifest, graphql },
  { exec, getBaseline = defaultGetBaseline } = {}
) {
  const baselineResult = await getBaseline({ bffRoot, relPath, exec });

  if (baselineResult.blocked) {
    return createCheck('breaking-change', false, baselineResult.detail, { blocked: true });
  }

  if (baselineResult.missing) {
    return createCheck('breaking-change', true, 'new gql file (no git baseline)');
  }

  const issues = detectBreakingChanges(
    baselineResult.source,
    currentSource,
    manifest,
    graphql
  );

  if (issues.length > 0) {
    return createCheck('breaking-change', false, issues.join('; '));
  }

  return createCheck('breaking-change', true, 'compatible with git baseline');
}

async function defaultGetBaseline({ bffRoot, relPath, exec }) {
  if (!exec) {
    return { missing: true };
  }

  const result = await exec('git', ['show', `HEAD:${relPath}`], {
    cwd: bffRoot,
    timeoutMs: 10000,
  });

  if (result.timedOut) {
    return { blocked: true, detail: 'git show timed out' };
  }

  if (result.code !== 0) {
    return { missing: true };
  }

  return { source: result.stdout };
}
