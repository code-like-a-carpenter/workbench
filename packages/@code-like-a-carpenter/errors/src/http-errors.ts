import type {ExceptionOptions} from '@code-like-a-carpenter/exception';
import {Exception} from '@code-like-a-carpenter/exception';

/** Base class for all HTTP errors */
export abstract class HttpException<T extends object> extends Exception<T> {
  public abstract readonly code: number;

  constructor();
  constructor(message: string);
  constructor(options: ExceptionOptions<T>);
  constructor(
    message?: string | ExceptionOptions<T>,
    options?: ExceptionOptions<T>
  ) {
    if (typeof message === 'object') {
      options = message;
      message = undefined;
    }

    super(message ?? '', options ?? {});
  }
}

/** Client Error */
export class ClientError<T extends object> extends HttpException<T> {
  code = 400;
}

/** Bad Request */
export class BadRequest<T extends object> extends ClientError<T> {
  code = 400;
}

/**
 * Unauthorized. This is also exported as NotAuthenticated; the standard uses
 * "Unauthorized", but "Unauthenticated" is the intent.
 */
export class Unauthorized<T extends object> extends ClientError<T> {
  code = 401;
}

export {Unauthorized as NotAuthenticated};
export {Unauthorized as Unauthenticated};

/** Payment Required */
export class PaymentRequired<T extends object> extends ClientError<T> {
  code = 402;
}

/** Forbidden */
export class Forbidden<T extends object> extends ClientError<T> {
  code = 403;
}

/** Not Found */
export class NotFound<T extends object> extends ClientError<T> {
  code = 404;
}

/** Method not allowed */
export class MethodNotAllowed<T extends object> extends ClientError<T> {
  code = 405;
}

/** Not Acceptable */
export class NotAcceptable<T extends object> extends ClientError<T> {
  code = 406;
}

/** Proxy Authentication Required */
export class ProxyAuthenticationRequired<
  T extends object,
> extends ClientError<T> {
  code = 407;
}

/** Request Timeout */
export class RequestTimeout<T extends object> extends ClientError<T> {
  code = 408;
}

/** Conflict */
export class Conflict<T extends object> extends ClientError<T> {
  code = 409;
}

/** Gone */
export class Gone<T extends object> extends ClientError<T> {
  code = 410;
}

/** Length Required */
export class LengthRequired<T extends object> extends ClientError<T> {
  code = 411;
}

/** Precondition Failed */
export class PreconditionFailed<T extends object> extends ClientError<T> {
  code = 412;
}

/** Payload Too Large */
export class PayloadTooLarge<T extends object> extends ClientError<T> {
  code = 413;
}

/** URI Too Long */
export class URITooLong<T extends object> extends ClientError<T> {
  code = 414;
}

/** Unsupported Media Type */
export class UnsupportedMediaType<T extends object> extends ClientError<T> {
  code = 415;
}

/** Range Not Satisfiable */
export class RangeNotSatisfiable<T extends object> extends ClientError<T> {
  code = 416;
}

/** Expectation Failed */
export class ExpectationFailed<T extends object> extends ClientError<T> {
  code = 417;
}

/** I'm a teapot */
export class ImATeapot<T extends object> extends ClientError<T> {
  code = 418;
}

/** Misdirected Request */
export class MisdirectedRequest<T extends object> extends ClientError<T> {
  code = 421;
}

/** Unprocessable Entity */
export class UnprocessableEntity<T extends object> extends ClientError<T> {
  code = 422;
}

/** Locked */
export class Locked<T extends object> extends ClientError<T> {
  code = 423;
}

/** Failed Dependency */
export class FailedDependency<T extends object> extends ClientError<T> {
  code = 424;
}

/** Too Early */
export class TooEarly<T extends object> extends ClientError<T> {
  code = 425;
}

/** Upgrade Required */
export class UpgradeRequired<T extends object> extends ClientError<T> {
  code = 426;
}

/** Precondition Required */
export class PreconditionRequired<T extends object> extends ClientError<T> {
  code = 428;
}

/** Too Many Requests */
export class TooManyRequests<T extends object> extends ClientError<T> {
  code = 429;
}

/** Request Header Fields Too Large */
export class RequestHeaderFieldsTooLarge<
  T extends object,
> extends ClientError<T> {
  code = 431;
}

/** Unavailable For Legal Reasons */
export class UnavailableForLegalReasons<
  T extends object,
> extends ClientError<T> {
  code = 451;
}

/** Server Error */
export class ServerError<T extends object> extends HttpException<T> {
  code = 500;
}

/** Not Implemented */
export class NotImplemented<T extends object> extends ServerError<T> {
  code = 501;
}

/** Bad Gateway */
export class BadGateway<T extends object> extends ServerError<T> {
  code = 502;
}

/** Service Unavailable */
export class ServiceUnavailable<T extends object> extends ServerError<T> {
  code = 503;
}

/** Gateway Timeout */
export class GatewayTimeout<T extends object> extends ServerError<T> {
  code = 504;
}

/** HTTP Version Not Supported */
export class HTTPVersionNotSupported<T extends object> extends ServerError<T> {
  code = 505;
}

/** Variant Also Negotiates */
export class VariantAlsoNegotiates<T extends object> extends ServerError<T> {
  code = 506;
}

/** Insufficient Storage */
export class InsufficientStorage<T extends object> extends ServerError<T> {
  code = 507;
}

/** Loop Detected */
export class LoopDetected<T extends object> extends ServerError<T> {
  code = 508;
}

/** Not Extended */
export class NotExtended<T extends object> extends ServerError<T> {
  code = 510;
}

/** Network Authentication Required */
export class NetworkAuthenticationRequired<
  T extends object,
> extends ServerError<T> {
  code = 511;
}
