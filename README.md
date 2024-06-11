# Workbench

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/)

> Monorepo of common libraries, CLIs, and codegen tools

## Table of Contents

<!-- toc -->

-   [Install](#install)
-   [Usage](#usage)
-   [Examples](#examples)
-   [On Breaking Changes](#on-breaking-changes)
-   [Maintainer](#maintainer)
-   [Contribute](#contribute)
    -   [nx](#nx)
    -   [`@clc` vs `@code-like-a-carpenter`](#clc-vs-code-like-a-carpenter)
-   [License](#license)

<!-- tocstop -->

## Install

This is a monorepo and cannot be installed in the traditional sense. Instead,
each package is published to npm and can be installed individually. For example,
to install
[`@code-like-a-carpenter/env`](./packages/@code-like-a-carpenter/env), use the
following:

```sh
npm install @code-like-a-carpenter/env
```

## Usage

Please see each package's README for specific usage instructions.

## Examples

Examples can be found in the [`examples`](./examples) directory. Due to
limitations in the free version of [localstack](https://localstack.cloud/),
these examples do several things that aren't necessarily recommended in a normal
deployment:

-   They do not include the
    [ADOT Open Telemetry layer](https://aws-otel.github.io/docs/getting-started/lambda).
-   There are no contract tests for API Gateway request validations.

## On Breaking Changes

All packages in this repository follow
[semantic versioning](https://semver.org/), however, changes that require
rerunning codegen are not considered breaking if they require no other
interventions.

## Maintainer

[Ian Remmel](https://github.com/ianwremmel)

## Contribute

PRs welcome, but for anything beyond the most trivial of changes, please open a
GitHub issue before doing a whole bunch of work. I'm happy to discuss the
additions, but this is a personal project and I don't want you wasting your time
if what you're proposing isn't a good fit.

### nx

This repo uses [nx](https://nx.dev/) to manage the monorepo.

#### .nx-cache-buster

It's sometimes possible to get into a state where the nx cloud cache has cached
bad output and it's not clear what inputs are missing from the dependency graph.
To fix this, run the following command before using `nx`:

```sh
date --iso-8601=seconds> .nx-cache-buster
```

Of course, remember to commit the updated file.

### `@clc` vs `@code-like-a-carpenter`

`@clc` packages are internal-only. They won't be published but need to be
packages for other tooling to work. For example, there's an internal-only `nx`
plugin which is where most of the repo's build configuration comes from. Not
only does this plugin need to a different package.json layout (it's `main` entry
needs to point to a typescript file, not a built file), it just wouldn't make
sense outside the context of this particular repository.

## License

MIT &copy; [Ian Remmel](https://github.com/ianwremmel) 2019 until at least now
