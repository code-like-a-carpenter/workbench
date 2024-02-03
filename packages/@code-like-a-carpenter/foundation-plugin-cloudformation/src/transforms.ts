import type {IntermediateRepresentation} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import type {ServerlessApplicationModel} from './types';

export type NestedStackTemplates = Map<string, ServerlessApplicationModel>;
export type Transform = (
  ir: IntermediateRepresentation,
  template: ServerlessApplicationModel,
  nestedTemplates: NestedStackTemplates
) => void | Promise<void>;

export async function applyTransforms(
  config: Config,
  ir: IntermediateRepresentation,
  template: ServerlessApplicationModel,
  nestedTemplates: NestedStackTemplates
): Promise<void> {
  for (const transformModule of config.cloudformationTransforms) {
    const transform = await loadTransform(transformModule);
    await transform(ir, template, nestedTemplates);
  }
}

/**
 * Deals with the possibility that this code may run in commonjs or esm mode.
 */
async function loadTransform(transformModule: string): Promise<Transform> {
  const mod = await import(transformModule);
  if (mod.default) {
    return mod.default.transform;
  }

  return mod.transform;
}
