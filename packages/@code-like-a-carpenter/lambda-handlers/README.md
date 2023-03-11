# @code-like-a-carpenter/lambda-handlers

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Wrappers to make writing lambda handlers easier

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
    -   [REST Apis (API Gateway v1](#rest-apis-api-gateway-v1)
    -   [SQS Events](#sqs-events)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/lambda-handlers
```

## Usage

This package provides various factories for Lambda events. Each factory, at a
minimum, adds telemetry to your handler, but also simplifies the interface. For
example, the REST handler takes care of JSON serialization and deserialization
while the SQS handler lets you think about individual messages rather than the
entire event.

All factories force you to prove `async` callbacks rather than nodebacks.

### REST Apis (API Gateway v1

First, use `openapi-typescript` to generate typescript types from the api.yml
that you're passing to CloudFormation.

```bash
npx openapi-typescript api.yml --output __generated__/api.ts
```

Then, use `handleRestEvent` to define your lambda handler.

```ts
import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';
import {operations} from './__generated__/api';

export const handler = handleRestEvent<operations['myOperation']>(
    async (event, {context, logger}) => ({
        statusCode: 204,
    })
);
```

`event` is a transformed version of the raw Lambda event. The query string and
header objects have been replaced with `URLSearchParams` and `Headers`,
respectively. For `content-type: application/json`, the body has been parsed
into a type-safe object.

`context` is the Lambda context object.

`logger` is a `Logger` from `@code-like-a-carpenter/logger` scoped to this
request.

### SQS Events

When you configure your CloudFormation stack, make sure your SQS handler
includes

```yml
FunctionResponseTypes:
    - BatchRequestFailures
```

`handleSqsEvent` will take care of return the correct payload if any message
cannot be processed, but it can only do so if the resource has been configured
to expect such a response.

```ts
import {handleSqsEvent} from '@code-like-a-carpenter/lambda-handlers';

export const handler = handleSqsEvent(async (message, {context, logger}) => {
    logger.info('Received message', {message});
});
```

`message` is a single record from the original SQS event.

`context` is the Lambda context object.

`logger` is a `Logger` from `@code-like-a-carpenter/logger` scoped to this
message.

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
