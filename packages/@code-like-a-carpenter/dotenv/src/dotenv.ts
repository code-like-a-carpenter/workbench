import dotenv from 'dotenv';

const TEST = process.env.NODE_ENV === 'test';
const PROD = process.env.NODE_ENV === 'production';
const DEV = !PROD && !TEST;

if (typeof process.env.SKIP_DOT_ENV === 'undefined') {
  [
    DEV && '.env.development.local',
    TEST && '.env.test.local',
    PROD && '.env.production.local',
    '.env.local',
    DEV && '.env.development',
    TEST && '.env.test',
    PROD && '.env.production',
    '.env',
  ]
    .filter(Boolean)
    .forEach((name) => typeof name === 'string' && dotenv.config({path: name}));
}
