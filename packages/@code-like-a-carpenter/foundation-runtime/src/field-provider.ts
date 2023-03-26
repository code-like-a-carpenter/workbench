export abstract class FieldProvider<MODEL, RETURN_TYPE> {
  private computed = false;
  private computedValue: RETURN_TYPE | undefined;

  constructor(initialValue?: RETURN_TYPE) {
    if (typeof initialValue !== undefined) {
      this.computed = true;
      this.computedValue = initialValue;
    }
  }

  compute(model: MODEL): RETURN_TYPE {
    if (!this.computed) {
      this.computed = true;
      this.computedValue = this._compute(model);
    }
    // @ts-expect-error tsc can't tell if `computedValue` is correct or not
    // because we're using the indirect signal `computed`. We have to relay on
    // a separate flag because RETURN_TYPE could potentially allow `undefined`.
    return this.computedValue;
  }

  protected abstract _compute(model: MODEL): RETURN_TYPE;
}
