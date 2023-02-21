interface ExceptionOptions<T extends object> extends ErrorOptions {
  telemetry?: T;
}

export class Exception<T extends object> extends Error {
  readonly telemetry?: T;

  constructor(message: string, {telemetry, ...options}: ExceptionOptions<T>) {
    super(message, options);
    this.telemetry = telemetry;
  }
}
