import assert from 'node:assert';
import path from 'node:path';

import type {CreateNodes} from '@nx/devkit';

import {createCliNodes} from './create-cli-nodes';
import {createExampleNodes} from './create-example-nodes';
import {createNxNodes} from './create-nx-nodes';
import {createPackageNodes} from './create-package-nodes';
import {createRootNodes} from './create-root-nodes';

export const createNodes: CreateNodes = [
  '**/package.json',
  async (projectConfigurationFile, options, context) => {
    const root = path.dirname(projectConfigurationFile);
    const projectName = root.includes('@')
      ? root.split('/').slice(-2).join('/')
      : path.basename(root);

    const projectBaseName = path.basename(root);

    if (root === '.') {
      return {};
    }

    if (projectName.includes('nx')) {
      return createNxNodes(projectConfigurationFile, options, context);
    }

    if (
      projectBaseName.startsWith('cli-') ||
      projectBaseName.endsWith('-cli') ||
      projectBaseName === 'cli'
    ) {
      return createCliNodes(projectConfigurationFile, options, context);
    }

    if (projectConfigurationFile.startsWith('examples')) {
      return createExampleNodes(projectConfigurationFile, options, context);
    }

    if (projectConfigurationFile.startsWith('packages')) {
      return createPackageNodes(projectConfigurationFile, options, context);
    }

    if (projectConfigurationFile === 'package.json') {
      return createRootNodes(projectConfigurationFile, options, context);
    }

    assert.fail(`Unknown projectConfigurationFile ${projectConfigurationFile}`);
  },
];
