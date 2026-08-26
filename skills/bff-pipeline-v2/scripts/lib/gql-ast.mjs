import { createCheck } from './result.mjs';

export function parseGqlDocument(source, graphql) {
  return graphql.parse(source, { noLocation: true });
}

export function collectTypeExtensions(ast, graphql) {
  const extensions = new Map();

  graphql.visit(ast, {
    [graphql.Kind.OBJECT_TYPE_EXTENSION](node) {
      const fields = node.fields ?? [];

      extensions.set(node.name.value, fields);
    },
  });

  return extensions;
}

export function collectTypeDefinitions(ast, graphql) {
  const types = new Map();

  graphql.visit(ast, {
    [graphql.Kind.OBJECT_TYPE_DEFINITION](node) {
      types.set(node.name.value, node.fields ?? []);
    },
  });

  return types;
}

function getNamedType(typeNode, graphql) {
  if (!typeNode) {
    return null;
  }

  if (typeNode.kind === graphql.Kind.NON_NULL_TYPE) {
    return getNamedType(typeNode.type, graphql);
  }

  if (typeNode.kind === graphql.Kind.LIST_TYPE) {
    return getNamedType(typeNode.type, graphql);
  }

  return typeNode.name.value;
}

export function findOperationField(ast, kind, operationName, graphql) {
  const parentType = kind === 'query' ? 'Query' : 'Mutation';
  const extensions = collectTypeExtensions(ast, graphql);
  const fields = extensions.get(parentType) ?? [];

  return fields.find((field) => field.name.value === operationName) ?? null;
}

export function checkOperationAst(source, manifest, graphql) {
  let ast;

  try {
    ast = parseGqlDocument(source, graphql);
  } catch (error) {
    return createCheck('operation-ast', false, `invalid GraphQL syntax: ${error.message}`);
  }

  const field = findOperationField(ast, manifest.kind, manifest.operation, graphql);

  if (!field) {
    return createCheck(
      'operation-ast',
      false,
      `field "${manifest.operation}" not found in extend type ${manifest.kind === 'query' ? 'Query' : 'Mutation'}`
    );
  }

  return createCheck('operation-ast', true, `${manifest.kind} ${manifest.operation}`);
}

export function checkVoidMutation(source, manifest, graphql) {
  if (manifest.kind !== 'mutation') {
    return createCheck('void-mutation', true, 'not a mutation');
  }

  let ast;

  try {
    ast = parseGqlDocument(source, graphql);
  } catch (error) {
    return createCheck('void-mutation', false, `invalid GraphQL syntax: ${error.message}`);
  }

  const field = findOperationField(ast, manifest.kind, manifest.operation, graphql);

  if (!field) {
    return createCheck('void-mutation', false, `mutation field "${manifest.operation}" not found`);
  }

  const returnType = getNamedType(field.type, graphql);

  if (returnType === 'NullResponse') {
    return createCheck(
      'void-mutation',
      false,
      'NullResponse is forbidden for new mutations; use Boolean! for void mutations'
    );
  }

  return createCheck('void-mutation', true, `return type: ${returnType}`);
}

export function getOperationReturnType(source, manifest, graphql) {
  const ast = parseGqlDocument(source, graphql);
  const field = findOperationField(ast, manifest.kind, manifest.operation, graphql);

  if (!field) {
    return null;
  }

  return getNamedType(field.type, graphql);
}

export function getGraphqlTypeFields(source, typeName, graphql) {
  const ast = parseGqlDocument(source, graphql);
  const types = collectTypeDefinitions(ast, graphql);
  const fields = types.get(typeName) ?? [];

  return fields.map((field) => field.name.value);
}
