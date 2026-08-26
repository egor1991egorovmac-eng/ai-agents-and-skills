import { resolveApolloKind } from './apollo-path.mjs';
import { createCheck } from './result.mjs';

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

export function extractGqlTemplates(source) {
  const templates = [];
  const re = /gql\s*(?:`([\s\S]*?)`|(?:\(\s*`([\s\S]*?)`\s*\)))/g;

  for (const match of source.matchAll(re)) {
    templates.push(match[1] ?? match[2]);
  }

  return templates;
}

export function countGqlOperations(gqlBody) {
  const body = stripComments(gqlBody);
  let count = 0;

  for (const match of body.matchAll(/\b(query|mutation|fragment)\s+(\w+)/g)) {
    if (match[1] === 'fragment') {
      count += 1;
      continue;
    }

    count += 1;
  }

  return count;
}

export function extractOperationName(gqlBody, apolloKind) {
  const body = stripComments(gqlBody);

  if (apolloKind === 'fragment') {
    const match = body.match(/\bfragment\s+(\w+)\s+on\b/);

    return match?.[1] ?? null;
  }

  const match = body.match(new RegExp(`\\b${apolloKind}\\s+(\\w+)`));

  return match?.[1] ?? null;
}

export function checkSingleOperation(source) {
  const templates = extractGqlTemplates(source);
  let total = 0;

  for (const template of templates) {
    total += countGqlOperations(template);
  }

  if (total === 0) {
    return createCheck('apollo-single-operation', false, 'no GraphQL operation found in gql template');
  }

  if (total > 1) {
    return createCheck(
      'apollo-single-operation',
      false,
      `expected one operation per file, found ${total}`
    );
  }

  return createCheck('apollo-single-operation', true, 'one operation');
}

export function checkOperationName(source, manifest) {
  const apolloKind = resolveApolloKind(manifest);
  const templates = extractGqlTemplates(source);
  const gqlBody = templates[0];

  if (!gqlBody) {
    return createCheck('apollo-operation-name', false, 'gql template not found');
  }

  const operationName = extractOperationName(gqlBody, apolloKind);

  if (!operationName) {
    return createCheck(
      'apollo-operation-name',
      false,
      `${apolloKind} operation name not found in gql template`
    );
  }

  const expectedName =
    apolloKind === 'fragment' ? manifest.fragmentName ?? manifest.operation : manifest.operation;

  if (operationName !== expectedName) {
    return createCheck(
      'apollo-operation-name',
      false,
      `operation name mismatch: expected "${expectedName}", got "${operationName}"`
    );
  }

  return createCheck('apollo-operation-name', true, operationName);
}

export function checkHookName(source, manifest) {
  const hookPattern = new RegExp(`:\\s*${manifest.hookName}\\b`);

  if (!hookPattern.test(source)) {
    return createCheck(
      'apollo-hook-name',
      false,
      `hook "${manifest.hookName}" not found in export destructuring`
    );
  }

  return createCheck('apollo-hook-name', true, manifest.hookName);
}

export function checkPickUsage(source, manifest) {
  const apolloKind = resolveApolloKind(manifest);

  if (apolloKind === 'fragment') {
    if (!/createApolloFragment\s*</.test(source)) {
      return createCheck(
        'apollo-pick-type',
        false,
        'fragment must use createApolloFragment<Type> from lib/apollo/create-apollo-bindings'
      );
    }

    return createCheck('apollo-pick-type', true, 'createApolloFragment');
  }

  const parentType = apolloKind === 'query' ? 'Query' : 'Mutation';
  const pickRe = new RegExp(
    `Pick<\\s*${parentType}\\s*,\\s*['"]${manifest.operation}['"]\\s*>`
  );

  if (!pickRe.test(source)) {
    return createCheck(
      'apollo-pick-type',
      false,
      `expected Pick<${parentType}, '${manifest.operation}'> in createApollo${apolloKind === 'query' ? 'Query' : 'Mutation'} generic`
    );
  }

  const binding = apolloKind === 'query' ? 'createApolloQuery' : 'createApolloMutation';

  if (!source.includes(binding)) {
    return createCheck(
      'apollo-pick-type',
      false,
      `expected ${binding} from lib/apollo/create-apollo-bindings`
    );
  }

  return createCheck('apollo-pick-type', true, `Pick<${parentType}, '${manifest.operation}'>`);
}

export function checkTypeOnlyImports(source) {
  const imports = [...source.matchAll(/import\s+(type\s*)?\{([^}]+)\}\s*from\s*['"]lib\/graphql\/types['"]/g)];

  if (imports.length === 0) {
    return createCheck(
      'apollo-type-imports',
      false,
      'must import types from lib/graphql/types'
    );
  }

  const nonTypeImport = imports.find((match) => !match[1]);

  if (nonTypeImport) {
    return createCheck(
      'apollo-type-imports',
      false,
      'imports from lib/graphql/types must use import type'
    );
  }

  return createCheck('apollo-type-imports', true, 'import type from lib/graphql/types');
}

export function checkNoDefaultExport(source) {
  if (/\bexport\s+default\b/.test(stripComments(source))) {
    return createCheck('apollo-no-default-export', false, 'default export is forbidden');
  }

  return createCheck('apollo-no-default-export', true, 'named export only');
}

export function runApolloAstChecks(source, manifest) {
  return [
    checkSingleOperation(source),
    checkOperationName(source, manifest),
    checkHookName(source, manifest),
    checkPickUsage(source, manifest),
    checkTypeOnlyImports(source),
    checkNoDefaultExport(source),
  ];
}
