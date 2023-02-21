'use strict';

const assert = require('assert');
const path = require('path');

const {extractPersonInfo} = require('../lib/helpers');

const {getHeader, sectionHeader} = require('./helpers');

const headingsBeforeExtra = [
  'Table of Contents', // required
  'Security',
  'Background',
  'Install', // required
  'Usage', // required
];

const headingsAfterExtra = [
  'API',
  'Maintainer',
  'Thanks',
  'Contributing', // required
  'License', // required
];

const knownHeadings = new Set([...headingsBeforeExtra, ...headingsAfterExtra]);

/**
 * @typedef Options
 *   Configuration (required).
 * @property {import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles} pkg
 *   File extension to use (must start with `.`).
 */

/** @type {import("unified").Plugin<[Options]>} */
function ensureSections({pkg}) {
  return async (tree) => {
    /** @type {import('mdast').Root} */
    // @ts-expect-error - I'm not sure how to convince TS that tree is a Root
    const root = tree;
    const {extraSections, header, sections} = await parseSections(root);

    sections.set(
      'Install',
      await addInstall(
        sections.get('Install') ?? [await sectionHeader('Install')],
        pkg
      )
    );

    sections.set(
      'Usage',
      await addUsage(sections.get('Usage') ?? [await sectionHeader('Usage')])
    );

    sections.set(
      'Maintainer',
      await addMaintainer(
        sections.get('Maintainer') ?? [await sectionHeader('Maintainer')],
        pkg
      )
    );

    sections.set(
      'Contributing',
      await addContributing(
        sections.get('Contributing') ?? [await sectionHeader('Contributing')],
        pkg
      )
    );

    sections.set(
      'License',
      await addLicense(
        sections.get('License') ?? [await sectionHeader('License')],
        pkg
      )
    );

    await assembleSections(root, {extraSections, header, sections});
  };
}
exports.ensureSections = ensureSections;

/**
 * @typedef ParseSectionsResult
 * @property {import('mdast').Content[]} header
 * @property {import('mdast').Content[][]} extraSections
 * @property {Map<string, import('mdast').Content[]>} sections
 */

/**
 * @param {import("mdast").Root} tree
 * @param {ParseSectionsResult} parseSectionsResult
 */
async function assembleSections(tree, {extraSections, header, sections}) {
  tree.children = header;

  headingsBeforeExtra.forEach((headingName) => {
    const section = sections.get(headingName);
    if (section) {
      tree.children.push(...section);
    }
  });

  if (extraSections.length) {
    tree.children.push(...extraSections.flat());
  }

  headingsAfterExtra.forEach((headingName) => {
    const section = sections.get(headingName);
    if (section) {
      tree.children.push(...section);
    }
  });
}

/**
 * @param {import("mdast").Root} tree
 * @returns {Promise<ParseSectionsResult>}
 */
async function parseSections(tree) {
  /** @type {import('mdast').Content[][]} */
  const extraSections = [];

  const header = getHeader(tree);

  /** @type {import('mdast').Heading[]} */
  // @ts-expect-error - I'm not sure how to convince TS that every item is a
  // Heading instead of a Content
  const headings = tree.children.filter(
    (node) => node.type === 'heading' && node.depth === 2
  );

  /** @type {Map<string, import('mdast').Content[]>} */
  const sections = new Map();
  headings.forEach((heading, index, all) => {
    assert(heading.children.length > 0);
    assert(heading.children[0].type === 'text');
    const headingName = heading.children[0].value;

    const nextHeading = index < all.length ? all[index + 1] : undefined;
    const startIndex = tree.children.indexOf(heading);
    const endIndex = nextHeading
      ? tree.children.indexOf(nextHeading)
      : tree.children.length;

    const section = tree.children.slice(startIndex, endIndex);

    sections.set(headingName, section);

    if (!knownHeadings.has(headingName)) {
      extraSections.push(section);
    }
  });

  // Make sure we always have an empty TOC so that remark can generate it.
  sections.set('Table of Contents', [await sectionHeader('Table of Contents')]);

  return {
    extraSections,
    header,
    sections,
  };
}

/**
 * @param {import('mdast').Content[]} section
 * @param {import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles} pkg
 * @returns {Promise<import('mdast').Content[]>}
 */
async function addInstall(section, pkg) {
  const {u} = await import('unist-builder');

  section.splice(
    1,
    section.length - 1,
    u('code', {
      lang: 'bash',
      value: `npm i ${pkg.name}`,
    })
  );

  return section;
}

/**
 * @param {import('mdast').Content[]} section
 * @returns {Promise<import('mdast').Content[]>}
 */
async function addUsage(section) {
  if (section.length === 1) {
    console.warn('Usage section is empty. Please fill it in.');
  }

  return section;
}

/**
 * @param {import('mdast').Content[]} section
 * @param {import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles} pkg
 * @returns {Promise<import('mdast').Content[]>}
 */
async function addMaintainer(section, pkg) {
  const {u} = await import('unist-builder');

  assert(pkg.author, 'package.json must have an author');
  const {name, url} = extractPersonInfo(pkg.author);
  assert(name, 'package.json must have an author name');
  assert(url, 'package.json must have an author url');

  section.splice(
    1,
    section.length - 1,
    u('paragraph', [u('link', {url}, [u('text', {value: name})])])
  );
  return section;
}

/**
 * @param {import('mdast').Content[]} section
 * @param {import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles} pkg
 * @returns {Promise<import('mdast').Content[]>}
 */
async function addContributing(section, pkg) {
  const {u} = await import('unist-builder');

  assert(
    pkg.homepage,
    `${pkg.name} package.json should have a homepage by now.`
  );
  assert(
    typeof pkg.homepage === 'string',
    `${pkg.name} package.json homepage must be a string`
  );
  const url = new URL(pkg.homepage);
  url.pathname = path.join(url.pathname, '../../../../../');
  assert(url, 'package.json must have a homepage');

  section.splice(
    1,
    section.length - 1,
    u('paragraph', [
      u('text', {value: 'Please see contributing guidelines at the '}),
      u('link', {url: url.toString()}, [u('text', 'project homepage')]),
      u('text', {value: '.'}),
    ])
  );

  return section;
}

/**
 * @param {import('mdast').Content[]} section
 * @param {import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles} pkg
 * @returns {Promise<import('mdast').Content[]>}
 */
async function addLicense(section, pkg) {
  const {u} = await import('unist-builder');

  assert(pkg.author, 'package.json must have an author');
  const {name, url} = extractPersonInfo(pkg.author);

  section.splice(
    1,
    section.length - 1,
    u('paragraph', [
      u('text', `${pkg.license} © `),
      url ? u('link', {url}, [u('text', name)]) : u('text', name),
      u('text', ' 2023 until at least now'),
    ])
  );
  return section;
}
