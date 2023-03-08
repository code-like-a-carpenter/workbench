declare module 'dredd-transactions' {
  export interface Annotation {
    readonly type: string;
    readonly component: string;
    readonly message: string;
    readonly location: readonly AnnotationLocation[];
  }

  type AnnotationLocation = readonly [number, number];

  export interface Transaction {
    readonly name: string;
    readonly origin: TransactionOrigin;
    readonly request: TransactionRequest;
    readonly response: TransactionResponse;
  }

  export interface TransactionOrigin {
    readonly filename: string;
    readonly apiName: string;
    readonly resourceGroupName: string;
    readonly resourceName: string;
    readonly actionName: string;
    readonly exampleName: string;
  }

  export interface TransactionRequest {
    readonly body: string;
    readonly headers: readonly TransactionHeader[];
    readonly method: string;
    readonly uri: string;
  }

  export interface TransactionResponse {
    readonly body?: string;
    readonly schema?: string;
    readonly headers: readonly TransactionHeader[];
    readonly status: string;
  }

  export interface TransactionHeader {
    readonly name: string;
    readonly value: string;
  }

  export function compile(
    mediaType: string,
    apiElements: any
  ): {
    readonly annotations: readonly Annotation[];
    readonly transactions: readonly Transaction[];
  };

  export interface ParseResult {
    readonly apiElements: any;
    readonly mediaType: string;
  }

  export function parse(
    api: string,
    callback: (err: any, result: ParseResult) => void
  ): void;
}
