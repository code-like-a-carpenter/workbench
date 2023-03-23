export interface Condition extends Parameter {
  readonly condition: string;
}

export interface Parameter {
  readonly name: string;
  readonly value: string;
}
