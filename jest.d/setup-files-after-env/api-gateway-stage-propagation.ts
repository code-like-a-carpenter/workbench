import {isStageNotRoutable} from '../api-gateway.ts';

/**
 * Examples talk to deployed AWS stacks. A cold Lambda alone has taken 5.3s in
 * CI, and a request can spend a few more seconds waiting out a stage that is
 * not serving yet, so Jest's 5s default is not enough. `buildContractTests`
 * passes its own 10s to `it()`, which wins for the tests it generates; this
 * covers the plain `it()`s the examples write by hand, such as `basic-wiring`'s
 * `returns valid html`.
 *
 * It has to be set here rather than as `testTimeout` on the Examples project:
 * `jest-circus` reads `globalConfig.testTimeout`, so a project-level value is
 * silently dropped.
 */
jest.setTimeout(30_000);

/**
 * Two attempts follow the first, each a second after the one before it failed,
 * and the third only starts if it can begin within the budget. The budget caps
 * when the last attempt may *start*, not how long the whole call takes: the
 * request itself is not capped, so a retried request that then pays a 5.3s cold
 * start can finish well after the budget. That is deliberate — the alternative
 * is aborting a request that is merely slow — but it means the retry does not
 * guarantee the example finishes inside its own timeout.
 */
const RETRY_BUDGET = 3_000;

const RETRY_INTERVAL = 1_000;

/**
 * Requests to anything else are none of this wrapper's business. Matching on
 * origin rather than the whole `API_URL` prefix keeps this insensitive to how
 * the callers join the stage path — `contract-tests` rebuilds the URL through
 * `new URL()` and `path.join()` — while still excluding other services.
 */
function isApiRequest(input: RequestInfo | URL): boolean {
  const {API_URL} = process.env;
  if (!API_URL) {
    return false;
  }

  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  try {
    return new URL(url).origin === new URL(API_URL).origin;
  } catch {
    return false;
  }
}

/**
 * A retry re-sends the arguments it was given, so it is only safe when the body
 * can be sent twice. A `Request` has its body consumed by the first attempt,
 * and a stream can only be read once; a string, buffer, or absent body replays
 * fine. `contract-tests` sends strings.
 */
function isReplayable(args: Parameters<typeof globalThis.fetch>): boolean {
  const [input, init] = args;
  if (input instanceof Request) {
    return false;
  }

  const body = init?.body;
  return !(body instanceof ReadableStream);
}

/**
 * The environment probes the stage before the tests start, but that only proves
 * the connection it used was routed. A later request can still get API
 * Gateway's own 403 for a stage it does not serve: on run 34372987406 the
 * second `aws-authorizer` example did, between five that did not. Retry those
 * responses rather than let the gateway's answer reach the assertions.
 *
 * Only the gateway's own `Forbidden` envelope is retried, which is narrower
 * than the environment probe's idea of "not serving yet". The probe runs before
 * any test and can afford to keep waiting through a CloudFront error page or a
 * 5xx; here a wrong guess masks a real failure, so anything else goes straight
 * to the assertions.
 *
 * When the budget runs out the last response is returned, so the example fails
 * on the body it got — unless that attempt throws, in which case the caller
 * sees the error instead.
 */
if (process.env.TEST_ENV === 'aws') {
  const inner = globalThis.fetch;
  // Captured now so a test that installs fake timers cannot freeze the retry.
  // Jest's fake timers replace `Date` as well as `setTimeout`, so the clock the
  // deadline is measured against has to be captured too, or the budget never
  // expires and the loop retries forever.
  const timer = globalThis.setTimeout;
  const {now} = Date;

  globalThis.fetch = async function fetch(
    ...args: Parameters<typeof globalThis.fetch>
  ): Promise<Response> {
    if (!isApiRequest(args[0]) || !isReplayable(args)) {
      return inner(...args);
    }

    const deadline = now() + RETRY_BUDGET;

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
      if (now() + RETRY_INTERVAL >= deadline) {
        return response;
      }

      // clone() tees the body, so the copy nobody will read has to be released
      // rather than left sitting in the HTTP client's buffer.
      await response.body?.cancel();

      await new Promise((resolve) => timer(resolve, RETRY_INTERVAL));
    }
  };
}
