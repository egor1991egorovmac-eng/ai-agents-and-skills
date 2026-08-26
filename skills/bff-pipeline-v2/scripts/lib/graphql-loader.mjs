import { pathToFileURL } from 'node:url';
import path from 'node:path';

export async function loadGraphql(bffRoot) {
  const graphqlPath = path.join(bffRoot, 'node_modules/graphql/index.js');

  return import(pathToFileURL(graphqlPath).href);
}
