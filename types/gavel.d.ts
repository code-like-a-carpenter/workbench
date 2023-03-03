declare module 'gavel' {
  export interface Result {
    valid: boolean;
    fields: {
      body: BodyExpectation;
      headers: HeadersExpectation;
      statusCode: StatusCodeExpectation;
    };
  }

  export interface BodyExpectation {
    valid: boolean;
    kind: 'json';
    values: {
      expected: any;
      actual: any;
    };
    errors: {
      message: string;
      location: {
        pointer: string;
      };
    }[];
  }

  export interface HeadersExpectation {
    valid: boolean;
    kind: 'json';
    values: {
      expected: Record<string, string>;
      actual: Record<string, string>;
    };
    errors: {message: string}[];
  }

  export interface StatusCodeExpectation {
    valid: boolean;
    kind: 'text';
    values: {
      expected: string;
      actual: string;
    };
    errors: {message: string}[];
  }

  export interface HTTPMessage {
    body?: string;
    bodySchema?: object;
    headers: Record<string, string>;
    statusCode: number;
  }

  export function validate(expected: HTTPMessage, actual: HTTPMessage): Result;
}
