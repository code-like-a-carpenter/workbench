export interface ToolMetadataItem {
  readonly commandName: string;
  readonly description: string;
  readonly executorPath: string;
  readonly executorShimPath: string;
  readonly schema: unknown;
  readonly schemaPath: string;
  readonly toolName: string;
  readonly typesPath: string;
  readonly typesImportName: string;
}

export interface ToolMetadata {
  readonly generatedDir: string;
  readonly executorsJson: string;
  readonly packageJson: string;
  readonly metadata: readonly ToolMetadataItem[];
  readonly root: string;
}
