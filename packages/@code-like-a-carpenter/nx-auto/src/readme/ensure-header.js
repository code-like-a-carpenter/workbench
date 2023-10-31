'use strict';

const assert = require('assert');

const {getHeader} = require('./helpers');

const standardReadmeBadge = {
  alt: 'standard-readme compliant',
  href: 'https://github.com/RichardLitt/standard-readme',
  src: 'https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square',
};
/**
 * @typedef Options
 *   Configuration (required).
 * @property {import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles} pkg
 *   File extension to use (must start with `.`).
 */

/** @type {import("unified").Plugin<[Options]>} */
function ensureHeader({pkg}) {
  return async (tree) => {
    /** @type {import('mdast').Root} */
    // @ts-expect-error - I'm not sure how to convince TS that tree is a Root
    const root = tree;

    assert(pkg.name, 'Package name is required');

    const {u} = await import('unist-builder');

    const header = getHeader(root);
    const initialHeaderCount = header.length;

    const mainHeading = header.find(
      (node) => node.type === 'heading' && node.depth === 1
    );
    if (mainHeading) {
      assert(mainHeading.type === 'heading', 'Main heading must be a heading');
      mainHeading.children = [u('text', {value: pkg.name})];
    } else {
      assert(pkg.name, 'Package name is required');
      /** @type {1} */
      const one = 1;
      header.unshift(
        u('heading', {depth: one}, [u('text', {value: pkg.name})])
      );
    }

    const {badges, shortDescription} =
      await getBadgesAndShortDescription(header);

    assert(pkg.description, 'Package description is required');
    shortDescription.children = [
      u('paragraph', [u('text', {value: pkg.description})]),
    ];

    if (
      !badges.children.find(
        (node) =>
          node.type === 'link' &&
          node.url === standardReadmeBadge.href &&
          node.children[0].type === 'image' &&
          node.children[0].alt === standardReadmeBadge.alt &&
          node.children[0].url === standardReadmeBadge.src
      )
    ) {
      badges.children.unshift(
        u('link', {url: standardReadmeBadge.href}, [
          u('image', {
            alt: standardReadmeBadge.alt,
            url: standardReadmeBadge.src,
          }),
        ])
      );
    }

    root.children.splice(0, initialHeaderCount, ...header);
  };
}
exports.ensureHeader = ensureHeader;

/**
 *
 * @param {import("mdast").Content[]} header
 * @returns {Promise<{badges: import("mdast").Paragraph, shortDescription: import("mdast").Blockquote}>}
 */
async function getBadgesAndShortDescription(header) {
  const {u} = await import('unist-builder');

  if (header[1]?.type === 'paragraph' && header[2]?.type === 'blockquote') {
    return {badges: header[1], shortDescription: header[2]};
  }

  if (header[1]?.type === 'blockquote') {
    const [, shortDescription] = header;
    const badges = u('paragraph', []);

    header.splice(1, 0, badges);
    return {badges, shortDescription};
  }

  if (
    header[1]?.type === 'paragraph' &&
    header[1]?.children.length &&
    header[1]?.children[0]?.type === 'link'
  ) {
    const [, badges] = header;
    const shortDescription = u('blockquote', []);
    header.splice(2, 0, shortDescription);
    return {badges, shortDescription};
  }

  const badges = u('paragraph', []);

  const shortDescription = u('blockquote', []);

  header.splice(1, 0, badges, shortDescription);

  return {badges, shortDescription};
}
