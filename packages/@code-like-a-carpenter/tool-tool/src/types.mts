export interface CommonToolMetadataItem {
  readonly commandName: string;
  readonly description: string;
  readonly executorPath: string;
  readonly schema: unknown;
  readonly schemaPath: string;
  readonly toolName: string;
  readonly typesPath: string;
  readonly typesImportName: string;
}

export interface UnbuiltToolMetadataItem extends CommonToolMetadataItem {
  readonly built: false;
  readonly executorShimPath: string;
}

export interface BuiltToolMetadataItem extends CommonToolMetadataItem {
  readonly built: true;
  readonly buildDirExecutorPath: string;
}

export interface CommonToolMetadata {
  readonly generatedDir: string;
  readonly executorsJson: string;
  readonly packageJson: string;
  readonly root: string;
}

export interface UnbuiltToolMetadata extends CommonToolMetadata {
  readonly built: false;
  readonly metadata: readonly UnbuiltToolMetadataItem[];
}

export interface BuiltToolMetadata extends CommonToolMetadata {
  readonly built: true;
  readonly metadata: readonly BuiltToolMetadataItem[];
}

export type ToolMetadata = UnbuiltToolMetadata | BuiltToolMetadata;
