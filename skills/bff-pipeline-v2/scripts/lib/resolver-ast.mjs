import fs from 'node:fs';

import { getOperationReturnType } from './gql-ast.mjs';
import { resolveGqlPath } from './gql-path.mjs';
import { createCheck } from './result.mjs';
import {
  extractExportedResolverName,
  resolveResolversIndexPath,
} from './resolver-path.mjs';

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function extractBalancedBlock(source, openBraceIndex) {
  let depth = 0;
  let index = openBraceIndex;

  while (index < source.length) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    }

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return source.slice(openBraceIndex, index + 1);
      }
    }

    index += 1;
  }

  return null;
}

export function extractResolverFieldName(source, kind) {
  const parentType = kind === 'query' ? 'Query' : 'Mutation';
  const blockRe = new RegExp(
    `createResolvers\\s*\\(\\s*\\{\\s*${parentType}\\s*:\\s*\\{\\s*(\\w+)\\s*:`
  );
  const match = source.match(blockRe);

  return match?.[1] ?? null;
}

export function extractResolverHandlerBody(source, kind, operationName) {
  const parentType = kind === 'query' ? 'Query' : 'Mutation';
  const blockRe = new RegExp(
    `createResolvers\\s*\\(\\s*\\{\\s*${parentType}\\s*:\\s*\\{`
  );

  if (!blockRe.test(source)) {
    return null;
  }

  const fieldRe = new RegExp(`\\b${operationName}\\s*:\\s*`);
  const fieldMatch = fieldRe.exec(source);

  if (!fieldMatch) {
    return null;
  }

  const afterField = source.slice(fieldMatch.index + fieldMatch[0].length);
  const arrowIndex = afterField.indexOf('=>');

  if (arrowIndex === -1) {
    return null;
  }

  const beforeArrow = afterField.slice(0, arrowIndex);
  const afterArrow = afterField.slice(arrowIndex + 2).trimStart();

  if (!/async\s*$/.test(beforeArrow.trim()) && !/\)\s*$/.test(beforeArrow.trim())) {
    return null;
  }

  if (afterArrow.startsWith('{')) {
    const openBraceIndex =
      fieldMatch.index + fieldMatch[0].length + arrowIndex + 2 + afterField.slice(arrowIndex + 2).indexOf('{');

    return extractBalancedBlock(source, openBraceIndex);
  }

  const exprMatch = afterArrow.match(/^[\s\S]+?(?=,\s*\w+\s*:|\s*\})/);

  return exprMatch?.[0].trim() ?? null;
}

export function checkResolverFieldName(source, manifest) {
  const fieldName = extractResolverFieldName(source, manifest.kind);

  if (!fieldName) {
    return createCheck(
      'resolver-field-name',
      false,
      `resolver field not found in createResolvers ${manifest.kind === 'query' ? 'Query' : 'Mutation'} block`
    );
  }

  if (fieldName !== manifest.operation) {
    return createCheck(
      'resolver-field-name',
      false,
      `field name mismatch: expected "${manifest.operation}", got "${fieldName}"`
    );
  }

  return createCheck('resolver-field-name', true, fieldName);
}

export function checkResolverRegistration(bffRoot, source) {
  const exportName = extractExportedResolverName(source);

  if (!exportName) {
    return createCheck(
      'resolver-registration',
      false,
      'export const *Resolver not found in resolver file'
    );
  }

  const { absPath, relPath } = resolveResolversIndexPath(bffRoot);

  if (!fs.existsSync(absPath)) {
    return createCheck('resolver-registration', false, `resolvers index not found: ${relPath}`);
  }

  const indexSource = fs.readFileSync(absPath, 'utf8');
  const indexWithoutComments = stripComments(indexSource);
  const importsResolver = new RegExp(
    `import\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}\\s*from`
  ).test(indexSource);
  const registersResolver = new RegExp(`mergeResolvers\\s*\\(\\s*\\[[\\s\\S]*\\b${exportName}\\b`).test(
    indexWithoutComments
  );

  if (!importsResolver || !registersResolver) {
    return createCheck(
      'resolver-registration',
      false,
      `${exportName} must be imported and included in mergeResolvers([...]) in src/graph/resolvers.ts`
    );
  }

  return createCheck('resolver-registration', true, exportName);
}

function handlerReturnsTrue(body) {
  return /return\s+true\b/.test(body) || /=>\s*true\b/.test(body);
}

export function checkVoidMutationReturn(bffRoot, resolverSource, manifest, graphql) {
  if (manifest.kind !== 'mutation') {
    return createCheck('void-mutation-return', true, 'not a mutation');
  }

  const { absPath: gqlAbsPath } = resolveGqlPath(bffRoot, manifest);

  if (!fs.existsSync(gqlAbsPath)) {
    return createCheck(
      'void-mutation-return',
      false,
      'cannot verify void mutation return: gql schema file not found'
    );
  }

  const gqlSource = fs.readFileSync(gqlAbsPath, 'utf8');
  const returnType = getOperationReturnType(gqlSource, manifest, graphql);

  if (returnType !== 'Boolean') {
    return createCheck('void-mutation-return', true, `return type: ${returnType ?? 'unknown'}`);
  }

  const body = extractResolverHandlerBody(resolverSource, manifest.kind, manifest.operation);

  if (!body) {
    return createCheck(
      'void-mutation-return',
      false,
      `resolver handler for "${manifest.operation}" not found`
    );
  }

  if (!handlerReturnsTrue(body)) {
    return createCheck(
      'void-mutation-return',
      false,
      'Boolean mutation must return true (not NullResponse or raw datasource result)'
    );
  }

  return createCheck('void-mutation-return', true, 'return true');
}

export function runResolverAstChecks(bffRoot, resolverSource, manifest, graphql) {
  return [
    checkResolverFieldName(resolverSource, manifest),
    checkResolverRegistration(bffRoot, resolverSource),
    checkVoidMutationReturn(bffRoot, resolverSource, manifest, graphql),
  ];
}
