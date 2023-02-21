# @code-like-a-carpenter/logger

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Light-weight, bunyan-inspired JavaScript logger

This is yet another logger. It takes inspiration from
[bunyan](https://github.com/trentm/node-bunyan) and
[lambda-log](https://github.com/KyleRoss/node-lambda-log), but it's _much_
simpler. Where those libraries are designed to be used in a few different
scenarios with pluggable, configurable behaviors, this is mostly just a wrapper
around `Console` that

1.  always writes JSON
2.  has a child\` method inspired by bunyan to create sub-loggers.

To be clear, bunyan is an excellent library, but a significant portion of its
code is dedicated to writing log output somewhere other than STDOUT, which is
all we really care about in most cases and especially in Lambda deployments.

LambdaLog has some nice ideas about targeting just Lambda, but it's got an awful
lot of complex customization options and its leveled log methods don't appear to
be discoverable by TypeScript.

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
    -   [Get the default logger](#get-the-default-logger)
    -   [Log a message](#log-a-message)
    -   [Log a message with additional info](#log-a-message-with-additional-info)
    -   [Create a new logger instance](#create-a-new-logger-instance)
    -   [Create a new logger instance in dev mode](#create-a-new-logger-instance-in-dev-mode)
    -   [Create a new logger instance in prod mode](#create-a-new-logger-instance-in-prod-mode)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/logger
```

## Usage

### Get the default logger

```ts
import {logger} from '@code-like-a-carpenter/logger';
```

### Log a message

```ts
import {logger} from '@code-like-a-carpenter/logger';

logger.info('hello world');
```

### Log a message with additional info

```ts
import {logger} from '@code-like-a-carpenter/logger';

logger.info('hello world', {foo: 'bar'});
```

### Create a new logger instance

```ts
import {ConsoleLogger} from '@code-like-a-carpenter/logger';

const logger = new ConsoleLogger();
```

### Create a new logger instance in dev mode

dev mode implies pretty-printed JSON.

```ts
import {ConsoleLogger} from '@code-like-a-carpenter/logger';

const logger = new ConsoleLogger({dev: true});
```

### Create a new logger instance in prod mode

prod mode implies single-line JSON.

```ts
import {ConsoleLogger} from '@code-like-a-carpenter/logger';

const logger = new ConsoleLogger({dev: false});
```

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
