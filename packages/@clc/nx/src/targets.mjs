import assert from 'node:assert';

/** @typedef {import('@nx/devkit').TargetConfiguration} TargetConfiguration */

/**
 * @param {Record<string, TargetConfiguration>} targets
 * @param {string} phase
 * @param {string[]} [deps]
 */
export function addPhase(targets, phase, deps = []) {
  assert(!(phase in targets), `phase "${phase}" has already been defined`);
  targets[phase] = {
    cache: true,
    dependsOn: [...deps],
    executor: 'nx:noop',
  };
}

/**
 * @param {Record<string, TargetConfiguration>} targets
 * @param {string} phase
 * @param {string} targetName
 * @param {TargetConfiguration} target
 */
export function addTarget(targets, phase, targetName, target) {
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

/**
 * @param {Record<string, TargetConfiguration>} targets
 * @param {string} targetName
 * @param {string} dependsOn
 */
export function addDependency(targets, targetName, dependsOn) {
  const depForValidation = dependsOn.startsWith('^')
    ? dependsOn.slice(1)
    : dependsOn;

  const target = targets[targetName];
  assert(target, `target "${targetName}" has not been defined`);
  assert(
    depForValidation in targets,
    `dependency "${depForValidation}" has not been defined`
  );
  const targetDependsOn = new Set(target.dependsOn ?? []);
  targetDependsOn.add(dependsOn);
  target.dependsOn = Array.from(targetDependsOn);
}
