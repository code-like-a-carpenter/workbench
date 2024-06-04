import {
  BadRequest,
  Forbidden,
  NotFound,
  PaymentRequired,
  Unauthorized,
  NotAcceptable,
  ProxyAuthenticationRequired,
  RequestTimeout,
  Conflict,
  Gone,
  LengthRequired,
  PreconditionFailed,
  PayloadTooLarge,
  URITooLong,
  UnsupportedMediaType,
  RangeNotSatisfiable,
  ExpectationFailed,
  ImATeapot,
  MisdirectedRequest,
  UnprocessableEntity,
  Locked,
  FailedDependency,
  TooEarly,
  UpgradeRequired,
  PreconditionRequired,
  TooManyRequests,
  RequestHeaderFieldsTooLarge,
  UnavailableForLegalReasons,
  ServerError,
  NotImplemented,
  BadGateway,
  ServiceUnavailable,
  GatewayTimeout,
  HTTPVersionNotSupported,
  VariantAlsoNegotiates,
  InsufficientStorage,
  LoopDetected,
  NotExtended,
  NetworkAuthenticationRequired,
  MethodNotAllowed,
} from '@code-like-a-carpenter/errors';
import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';

import {exceptionTracingService} from '../../dependencies.ts';

import type {operations} from './__generated__/api.ts';

export const errors = handleRestEvent<operations['errors']>(
  // eslint-disable-next-line complexity
  async (event, context) => {
    switch (event.pathParameters.statusCode) {
      case '400':
        throw new BadRequest();
      case '401':
        throw new Unauthorized();
      case '402':
        throw new PaymentRequired();
      case '403':
        throw new Forbidden();
      case '404':
        throw new NotFound();
      case '405':
        throw new MethodNotAllowed();
      case '406':
        throw new NotAcceptable();
      case '407':
        throw new ProxyAuthenticationRequired();
      case '408':
        throw new RequestTimeout();
      case '409':
        throw new Conflict();
      case '410':
        throw new Gone();
      case '411':
        throw new LengthRequired();
      case '412':
        throw new PreconditionFailed();
      case '413':
        throw new PayloadTooLarge();
      case '414':
        throw new URITooLong();
      case '415':
        throw new UnsupportedMediaType();
      case '416':
        throw new RangeNotSatisfiable();
      case '417':
        throw new ExpectationFailed();
      case '418':
        throw new ImATeapot();
      case '421':
        throw new MisdirectedRequest();
      case '422':
        throw new UnprocessableEntity();
      case '423':
        throw new Locked();
      case '424':
        throw new FailedDependency();
      case '425':
        throw new TooEarly();
      case '426':
        throw new UpgradeRequired();
      case '428':
        throw new PreconditionRequired();
      case '429':
        throw new TooManyRequests();
      case '431':
        throw new RequestHeaderFieldsTooLarge();
      case '451':
        throw new UnavailableForLegalReasons();
      case '500':
        throw new ServerError();
      case '501':
        throw new NotImplemented();
      case '502':
        throw new BadGateway();
      case '503':
        throw new ServiceUnavailable();
      case '504':
        throw new GatewayTimeout();
      case '505':
        throw new HTTPVersionNotSupported();
      case '506':
        throw new VariantAlsoNegotiates();
      case '507':
        throw new InsufficientStorage();
      case '508':
        throw new LoopDetected();
      case '510':
        throw new NotExtended();
      case '511':
        throw new NetworkAuthenticationRequired();
    }

    return {
      body: {
        context,
        event,
      },
      statusCode: 200,
    };
  },
  exceptionTracingService
);
