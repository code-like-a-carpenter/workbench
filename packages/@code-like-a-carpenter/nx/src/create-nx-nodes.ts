import path from 'node:path';

import type {CreateNodesFunction, TargetConfiguration} from '@nx/devkit';

export const createNxNodes: CreateNodesFunction = async (
  projectConfigurationFile
) => {
  const projectRoot = path.dirname(projectConfigurationFile);
  const targets: Record<string, TargetConfiguration> = {
    build: {
      cache: true,
      executor: '@code-like-a-carpenter/nx:json-schema',
      inputs: ['{projectRoot}/executors/*/schema.json'],
      options: {
        schemas: ['{projectRoot}/executors/*/schema.json'],
      },
      outputs: ['{projectRoot}/executors/*/schema.d.ts'],
    },
  };

  return {
    projects: {
      [projectRoot]: {
        targets,
      },
    },
  };
};
