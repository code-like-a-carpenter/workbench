# @code-like-a-carpenter/errors

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Common errors usable across projects

At present, this package contains the http errors based
[MDN's list of HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status).

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/errors
```

## Usage

```ts
import {NotFound} from '@code-like-a-carpenter/errors';

try {
    const result = loadFromDatabase();
} catch (err) {
    if (err.message === 'NoSuchRecord') {
        throw new NotFound('Could not find resource', {cause: err});
    }
    throw err;
}
```

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
