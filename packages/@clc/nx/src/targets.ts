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

  for (let dep of target.dependsOn ?? []) {
    if (typeof dep === 'string') {
      if (dep.startsWith('^')) {
        dep = dep.slice(1);
      }
      assert(
        dep === fullTargetName || dep in targets,
        `dependency "${dep}" has not been defined`
      );
    }
  }

  const targetInputs = new Set(target.inputs ?? ['default']);
  targetInputs.add('sharedGlobals');
  target.inputs = Array.from(targetInputs);

  const targetDependsOn = new Set(target.dependsOn ?? []);
  // Everything should depend on codegen:deps so that when we make changes to
  // executors, they get their new dependencies before they try to execute.
  targetDependsOn.add('codegen:deps');
  target.dependsOn = Array.from(targetDependsOn);

  targets[fullTargetName] = target;

  const phaseDependsOn = targets[phase].dependsOn ?? [];
  phaseDependsOn.push(fullTargetName);
  targets[phase].dependsOn = phaseDependsOn;
}

export function addDependency(
  targets: Record<string, TargetConfiguration>,
  targetName: string,
  dependsOn: string
) {
  const target = targets[targetName];
  assert(target, `target "${targetName}" has not been defined`);
  assert(
    dependsOn in targets,
    `dependency "${dependsOn}" has not been defined`
  );
  const targetDependsOn = new Set(target.dependsOn ?? []);
  targetDependsOn.add(dependsOn);
  target.dependsOn = Array.from(targetDependsOn);
}
