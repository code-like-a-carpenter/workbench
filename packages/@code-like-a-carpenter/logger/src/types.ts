export type Meta = Record<string, unknown>;

export interface LeveledLogMethod {
  (message: string): void;
  (message: string, meta: Meta): void;
}

export interface CoreLogger<LEVEL extends string> {
  _log(level: LEVEL, message: string): void;
  _log(level: LEVEL, message: string, meta: Meta): void;
  child(meta: Meta): LeveledLogger<LEVEL>;
}

export type LeveledLogger<LEVEL extends string> = Record<
  LEVEL,
  LeveledLogMethod
> &
  CoreLogger<LEVEL>;

export type ConsoleLevels =
  | 'error'
  | 'warn'
  | 'log'
  | 'info'
  | 'debug'
  | 'trace';

export type Logger = LeveledLogger<ConsoleLevels>;
