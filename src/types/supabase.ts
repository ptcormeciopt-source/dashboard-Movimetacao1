export interface ColumnDefinition {
  name: string;
  type: string;
  format?: string;
  description?: string;
  required?: boolean;
  isPrimaryKey?: boolean;
  defaultValue?: any;
}

export interface TableDefinition {
  name: string;
  comment?: string;
  columns: ColumnDefinition[];
  primaryKey?: string;
}

export interface FilterCondition {
  column: string;
  operator: 'eq' | 'neq' | 'like' | 'ilike' | 'gt' | 'gte' | 'lt' | 'lte' | 'is_null' | 'not_null';
  value: string;
}

export interface QueryOptions {
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortAscending?: boolean;
  filters?: FilterCondition[];
  searchQuery?: string;
}

export interface TableStats {
  totalRows: number;
  columnCount: number;
  numericStats: Record<string, { sum: number; avg: number; min: number; max: number }>;
  categoricalBreakdown: Record<string, { label: string; count: number; percentage: number }[]>;
  timelineActivity: { date: string; count: number }[];
  columnCompleteness: { column: string; filledCount: number; percentage: number; type: string }[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isLive: boolean;
  lastConnected?: string;
}

export interface CarregamentoProduto {
  id: number;
  created_at?: string;
  produto: string | null;
  lote: number | null;
  id_item: number;
  qtd_Plt: number;
  qtd_pct: number;
  somatotalproduto: number;
}

