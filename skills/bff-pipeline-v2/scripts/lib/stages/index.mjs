import { stage0Preflight } from './stage-0-preflight.mjs';
import { stage1Schema } from './stage-1-schema.mjs';
import { stage2Datasource } from './stage-2-datasource.mjs';
import { stage3Resolver } from './stage-3-resolver.mjs';
import { stage4E2e } from './stage-4-e2e.mjs';
import { stage5ClientCodegen } from './stage-5-client-codegen.mjs';
import { stage6Apollo } from './stage-6-apollo.mjs';

// Новый этап = новый файл-паспорт в этой папке + одна строка здесь.
export const STAGES = [
  stage0Preflight,
  stage1Schema,
  stage2Datasource,
  stage3Resolver,
  stage4E2e,
  stage5ClientCodegen,
  stage6Apollo,
];

export const STAGE_COUNT = STAGES.length;

export function getStage(id) {
  const stage = STAGES[id];

  if (!stage || stage.id !== id) {
    throw new Error(`unknown stage: ${id}`);
  }

  return stage;
}
