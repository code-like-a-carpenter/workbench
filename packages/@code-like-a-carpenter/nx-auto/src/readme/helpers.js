'use strict';

/**
 * @param {import('mdast').Parent} tree
 * @returns {import('mdast').Content[]}
 */
function getHeader(tree) {
  return tree.children.slice(
    0,
    tree.children.findIndex(
      (node) => node.type === 'heading' && node.depth === 2
    )
  );
}
exports.getHeader = getHeader;

/**
 * @param {string} sectionName
 * @returns {Promise<import('mdast').Heading>}
 */
async function sectionHeader(sectionName) {
  const {u} = await import('unist-builder');
  /** @type {2} */
  const two = 2;
  return u('heading', {depth: two}, [u('text', {value: sectionName})]);
}
exports.sectionHeader = sectionHeader;
