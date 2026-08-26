import fs from 'node:fs';
import path from 'node:path';

import { createCheck } from './result.mjs';

const APOLLO_FILENAME_RE = /^apollo-[a-z0-9]+(?:-[a-z0-9]+)*\.(mutation|query|fragment)\.ts$/;

const KIND_EXTENSION = {
  query: 'query',
  mutation: 'mutation',
  fragment: 'fragment',
};

const KIND_FILENAME_RE = {
  query: /^apollo-(?:[a-z0-9]+-){2,}(?:listing|by-uuid)\.query\.ts$/,
  mutation: /^apollo-[a-z0-9]+(?:-[a-z0-9]+){2,}\.mutation\.ts$/,
  fragment: APOLLO_FILENAME_RE,
};

export function resolveApolloKind(manifest) {
  if (manifest.apolloKind) {
    return manifest.apolloKind;
  }

  const basename = path.basename(manifest.apolloPath ?? '');

  if (basename.endsWith('.fragment.ts')) {
    return 'fragment';
  }

  return manifest.kind;
}

export function validateApolloFilename(filename, apolloKind) {
  if (!APOLLO_FILENAME_RE.test(filename)) {
    return {
      passed: false,
      detail: `filename must match apollo-{namespace}-{action}-{entity}.{mutation,query,fragment}.ts, got: ${filename}`,
    };
  }

  const extensionKind = filename.match(APOLLO_FILENAME_RE)?.[1];
  const expectedKind = KIND_EXTENSION[apolloKind];

  if (!expectedKind) {
    return {
      passed: false,
      detail: `unsupported apolloKind: ${apolloKind}`,
    };
  }

  if (extensionKind !== expectedKind) {
    return {
      passed: false,
      detail: `filename extension ".${extensionKind}.ts" does not match apolloKind "${apolloKind}"`,
    };
  }

  if (!KIND_FILENAME_RE[apolloKind].test(filename)) {
    return {
      passed: false,
      detail: `filename does not match ${apolloKind} atomic naming convention: ${filename}`,
    };
  }

  return { passed: true, detail: filename };
}

export function resolveApolloPath(clientRoot, manifest) {
  const relPath = manifest.apolloPath.startsWith('src/')
    ? manifest.apolloPath
    : path.join('src', manifest.apolloPath);
  const absPath = path.join(clientRoot, relPath);

  return { relPath, absPath };
}

export function checkApolloFile(clientRoot, manifest) {
  const { relPath, absPath } = resolveApolloPath(clientRoot, manifest);

  if (!fs.existsSync(absPath)) {
    return createCheck('apollo-file', false, `expected apollo file not found: ${relPath}`);
  }

  const filename = path.basename(relPath);
  const apolloKind = resolveApolloKind(manifest);
  const naming = validateApolloFilename(filename, apolloKind);

  if (!naming.passed) {
    return createCheck('apollo-filename', false, naming.detail);
  }

  return createCheck('apollo-filename', true, relPath);
}
