# @code-like-a-carpenter/telemetry

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> OpenTelemetry wrappers that make it easier to do basic things

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
    -   [runWith\*](#runwith)
    -   [withTelemetry](#withtelemetry)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/telemetry
```

## Usage

### runWith\*

This packages contains several functions run a function inside a new
OpenTelemetry span. In most cases, you'll want `runWithNewSpan` and in some
cases, you'll want `runWithNewSpanFromContext` (see its in-line docs for
specifics). `runWithSpan` is a lower-level function that is used by the other
two and probably won't be used directly by consumers, but is exported for
completeness.

```ts
import {runWithNewSpan} from '@code-like-a-carpenter/telemetry';

export async function handler(...args) {
    const result = await runWithNewSpan(
        'handler',
        {attrs: {'com.example.foo': 'bar'}},
        async () => {
            return await doSomething(...args);
        }
    );
    return result;
}
```

### withTelemetry

`withTelemetry` is an all-purpose wrapper around a standard Lambda handler which
adds the appropriate OTel attributes based on the type of event being handled.

> `withTelemetry` specifically knows how to handle API Gateway events, SQS
> events, API Gateway Token Authorizer events, and DynamoDB Stream events. If
> you need other event types, please open an issue. If you're using it with a
> DynamoDB Stream, make sure you've set
> `FunctionResponseTypes: ['ReportBatchItemFailures']` in your CloudFormation
> template.

```ts
import {withTelemetry} from '@code-like-a-carpenter/telemetry';

export function handler(event, context) {
    return withTelemetry(
        'handler',
        {attrs: {'com.example.foo': 'bar'}},
        async () => await doSomething(...args)
    );
}
```

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/tree/main/packages/@code-like-a-carpenter/telemetry).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
