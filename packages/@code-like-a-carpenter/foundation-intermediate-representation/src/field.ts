export interface Field {
  /** The database column name. */
  readonly columnName: string;
  /**
   * In order to handle the possibility of legacy tables, read all possible
   * column permutations
   */
  readonly columnNamesForRead: readonly string[];
  /** String to use as the field's EntityAttributeName key */
  readonly ean: string;
  /** String to use as the field's EntityAttributeValue key */
  readonly eav: string;
  /** The runtime field name. */
  readonly fieldName: string;
  readonly isDateType: boolean;
  readonly isRequired: boolean;
  readonly isScalarType: boolean;
  /** The GraphQL type of the field. */
  readonly typeName: string;
}
