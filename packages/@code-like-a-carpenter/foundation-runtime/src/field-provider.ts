export abstract class FieldProvider<MODEL, FIELD_NAME extends keyof MODEL> {
  abstract compute(model: MODEL): MODEL[FIELD_NAME];
}

export interface FieldProviderConstructor<
  MODEL,
  FIELD_NAME extends keyof MODEL,
> {
  new (): FieldProvider<MODEL, FIELD_NAME>;
}
