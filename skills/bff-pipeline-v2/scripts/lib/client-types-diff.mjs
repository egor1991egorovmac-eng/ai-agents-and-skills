import path from 'node:path';
import { createRequire } from 'node:module';

const TYPE_DECL_RE = /^export (?:type|enum|interface) (\w+)/gm;

export const CLIENTS_BY_STACK = {
  'bff-mls': ['mls', 'admin', 'www'],
  'bff-admin': ['admin'],
};

export const CLIENT_SCHEMA_ENV = {
  mls: 'API_MLS_URL',
  admin: 'GRAPHQL_URL',
  www: 'GRAPHQL_URL',
};

export const TYPES_FILE = 'src/lib/graphql/types.ts';
export const CODEGEN_FILE = 'codegen.js';

function extractTypeDeclarationsFallback(source) {
  const declarations = new Map();
  const starts = [];

  for (const match of source.matchAll(TYPE_DECL_RE)) {
    starts.push({ name: match[1], index: match.index });
  }

  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index].index;
    const end = index + 1 < starts.length ? starts[index + 1].index : source.length;

    const text = source.slice(start, end).trimEnd();
    const members = new Map();
    const body = text.slice(text.indexOf('{') + 1, text.lastIndexOf('}'));

    for (const match of body.matchAll(/^\s*([A-Za-z_$][\w$]*)\??\s*[:(]/gm)) {
      members.set(match[1], match[0].trim());
    }

    declarations.set(starts[index].name, { text, members });
  }

  return declarations;
}

function memberName(member, sourceFile) {
  if (!member.name) {
    return null;
  }

  return member.name.text ?? member.name.getText(sourceFile);
}

export function extractTypeDeclarations(source, typescript = null) {
  if (!typescript) {
    return extractTypeDeclarationsFallback(source);
  }

  const sourceFile = typescript.createSourceFile(
    TYPES_FILE,
    source,
    typescript.ScriptTarget.Latest,
    true,
    typescript.ScriptKind.TS
  );
  const declarations = new Map();

  for (const statement of sourceFile.statements) {
    const supported =
      typescript.isTypeAliasDeclaration(statement) ||
      typescript.isInterfaceDeclaration(statement) ||
      typescript.isEnumDeclaration(statement);

    if (!supported || !statement.modifiers?.some((modifier) => modifier.kind === typescript.SyntaxKind.ExportKeyword)) {
      continue;
    }

    const membersNode = typescript.isTypeAliasDeclaration(statement) &&
      typescript.isTypeLiteralNode(statement.type)
      ? statement.type
      : statement;
    const members = new Map();

    for (const member of membersNode.members ?? []) {
      const name = memberName(member, sourceFile);

      if (name) {
        members.set(name, source.slice(member.getStart(sourceFile), member.end).trim());
      }
    }

    declarations.set(statement.name.text, {
      text: source.slice(statement.getStart(sourceFile), statement.end).trimEnd(),
      members,
    });
  }

  return declarations;
}

export function extractTypeBlocks(source, typescript = null) {
  return new Map(
    [...extractTypeDeclarations(source, typescript)].map(([name, declaration]) => [
      name,
      declaration.text,
    ])
  );
}

export function loadClientTypeScript(clientRoot) {
  return createRequire(path.join(clientRoot, 'package.json'))('typescript');
}

export function findMissingTypes(source, expectedTypes, typescript = null) {
  const blocks = extractTypeBlocks(source, typescript);

  return expectedTypes.filter((name) => !blocks.has(name));
}

function changedMembers(before, after) {
  const beforeMembers = before?.members ?? new Map();
  const afterMembers = after?.members ?? new Map();

  return [...new Set([...beforeMembers.keys(), ...afterMembers.keys()])]
    .filter((name) => beforeMembers.get(name) !== afterMembers.get(name));
}

export function findUnrelatedTypeChanges(
  beforeSource,
  afterSource,
  allowedTypes,
  { operation = null, typescript = null } = {}
) {
  const allowed = new Set(allowedTypes);
  const beforeDeclarations = extractTypeDeclarations(beforeSource, typescript);
  const afterDeclarations = extractTypeDeclarations(afterSource, typescript);
  const unrelated = [];

  for (const name of new Set([...beforeDeclarations.keys(), ...afterDeclarations.keys()])) {
    const before = beforeDeclarations.get(name);
    const after = afterDeclarations.get(name);

    if (before?.text === after?.text) {
      continue;
    }

    if (allowed.has(name)) {
      continue;
    }

    const rootChanges = ['Query', 'Mutation'].includes(name)
      ? changedMembers(before, after)
      : [];

    if (operation && rootChanges.length > 0 && rootChanges.every((field) => field === operation)) {
      continue;
    }

    unrelated.push(name);
  }

  return unrelated.sort();
}

export function buildTypesDiff(beforeSource, afterSource, typescript = null) {
  const beforeBlocks = extractTypeBlocks(beforeSource, typescript);
  const afterBlocks = extractTypeBlocks(afterSource, typescript);
  const lines = [];

  for (const name of new Set([...beforeBlocks.keys(), ...afterBlocks.keys()]).values()) {
    const before = beforeBlocks.get(name);
    const after = afterBlocks.get(name);

    if (before === after) {
      continue;
    }

    lines.push(`--- ${name} ---`);

    if (before) {
      lines.push(`- ${before.split('\n').join('\n- ')}`);
    }

    if (after) {
      lines.push(`+ ${after.split('\n').join('\n+ ')}`);
    }
  }

  return lines.join('\n');
}

export function checkClientForStack(client, stack) {
  const allowed = CLIENTS_BY_STACK[stack] ?? [];

  if (!allowed.includes(client)) {
    return {
      passed: false,
      detail: `client ${client} is not supported for stack ${stack} (allowed: ${allowed.join(', ')})`,
    };
  }

  return { passed: true, detail: client };
}

export function checkCodegenSchemaSource(codegenSource, client, stack) {
  const clientCheck = checkClientForStack(client, stack);

  if (!clientCheck.passed) {
    return clientCheck;
  }

  const expectedEnv = CLIENT_SCHEMA_ENV[client];

  if (!codegenSource.includes(expectedEnv)) {
    return {
      passed: false,
      detail: `codegen.js schema must reference ${expectedEnv} for client ${client}`,
    };
  }

  if (client === 'mls' && stack === 'bff-mls' && codegenSource.includes('GRAPHQL_URL') && !codegenSource.includes('API_MLS_URL')) {
    return {
      passed: false,
      detail: 'mls client on bff-mls stack must use API_MLS_URL, not GRAPHQL_URL',
    };
  }

  return { passed: true, detail: expectedEnv };
}

export function buildCodegenEnv(bffTarget, baseEnv = process.env) {
  let parsed;

  try {
    parsed = new URL(bffTarget);
  } catch {
    throw new Error(`invalid BFF Target: ${bffTarget}`);
  }

  const origin = `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`;

  return {
    ...baseEnv,
    NEXT_PUBLIC_API_HOST: `${parsed.protocol}//${parsed.hostname}`,
    NEXT_PUBLIC_API_PORT: parsed.port,
    GRAPHQL_URL: bffTarget,
    API_MLS_URL: origin,
  };
}

export function buildClientCodegenCompactMeta({ client, expectedTypes }) {
  return `client=${client} types=${expectedTypes.join(',')}`;
}
