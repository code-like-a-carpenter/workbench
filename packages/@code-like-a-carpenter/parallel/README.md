# @code-like-a-carpenter/parallel

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Helpers for running async tasks in parallel

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/parallel
```

## Usage

```ts
import {parallelMap} from '@code-like-a-carpenter/parallel';

const result = await parallelMap([1, 2, 3], async (value) => {
    return value * 2;
});
```

Note that exceptions are reported via `captureException` from
`@code-like-a-carpenter/telemetry`, but since `parallelMap` uses
`Promise.allSettled` under the hood, they'll never be thrown. If you need to
handle errors, you can either do so one at a time in you callback or you can
iterate through the result and check for failures.

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/tree/main/packages/@code-like-a-carpenter/parallel).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
