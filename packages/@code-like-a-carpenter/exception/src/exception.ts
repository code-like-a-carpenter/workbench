export interface ExceptionOptions<T extends object> extends ErrorOptions {
  telemetry?: T;
}

export class Exception<T extends object> extends Error {
  readonly telemetry?: T;

  constructor(
    message: string,
    {telemetry, ...options}: ExceptionOptions<T> = {}
  ) {
    super(message, options);
    this.telemetry = telemetry;
  }

  /**
   * Override name property so we get the real constructor name instead of just
   * "Error"
   */
  get name() {
    return this.constructor.name;
  }
}
