#!/usr/bin/env node

'use strict';

const {execSync} = require('child_process');
const querystring = require('querystring');

const {debug, format: f} = require('@ianwremmel/debug');

const d = debug(__filename);

/**
 * @typedef {Object} ClientOptions
 * @property {string} projectId
 * @property {string} token
 */

/**
 * @typedef {Object} Story
 * @property {'story'} kind
 * @property {number} id
 * @property {string} created_at
 * @property {string} updated_at
 * @property {number} estimate
 * @property {'feature'|'bug'|'release'|'chore'} story_type
 * @property {string} name
 * @property {'accepted'|'delivered'|'finished'|'started'|'rejected'|'planned'|'unstarted'|'unscheduled'} current_state
 * @property {number} requested_by_id
 * @property {string} url
 * @property {number} project_id
 * @property {number[]} owner_ids
 * @property {any[]} labels
 */

/**
 *
 * @param {ClientOptions} options
 */
async function deliverStories(options) {
  const bugs = await listStories(options, 'bug');
  const features = await listStories(options, 'feature');
  const stories = [...bugs, ...features];
  const filteredStories = filterStories(stories);

  let errors = false;
  for (const story of filteredStories) {
    try {
      await deliverStory(options, story);
    } catch (err) {
      errors = true;
      console.warn(`Failed to deliver ${story.id}: ${err.message}`);
    }
  }

  if (errors) {
    throw new Error('Errors occurred during delivery. See the log for details');
  }
}

/**
 *
 * @param {ClientOptions} options
 * @param {Object} story
 */
async function deliverStory({projectId, token}, {id, name}) {
  d(f`Delivering ${id} (${name})`);
  const body = {
    current_state: 'delivered',
    id,
  };
  const url = `https://www.pivotaltracker.com/services/v5/projects/${projectId}/stories/${id}`;
  const req = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'x-trackertoken': token,
    },
    method: 'PUT',
  });

  if (!req.ok) {
    d(f`Failed to deliver ${id} (${name})`);
    throw new Error(await req.text());
  }

  d(f`Delivered ${id} (${name})`);
}

/**
 *
 * @param {Story[]} stories
 * @returns {Story[]}
 */
function filterStories(stories) {
  return stories.filter((story) => {
    const commits = execSync(`git log HEAD --grep ${story.id}`).toString();

    if (commits.length === 0) {
      return false;
    }

    if (commits.includes(`[fixes #${story.id}]`)) {
      throw new Error('Pivotal commit message used lowercase form of Fixed');
    }
    if (commits.includes(`[finishes #${story.id}]`)) {
      throw new Error('Pivotal commit message used lowercase form of Finishes');
    }

    return (
      commits.includes(`[Fixes #${story.id}]`) ||
      commits.includes(`[Finishes #${story.id}]`)
    );
  });
}

/**
 * @param {ClientOptions} options
 * @param {string} type
 * @returns {Promise<Story[]>}
 */
async function listStories({projectId, token}, type) {
  d(f`Listing finished ${type} stories for ${projectId}`);
  const req = await fetch(
    `https://www.pivotaltracker.com/services/v5/projects/${projectId}/stories?${querystring.stringify(
      {
        with_state: 'finished',
        with_story_type: type,
      }
    )}`,
    {
      headers: {
        'x-trackertoken': token,
      },
    }
  );

  if (req.ok) {
    d(f`Listed finished ${type} stories for ${projectId}`);
    return await req.json();
  }

  throw await new Error(await req.text());
}

(async function run() {
  try {
    if (!process.env.PIVOTAL_TRACKER_TOKEN) {
      throw new TypeError('process.env.PIVOTAL_TRACKER_TOKEN must be defined');
    }

    if (!process.env.PIVOTAL_TRACKER_PROJECT_ID) {
      throw new TypeError(
        'process.env.PIVOTAL_TRACKER_PROJECT_ID must be defined'
      );
    }

    await deliverStories({
      projectId: process.env.PIVOTAL_TRACKER_PROJECT_ID,
      token: process.env.PIVOTAL_TRACKER_TOKEN,
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
