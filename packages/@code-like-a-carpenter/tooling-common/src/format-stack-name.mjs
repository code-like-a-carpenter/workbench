import camelCase from 'lodash.camelcase';
import upperFirst from 'lodash.upperfirst';

/**
 * @typedef {Object} FormatStackNameOptions
 * @property {boolean} ci
 * @property {string} [fullRef]
 * @property {string} projectName
 * @property {string} [sha]
 * @property {string} [ref]
 */

/**
 * @param {FormatStackNameOptions} options
 * @returns {string}
 */
export function formatStackName({
  ci,
  fullRef = '',
  projectName,
  sha = '',
  ref = '',
}) {
  const stackName = upperFirst(camelCase(projectName));
  let suffix = '';

  if (!ci) {
    return stackName;
  }

  if (sha !== '') {
    suffix = sha.slice(0, 7);
  }

  let branch = '';
  if (fullRef !== '') {
    branch = fullRef;
  } else if (ref) {
    branch = ref.split('/').slice(2).join('/');
  }

  if (branch) {
    if (branch.startsWith('dependabot')) {
      branch = branch.split('/').slice(2).join('/');
    }

    suffix = `${camelCase(branch.replace(/[/_]/g, '-').substring(0, 20))}-${suffix}`;
  }

  return `ci--${suffix ? `${stackName}-${suffix}` : stackName}`;
}
