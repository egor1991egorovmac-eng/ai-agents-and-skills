import fs from 'node:fs';
import path from 'node:path';

import { createCheck } from './result.mjs';
import {
  getGraphqlTypeFields,
  getOperationReturnType,
  parseGqlDocument,
} from './gql-ast.mjs';

function findTypeDefinitionFile(serviceRoot, typeName) {
  const stack = [serviceRoot];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.name.endsWith('.ts')) {
        continue;
      }

      const source = fs.readFileSync(fullPath, 'utf8');

      if (new RegExp(`\\b(?:type|interface)\\s+${typeName}\\b`).test(source)) {
        return fullPath;
      }
    }
  }

  return null;
}

function parseTsTypeFields(source, typeName) {
  const blockMatch = source.match(
    new RegExp(`(?:export\\s+)?(?:type|interface)\\s+${typeName}\\s*\\{([\\s\\S]*?)\\}`, 'm')
  );

  if (blockMatch) {
    return extractFieldNames(blockMatch[1]);
  }

  const aliasMatch = source.match(
    new RegExp(`(?:export\\s+)?type\\s+${typeName}\\s*=\\s*([^;]+);`, 'm')
  );

  if (!aliasMatch) {
    return null;
  }

  const alias = aliasMatch[1].trim();

  if (/^[A-Z][A-Za-z0-9]*(\[\])?$/.test(alias.replace(/\[\]/g, ''))) {
    return { aliasTo: alias.replace(/\[\]/g, '') };
  }

  return null;
}

function extractFieldNames(block) {
  return block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'))
    .map((line) => line.split(':')[0]?.trim())
    .filter(Boolean);
}

function resolveApiTypeFields(apiSchemaRoot, service, typeName, visited = new Set()) {
  if (visited.has(typeName)) {
    return [];
  }

  visited.add(typeName);

  const serviceRoot = path.join(apiSchemaRoot, 'typescript', service);
  const typeFile = findTypeDefinitionFile(serviceRoot, typeName);

  if (!typeFile) {
    return null;
  }

  const source = fs.readFileSync(typeFile, 'utf8');
  const parsed = parseTsTypeFields(source, typeName);

  if (!parsed) {
    return null;
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  return resolveApiTypeFields(apiSchemaRoot, service, parsed.aliasTo, visited);
}

export function checkApiTypeFields({ bffRoot, source, manifest, graphql }) {
  const returnType = getOperationReturnType(source, manifest, graphql);

  if (manifest.kind === 'mutation' && returnType === 'Boolean') {
    return createCheck('api-type-fields', true, 'void mutation with Boolean! — field mapping skipped');
  }

  const graphqlType = manifest.graphqlType ?? manifest.apiResponseType;
  const gqlFields = getGraphqlTypeFields(source, graphqlType, graphql);
  const apiSchemaRoot = path.join(bffRoot, 'node_modules/@realt-by/api-schema');
  const apiFields = resolveApiTypeFields(
    apiSchemaRoot,
    manifest.service,
    manifest.apiResponseType
  );

  if (!apiFields) {
    return createCheck(
      'api-type-fields',
      false,
      `api type "${manifest.apiResponseType}" not found under service "${manifest.service}"`
    );
  }

  if (gqlFields.length === 0) {
    return createCheck(
      'api-type-fields',
      false,
      `graphql type "${graphqlType}" not found in operation gql file`
    );
  }

  const missing = apiFields.filter((field) => !gqlFields.includes(field));

  if (missing.length > 0) {
    return createCheck(
      'api-type-fields',
      false,
      `missing api fields in GraphQL type "${graphqlType}": ${missing.join(', ')}`
    );
  }

  return createCheck(
    'api-type-fields',
    true,
    `${graphqlType}: ${apiFields.length} fields mapped`
  );
}
