# @code-like-a-carpenter/interact

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Lightweight Interactor library for controlling business logic

This version of `interact` has evolved over a bunch of trial and error.
Originally inspired by the
[Interactor](https://github.com/collectiveidea/interactor) gem, `interact` is a
deceptively simple choke point for your business logic.

-   By accepting a context object, it provides a built-in (super lightweight)
    dependency injection opportunity.
-   By accepting a args as a single value (scalar or object), it forces you to
    name all your arguments instead of just using positionals.
-   By simply existing, it nests OpenTelemetry spans at useful levels of
    granularity.
-   By being a bare function, it's pretty easy to mock relevant dependencies in
    tests.
-   By only accepting async functions, it'll prevent you from thinking you can
    get away with sync functions, only to discover after two weeks of frantic
    code that the one library you desperately need to add is async-only.

If you choose to use [@code-like-a-carpenter/logger](../logger) (or any logger
that has a `child` function), it'll automatically create child loggers for you.

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
    -   [Single value input as a scalar](#single-value-input-as-a-scalar)
    -   [Multiple value input as an object](#multiple-value-input-as-an-object)
    -   [Automatic child logger](#automatic-child-logger)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/interact
```

## Usage

### Single value input as a scalar

```ts
import {interact} from '@code-like-a-carpenter/interact';

async function double(x: number): Promise<number> {
    return x * 2;
}

const result = await interact(double, 2, {});
expect(result).toEqual(4);
```

### Multiple value input as an object

```ts
import {interact} from '@code-like-a-carpenter/interact';

interface AddInput {
    a: number;
    b: number;
}

async function add({a, b}: AddinInput): Promise<number> {
    return a + b;
}

const result = await interact(add, {a: 1, b: 2}, {});
expect(result).toEqual(3);
```

### Automatic child logger

```ts
import {interact} from '@code-like-a-carpenter/interact';
import {logger} from '@code-like-a-carpenter/logger';

async function log(message: string): Promise<void> {
    logger.info(message);
}

log('hello world');
//{"level": "info", "message": "hello world"}

await interact(log, 'hello world', {});
//{"interactor": "log", "level": "info", "message": "hello world"}
```

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
