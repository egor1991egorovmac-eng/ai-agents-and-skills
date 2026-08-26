import test from 'node:test';
import assert from 'node:assert/strict';

import { STAGES, STAGE_COUNT, getStage } from '../scripts/lib/stages/index.mjs';

const baseManifest = {
  operation: 'objectsSearchV2',
  kind: 'query',
  domain: 'objects',
  stack: 'bff-admin',
};

const fullManifest = {
  ...baseManifest,
  service: 'objects',
  endpoint: '/objects',
  apiResponseType: 'ObjectsResponse',
  httpMethod: 'GET',
  datasourceMethod: 'getObjects',
  e2eQuery: 'query { x }',
  e2eVariables: {},
  assertions: [{ path: 'x' }],
  client: 'admin',
  expectedTypes: ['ObjectsSearchV2Response'],
  apolloPath: 'features/objects/apollo/apollo-objects-search.query.ts',
  hookName: 'useObjectsSearch',
};

const config = {
  projects: {
    bffAdmin: '/bff-admin',
    bffMls: '/bff-mls',
    admin: '/admin',
    mls: '/mls',
    www: '/www',
    graphifyVault: '/vault',
  },
  timeouts: {},
};

Object.assign(process.env, {
  BFF_PIPELINE_BFF_ROOT: config.projects.bffAdmin,
  BFF_PIPELINE_CLIENT_ROOT: config.projects.admin,
  BFF_PIPELINE_BFF_TARGET: 'http://127.0.0.1:4000/graphql',
});

test('registry lists stages 0..6 in order without gaps', () => {
  assert.equal(STAGE_COUNT, 7);
  assert.deepEqual(
    STAGES.map((stage) => stage.id),
    [0, 1, 2, 3, 4, 5, 6]
  );
});

test('every stage descriptor exposes the registry contract', () => {
  for (const stage of STAGES) {
    assert.equal(typeof stage.id, 'number', `stage ${stage.id}: id`);
    assert.equal(typeof stage.name, 'string', `stage ${stage.id}: name`);
    assert.equal(typeof stage.manifestSlice, 'function', `stage ${stage.id}: manifestSlice`);
    assert.equal(typeof stage.files, 'function', `stage ${stage.id}: files`);
    assert.equal(typeof stage.run, 'function', `stage ${stage.id}: run`);
  }
});

test('getStage returns descriptor by id and throws on unknown stage', () => {
  assert.equal(getStage(0).name, 'preflight');
  assert.equal(getStage(6).name, 'apollo');
  assert.throws(() => getStage(7), /unknown stage: 7/);
});

test('manifestSlice keeps base fields for every stage', () => {
  for (const stage of STAGES) {
    const slice = stage.manifestSlice(baseManifest);

    assert.equal(slice.operation, baseManifest.operation, `stage ${stage.id}`);
    assert.equal(slice.kind, baseManifest.kind, `stage ${stage.id}`);
    assert.equal(slice.domain, baseManifest.domain, `stage ${stage.id}`);
    assert.equal(slice.stack, baseManifest.stack, `stage ${stage.id}`);
  }
});

test('files returns a list of path strings for every stage', () => {
  for (const stage of STAGES) {
    const files = stage.files(config, fullManifest);

    assert.ok(Array.isArray(files), `stage ${stage.id}`);
    assert.ok(files.length > 0, `stage ${stage.id}`);

    for (const file of files) {
      assert.equal(typeof file, 'string', `stage ${stage.id}`);
    }
  }
});
