import type {ServiceException} from '@smithy/smithy-client';

import {BaseDataLibraryError} from './base-error.ts';

/**
 * Thrown when an error is caught from the AWS SDK that we didn't expect to have
 * to handle.
 */
export class UnexpectedAwsError extends BaseDataLibraryError<object> {
  /** constructor */
  constructor(cause: ServiceException) {
    super('The AWS SDK threw an unexpected error', {cause, telemetry: {}});
  }
}
