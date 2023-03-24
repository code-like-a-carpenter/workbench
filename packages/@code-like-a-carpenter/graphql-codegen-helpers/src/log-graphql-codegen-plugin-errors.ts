/**
 * graphql-codegen suppresses most useful error output when something goes
 * wrong. This makes sure it gets logged to stderr before it gets swallowed.
 */
export function logGraphQLCodegenPluginErrors<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
}
