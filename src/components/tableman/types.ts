export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

export interface TableDataResponse {
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  total: number;
}
