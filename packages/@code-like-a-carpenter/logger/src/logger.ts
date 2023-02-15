import {ConsoleLogger} from './console-logger';
import type {Logger} from './types';

export const logger: Logger = new ConsoleLogger();
