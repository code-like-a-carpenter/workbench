import {ConsoleLogger} from './console-logger.ts';
import type {Logger} from './types.ts';

export const logger: Logger = new ConsoleLogger();
