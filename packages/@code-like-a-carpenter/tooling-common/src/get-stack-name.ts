import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';

import {env} from '@code-like-a-carpenter/env';

export function getStackName(projectName: string): string {
  const stackName = upperFirst(camelCase(projectName));
  let suffix = '';
  if (env('GITHUB_SHA', '') !== '') {
    suffix = `${env('GITHUB_SHA', '').slice(0, 7)}`;
  }

  if (env('GITHUB_HEAD_REF', '') !== '') {
    suffix = `${suffix}-${env('GITHUB_HEAD_REF')
      .replace(/[/_]/g, '-')
      .substring(0, 20)}`;
  } else if (env('GITHUB_REF', '') !== '') {
    const branchName = env('GITHUB_REF', '')
      .split('/')
      .slice(2)
      .join('/')
      .replace(/[/_]/g, '-')
      .substring(0, 20);
    suffix = `${suffix}-${branchName}`;
  }

  return suffix ? `${stackName}-${suffix}` : stackName;
}
