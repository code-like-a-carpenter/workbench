# @code-like-a-carpenter/dotenv

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Wrapper around dotenv the loads the right .env file(s) based on the NODE_ENV

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/dotenv
```

## Usage

This package uses the [dotenv](https://www.npmjs.com/package/dotenv) package
under the hood, but, depending on `NODE_ENV`, will load more files than just the
default `.env`.

Each of the following files will be loaded if they exist, in the following
order. Files loaded _earlier_ take precedence.

-   `.env.<env>.local`
-   `.env.local`
-   `.env.<env>`
-   `.env`

There are only three valid values for `<env>`, based on the value of `NODE_ENV`:

| `NODE_ENV`    | `<env>`       |
| ------------- | ------------- |
| `production`  | `production`  |
| `test`        | `test`        |
| anything else | `development` |

Please add the following to your gitignore. `local` env files are intended for
customizing the environment on your local machine and _should not_ be checked
into git.

```gitignore
.env.local
.env.*.local
.env.production
```

**Even though you may check env files into git, you still shouldn't check in
secrets.**

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/tree/main/packages/@code-like-a-carpenter/dotenv).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
