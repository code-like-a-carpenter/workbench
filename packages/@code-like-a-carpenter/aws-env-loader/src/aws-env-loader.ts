import {env} from '@code-like-a-carpenter/env';

const CI = !!process.env.CI;

export async function loadAwsEnv() {
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;

  if (!CI) {
    process.env.AWS_PROFILE = env('AWS_PROFILE', 'webstorm_playground');
    process.env.AWS_SDK_LOAD_CONFIG = env('AWS_SDK_LOAD_CONFIG', '1');
  }
}
