/**
 * The single-key `{"message": …}` envelope API Gateway uses for its own errors.
 * Returns the message, or undefined for any other body: the HTML error page
 * CloudFront serves when it cannot reach the stage, and the examples' own error
 * responses, which all carry more than `message` — `aws-authorizer` adds `type`
 * and `name` through its `ACCESS_DENIED` template, `basic-wiring` adds `name`
 * and `requestIds`.
 */
export function gatewayMessage(body: string): string | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return undefined;
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Object.keys(parsed).length !== 1
  ) {
    return undefined;
  }

  const {message} = parsed as {message?: unknown};
  return typeof message === 'string' ? message : undefined;
}

/** API Gateway's own answer for a stage it does not route. */
export function isStageNotRoutable(status: number, body: string): boolean {
  return status === 403 && gatewayMessage(body) === 'Forbidden';
}
