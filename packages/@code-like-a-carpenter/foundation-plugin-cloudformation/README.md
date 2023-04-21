# @code-like-a-carpenter/foundation-plugin-cloudformation

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> graphql-codegen plugin which generates CloudFormation template(s) using the
> Foundation parser

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
    -   [Template Transforms](#template-transforms)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/foundation-plugin-cloudformation
```

## Usage

### Template Transforms

Template transforms get applied after the templates are generated, but before
they are written to disk. They were originally added to address CloudFormation's
lack of support for passing maps to nested stacks (thus preventing nested stacks
from easily using things like `Globals` section of the parent stack or an
arbitrary set of environment variables that cannot be known in advance).

A transform function is a synchronous or asynchronous function that receives the
parent stack and all nested stacks and modifies them _in place_.

```ts
import {
    Config,
    ServerlessApplicationModel,
} from '@code-like-a-carpenter/foundation-cloudformation';
import type {IntermediateRepresentation} from '@code-like-a-carpenter/foundation-intermediate-representation';

type NestedStackTemplates = Model<string, ServerlessApplicationModel>;
type Transform = (
    config: Config,
    intermediateRepresentatin: IntermediateRepresentation,
    template: ServerlessApplicationModel,
    nestedTemplates: NestedStackTemplates
) => void | Promise<void>;
```

Transform packages must export a function named `transform` that agrees with the
`Transform` type above.

There two default transforms:

-   `@code-like-a-carpenter/foundation-table-names-transform` - passes all
    tables names to nested handler stacks
-   `@code-like-a-carpenter/foundation-environment-transform` - passed all
    environment variables defined on `Globals.Function.Environment.Variables`

Given the complexity of the Globals object, especially if it's reading Refs,
further transform of the Globals section should be handled by user-space code.

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
