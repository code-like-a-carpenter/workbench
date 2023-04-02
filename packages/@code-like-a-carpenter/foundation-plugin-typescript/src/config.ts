import type {
  DispatcherConfig,
  HandlerConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

export interface ActionPluginConfig {
  readonly dependenciesModuleId: string;
  /**
   * When true, reads and writes `skFields: []` as `${skPrefix}#0` instead of
   * `${skPrefix}`. This is a workaround for behavior in a piece of internal
   * tooling and should never be used otherwise,
   */
  readonly legacyEmptySortFieldBehavior?: boolean;

  readonly defaultDispatcherConfig?: HandlerConfig;
  readonly defaultHandlerConfig?: HandlerConfig;
}

export const defaultDispatcherConfig: DispatcherConfig = {
  memorySize: 384,
  timeout: 60,
};

export const defaultHandlerConfig: HandlerConfig = {
  memorySize: 256,
  /**
   * Needs to be large to 1. account for retries with exponential backoff and
   * 2. to because a single lambda invocation will handle multiple updates.
   */
  timeout: 90,
};
