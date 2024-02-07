// This file needs to be javascript because the nx autocompiler incorrectly
// turns `await import` into require, thus breaking dynamic import of ESM-only
// packages. By using javascript, we forego all autocompiler transformations, so
// all is easier to deal with if it all lives in this file.
//
// I think this can be fixed by moving the repo to module:Node16, but I can't do
// that until I deal with other nx stuff, of which making this file javascript
// is a precursor.

'use strict';

const assert = require('node:assert');
const {readFile, writeFile} = require('node:fs/promises');
const path = require('path');

const prettier = require('prettier');
const runExecutor = async (options, context) => {
  // the nx autocompiler currently turns this file int CJS, so remark still
  // needs to be imported dynamically
  const {remark} = await import('remark');
  const remarkStringify = (await import('remark-stringify')).default;
  const remarkToc = (await import('remark-toc')).default;
  const root = extractProjectRoot(context);
  const readmePath = path.join(root, 'README.md');
  const readme = await safeReadFile(readmePath);
  const pkg = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf-8')
  );
  const result = await remark()
    .use(ensureHeader, {pkg})
    .use(ensureSections, {pkg})
    .use(remarkToc, {
      heading: 'Table of Contents',
      tight: true,
    })
    .use(remarkStringify)
    .process(readme);
  if (result.messages.length) {
    for (const message of result.messages) {
      console.error(message);
    }
    throw new Error('Encountered errors while transforming README.md');
  }
  await writePrettierFile(readmePath, result.toString());
  return {
    success: true,
  };
};
module.exports = runExecutor;

function extractProjectName(context) {
  const {projectName} = context;
  assert(projectName, 'Expected a projectName to be set in the context');
  return projectName;
}
function extractProjectRoot(context) {
  const projectName = extractProjectName(context);
  const project = context.projectsConfigurations?.projects[projectName];
  assert(project, `Expected a project configuration for ${projectName}`);
  const {root} = project;
  return root;
}
async function safeReadFile(filename) {
  try {
    return await readFile(filename, 'utf-8');
  } catch {
    return '';
  }
}
async function writePrettierFile(filename, content) {
  const config = await prettier.resolveConfig(filename);
  const formatted = await prettier.format(content, {
    ...config,
    filepath: filename,
  });
  await writeFile(filename, formatted);
}
const standardReadmeBadge = {
  alt: 'standard-readme compliant',
  href: 'https://github.com/RichardLitt/standard-readme',
  src: 'https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square',
};

function ensureHeader({pkg}) {
  return async (root) => {
    const {u} = await import('unist-builder');
    assert(pkg.name, 'Package name is required');
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
function getHeader(tree) {
  return tree.children.slice(
    0,
    tree.children.findIndex(
      (node) => node.type === 'heading' && node.depth === 2
    )
  );
}
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

function ensureSections({pkg}) {
  return async (root) => {
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
async function parseSections(tree) {
  const extraSections = [];
  const header = getHeader(tree);
  const headings = tree.children.filter(
    (node) => node.type === 'heading' && node.depth === 2
  );
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
async function addUsage(section) {
  if (section.length === 1) {
    console.warn('Usage section is empty. Please fill it in.');
  }
  return section;
}
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
async function sectionHeader(sectionName) {
  const {u} = await import('unist-builder');
  const two = 2;
  return u('heading', {depth: two}, [u('text', {value: sectionName})]);
}
function extractPersonInfo(person) {
  if (typeof person === 'string') {
    const result = person.match(/^(.+?)(?: <(.+)>)?(?: \((.+)\))?$/);
    assert(result, `Unable to parse person string: ${person}`);
    const [, name, email, url] = result;
    return {email, name, url};
  }
  assert(person.name, 'Person must have a name');
  return {
    email: person.email ?? null,
    name: person.name,
    url: person.url ?? null,
  };
}
