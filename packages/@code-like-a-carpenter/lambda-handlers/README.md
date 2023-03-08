# @code-like-a-carpenter/lambda-handlers

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Wrappers to make writing lambda handlers easier

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
    -   [REST Apis (API Gateway v1](#rest-apis-api-gateway-v1)
-   [Maintainer](#maintainer)
-   [Contributing](#contributing)
-   [License](#license)

## Install

```bash
npm i @code-like-a-carpenter/lambda-handlers
```

## Usage

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

## Maintainer

[Ian Remmel](https://www.ianwremmel.com)

## Contributing

Please see contributing guidelines at the
[project homepage](https://www.github.com/code-like-a-carpenter/workbench/).

## License

MIT © [Ian Remmel](https://www.ianwremmel.com) 2023 until at least now
