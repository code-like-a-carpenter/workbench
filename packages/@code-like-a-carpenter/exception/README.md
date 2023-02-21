# @code-like-a-carpenter/exception

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Base exception class for other packages with built-in OpenTelemetry support.

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/exception
```

## Usage

This class doesn't do much on its own, but it starts as a common point for other
exceptions to extend from. Most usefully, however, `captureException` from
[`@code-like-a-carpenter/telemetry`](../telemetry) will look for the `telemetry`
field and attach any discovered properties as attributes to the span.

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/tree/main/packages/@code-like-a-carpenter/exception).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
