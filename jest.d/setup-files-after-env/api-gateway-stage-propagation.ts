import {isStageNotRoutable} from '../api-gateway.ts';

/**
 * Attempts are a second apart and the last one starts two seconds in, so a
 * retried request that then pays a cold start — 5.3s is the worst seen in CI —
 * still lands inside the 10s per-example timeout that
 * `@code-like-a-carpenter/contract-tests` sets, and inside the 30s the Examples
 * project gives every other test.
 */
const RETRY_BUDGET = 3_000;

const RETRY_INTERVAL = 1_000;

/**
 * The environment probes the stage before the tests start, but that only proves
 * the connection it used was routed. A later request can still get API
 * Gateway's own 403 for a stage it does not serve: on run 34372987406 the
 * second `aws-authorizer` example did, between five that did not. Retry those
 * responses rather than let the gateway's answer reach the assertions.
 *
 * A stage still missing when the budget runs out fails the example on the body
 * it returned, exactly as it would without the retry.
 */
if (process.env.TEST_ENV === 'aws') {
  const inner = globalThis.fetch;
  // Captured now so a test that installs fake timers cannot freeze the retry.
  const timer = globalThis.setTimeout;

  globalThis.fetch = async function fetch(
    ...args: Parameters<typeof globalThis.fetch>
  ): Promise<Response> {
    const deadline = Date.now() + RETRY_BUDGET;

    for (;;) {
      const response = await inner(...args);

      if (response.status !== 403) {
        return response;
      }

      // clone() so the caller still gets an unread body.
      if (!isStageNotRoutable(response.status, await response.clone().text())) {
        return response;
      }

      // Checked before sleeping: an attempt that cannot start before the budget
      // runs out would only push the example past its own timeout.
      if (Date.now() + RETRY_INTERVAL >= deadline) {
        return response;
      }

      // clone() tees the body, so the copy nobody will read has to be released
      // rather than left sitting in the HTTP client's buffer.
      await response.body?.cancel();

      await new Promise((resolve) => timer(resolve, RETRY_INTERVAL));
    }
  };
}
