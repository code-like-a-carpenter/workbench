export class EnvironmentError extends TypeError {
  /**
   * @param {string} variableName
   */
  constructor(variableName) {
    super(`process.env.${variableName} must be defined`);
  }
}
