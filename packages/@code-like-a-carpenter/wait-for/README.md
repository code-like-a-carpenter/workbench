# @code-like-a-carpenter/wait-for

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Waits for a function to successfully resolve, within a given timeout.

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/wait-for
```

## Usage

```ts
import {waitFor} from '@code-like-a-carpenter/wait-for';

const result = await waitFor(async () => {
    return await loadSlowThingFromTheDatabase();
}, 20000);

const validatedResult = await waitFor(async () => {
    const item = await loadSlowThingFromTheDatabase();
    expect(item).toBeDefined();
    expect(item.id).toBe(1);
    return item;
}, 20000);
```

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
