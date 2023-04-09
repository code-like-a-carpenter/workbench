export interface LambdaConfig {
  readonly memorySize: number;
  readonly timeout: number;
}

export type ProjectionType = 'all' | 'keys_only';
