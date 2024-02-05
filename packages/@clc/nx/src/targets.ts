import assert from 'node:assert';

import type {TargetConfiguration} from '@nx/devkit';

export function addPhase(
  targets: Record<string, TargetConfiguration>,
  phase: string,
  deps: readonly string[] = []
) {
  assert(!(phase in targets), `phase "${phase}" has already been defined`);
  targets[phase] = {
    cache: true,
    dependsOn: [...deps],
    executor: 'nx:noop',
  };
}

export function addTarget(
  targets: Record<string, TargetConfiguration>,
  phase: string,
  targetName: string,
  target: TargetConfiguration
) {
  assert(
    phase in targets,
    `phase "${phase} has not been defined. Please do so before trying to register a target in this phase`
  );
  assert(
    !targetName.startsWith(`${phase}:`),
    `targetName "${targetName}" should not start with phase "${phase}"`
  );

  const fullTargetName = `${phase}:${targetName}`;
  assert(
    !(fullTargetName in targets),
    `target "${targetName}" has already been defined in phase "${phase}"`
  );

  targets[fullTargetName] = target;

  const dependsOn = targets[phase].dependsOn ?? [];
  dependsOn.push(fullTargetName);
  targets[phase].dependsOn = dependsOn;
}
