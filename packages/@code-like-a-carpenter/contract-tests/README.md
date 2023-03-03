# @code-like-a-carpenter/contract-tests

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Jest-compatible alternative to Dredd.

API Blueprint is (usually) easier to write than OpenAPI and there's already
tooling out there to turn it into tests. Unfortunately, it's difficult to debug
when something fails (especially in a before hook), doesn't make it easy to run
a specific test, and is just generally frustrating.

Its parser and compiler, however, are separate from its CLI, so this package use
them to generate Jest tests from your API Blueprint.

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/contract-tests
```

## Usage

Create your jest test file, but instead of writing explicit tests, import
`buildContractTests` and pass it your API Blueprint and your API base url.

> Make sure to pass the full path to your API Blueprint file, not a relative
> path.

```ts
import path from 'node:path';

import {buildContractTests} from '@code-like-a-carpenter/contract-tests';

describe('contract tests', () => {
    buildContractTests({
        baseUrl: process.env.API_URL,
        blueprint: path.join(__dirname, 'api.apib'),
    });
});
```

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
