import path from 'node:path';

import type {CreateNodesFunction, TargetConfiguration} from '@nx/devkit';

export const createRootNodes: CreateNodesFunction = async (
  projectConfigurationFile
) => {
  const projectRoot = path.dirname(projectConfigurationFile);
  const targets: Record<string, TargetConfiguration> = {};

  return {
    projects: {
      [projectRoot]: {
        targets,
      },
    },
  };
};
