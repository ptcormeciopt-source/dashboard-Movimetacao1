import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ColumnDefinition, TableDefinition, QueryOptions, TableStats, SupabaseConfig, CarregamentoProduto } from '../types/supabase';

export const DEFAULT_SUPABASE_URL = 'https://vndgeizmqworbwwgyihl.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZGdlaXptcXdvcmJ3d2d5aWhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkwMDI4NSwiZXhwIjoyMDYyNDc2Mjg1fQ.7qft-9dAVnKcJqcMV7scLCAk7C5sJCsyl0dc76_w4ls';

// Single dedicated dataset for view_carregamento_expedicao
const DEMO_TABLES: Record<string, { definition: TableDefinition; rows: any[] }> = {
  view_carregamento_expedicao: {
    definition: {
      name: 'view_carregamento_expedicao',
      comment: 'View analítica de expedição agregada por movimentação, motorista, placa e data de carregamento',
      primaryKey: 'movimentacao_id',
      columns: [
        { name: 'movimentacao_id', type: 'integer', isPrimaryKey: true, required: true, description: 'ID único da movimentação' },
        { name: 'motorista', type: 'string', required: true, description: 'Nome do motorista responsável' },
        { name: 'placa', type: 'string', required: true, description: 'Placa do veículo de transporte' },
        { name: 'data_criacao', type: 'timestamp', required: true, description: 'Data e hora do carregamento' },
        { name: 'total_plt', type: 'integer', required: true, description: 'Total de pallets (COALESCE sum qtd_Plt)' },
        { name: 'total_pct', type: 'integer', required: true, description: 'Total de pacotes (COALESCE sum qtd_pct)' },
        { name: 'total_unidades', type: 'integer', required: true, description: 'Soma total de produtos (COALESCE sum somatotalproduto)' }
      ]
    },
    rows: []
  }
};

class SupabaseService {
  private config: SupabaseConfig;
  private client: SupabaseClient | null = null;
  private demoState: Record<string, { definition: TableDefinition; rows: any[] }>;

  constructor() {
    let initialConfig: SupabaseConfig = {
      url: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_KEY,
      isLive: true,
      lastConnected: new Date().toISOString()
    };

    const savedConfig = typeof window !== 'undefined' ? localStorage.getItem('supabase_config') : null;
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.anonKey && parsed.anonKey.length > 20) {
          initialConfig = parsed;
        }
      } catch {
        // default to initialConfig
      }
    }

    this.config = initialConfig;
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_config', JSON.stringify(this.config));
    }

    // Clone demo state
    this.demoState = JSON.parse(JSON.stringify(DEMO_TABLES));

    if (this.config.isLive && this.config.anonKey) {
      this.initClient(this.config.url, this.config.anonKey);
    }
  }

  public getConfig(): SupabaseConfig {
    return { ...this.config };
  }

  public saveConfig(config: SupabaseConfig) {
    this.config = config;
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_config', JSON.stringify(config));
    }
    if (config.isLive && config.anonKey) {
      this.initClient(config.url, config.anonKey);
    } else {
      this.client = null;
    }
  }

  private initClient(url: string, key: string) {
    try {
      this.client = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (e) {
      console.error('Failed to init Supabase client:', e);
      this.client = null;
    }
  }

  // Test live connection to the Supabase endpoint
  public async testConnection(url: string, key: string): Promise<{ success: boolean; message: string; tablesFound?: string[] }> {
    try {
      const sanitizedUrl = url.trim().replace(/\/+$/, '');
      const sanitizedKey = key.trim();

      // Test using PostgREST OpenAPI spec endpoint which returns all public tables and definitions
      const res = await fetch(`${sanitizedUrl}/rest/v1/?apikey=${sanitizedKey}`, {
        headers: {
          'apikey': sanitizedKey,
          'Authorization': `Bearer ${sanitizedKey}`,
          'Accept': 'application/openapi+json, application/json'
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          return { success: false, message: 'Chave API inválida ou não autorizada (401 Unauthorized). Verifique se a chave anon/public está correta.' };
        }
        return { success: false, message: `Erro ao conectar: status HTTP ${res.status} (${res.statusText})` };
      }

      const openApi = await res.json();
      const tables: string[] = [];

      if (openApi && openApi.definitions) {
        Object.keys(openApi.definitions).forEach(tableName => {
          if (!tableName.startsWith('_')) {
            tables.push(tableName);
          }
        });
      }

      return {
        success: true,
        message: `Conexão estabelecida com sucesso! ${tables.length > 0 ? `${tables.length} tabelas identificadas.` : 'Nenhuma tabela pública encontrada ou RLS ativo.'}`,
        tablesFound: tables
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Falha de rede ou CORS: ${err.message || 'Não foi possível contatar o endpoint'}`
      };
    }
  }

  // Discover only view_carregamento_expedicao (exclusive focus)
  public async getTables(): Promise<TableDefinition[]> {
    const defaultDef = DEMO_TABLES['view_carregamento_expedicao'].definition;
    if (!this.config.isLive || !this.client || !this.config.anonKey) {
      return [defaultDef];
    }

    try {
      const sanitizedUrl = this.config.url.trim().replace(/\/+$/, '');
      const sanitizedKey = this.config.anonKey.trim();

      const res = await fetch(`${sanitizedUrl}/rest/v1/?apikey=${sanitizedKey}`, {
        headers: {
          'apikey': sanitizedKey,
          'Authorization': `Bearer ${sanitizedKey}`,
          'Accept': 'application/openapi+json, application/json'
        }
      });

      if (res.ok) {
        const spec = await res.json();
        if (spec && spec.definitions && spec.definitions['view_carregamento_expedicao']) {
          const tableSpec = spec.definitions['view_carregamento_expedicao'];
          const columns: ColumnDefinition[] = [];
          const properties = tableSpec.properties || {};
          const required = tableSpec.required || [];

          for (const [colName, colSpec] of Object.entries<any>(properties)) {
            let colType = colSpec.type || 'string';
            if (colSpec.format === 'date-time' || colSpec.format === 'timestamp') {
              colType = 'timestamp';
            } else if (colSpec.type === 'integer' || colSpec.type === 'number') {
              colType = colSpec.type;
            } else if (colSpec.type === 'boolean') {
              colType = 'boolean';
            }

            columns.push({
              name: colName,
              type: colType,
              format: colSpec.format,
              description: colSpec.description,
              required: required.includes(colName),
              isPrimaryKey: colName === 'movimentacao_id' || colName === 'id' || colSpec.description?.toLowerCase().includes('primary key')
            });
          }

          return [{
            name: 'view_carregamento_expedicao',
            comment: tableSpec.description || 'View analítica de carregamento e expedição',
            columns,
            primaryKey: 'movimentacao_id'
          }];
        }
      }
    } catch (e) {
      console.warn('Could not fetch OpenAPI definitions from Supabase:', e);
    }

    return [defaultDef];
  }

  // Fetch paginated, sorted, filtered rows
  public async getTableData(
    tableName: string,
    options: QueryOptions
  ): Promise<{ data: any[]; totalCount: number; definition?: TableDefinition }> {
    if (!this.config.isLive || !this.client) {
      return this.getDemoTableData(tableName, options);
    }

    try {
      let query = this.client.from(tableName).select('*', { count: 'exact' });

      // Apply search query across visible text fields
      if (options.searchQuery && options.searchQuery.trim()) {
        const term = options.searchQuery.trim();
        if (!isNaN(Number(term))) {
          if (tableName === 'view_carregamento_expedicao') {
            query = query.or(`movimentacao_id.eq.${term}`);
          } else {
            query = query.or(`id.eq.${term}`);
          }
        } else {
          if (tableName === 'view_carregamento_expedicao') {
            query = query.or(`motorista.ilike.%${term}%,placa.ilike.%${term}%`);
          }
        }
      }

      // Apply specific filters
      if (options.filters && options.filters.length > 0) {
        options.filters.forEach(filter => {
          if (!filter.column || !filter.operator) return;
          switch (filter.operator) {
            case 'eq':
              query = query.eq(filter.column, filter.value);
              break;
            case 'neq':
              query = query.neq(filter.column, filter.value);
              break;
            case 'like':
              query = query.like(filter.column, `%${filter.value}%`);
              break;
            case 'ilike':
              query = query.ilike(filter.column, `%${filter.value}%`);
              break;
            case 'gt':
              query = query.gt(filter.column, filter.value);
              break;
            case 'gte':
              query = query.gte(filter.column, filter.value);
              break;
            case 'lt':
              query = query.lt(filter.column, filter.value);
              break;
            case 'lte':
              query = query.lte(filter.column, filter.value);
              break;
            case 'is_null':
              query = query.is(filter.column, null);
              break;
            case 'not_null':
              query = query.not(filter.column, 'is', null);
              break;
          }
        });
      }

      // Apply sorting
      if (options.sortColumn) {
        query = query.order(options.sortColumn, { ascending: options.sortAscending ?? true });
      }

      // Apply pagination
      const from = (options.page - 1) * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data || [],
        totalCount: count ?? (data ? data.length : 0)
      };
    } catch (err: any) {
      console.warn(`Error querying live table ${tableName}, falling back to demo:`, err);
      // Fallback to demo if table not found on live
      return this.getDemoTableData(tableName, options);
    }
  }

  // Insert row
  public async insertRow(tableName: string, rowData: any): Promise<{ data: any; error: string | null }> {
    if (!this.config.isLive || !this.client) {
      const table = this.demoState[tableName];
      if (!table) return { data: null, error: `Tabela ${tableName} não encontrada` };
      
      const newId = rowData.id ? Number(rowData.id) : (Math.max(0, ...table.rows.map(r => Number(r.id) || 0)) + 1);
      const newRow = {
        ...rowData,
        id: newId,
        created_at: rowData.created_at || new Date().toISOString()
      };
      table.rows.unshift(newRow);
      return { data: newRow, error: null };
    }

    try {
      const { data, error } = await this.client.from(tableName).insert(rowData).select().single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e.message || 'Erro ao inserir registro' };
    }
  }

  // Update row
  public async updateRow(tableName: string, primaryKeyCol: string, id: any, rowData: any): Promise<{ data: any; error: string | null }> {
    if (!this.config.isLive || !this.client) {
      const table = this.demoState[tableName];
      if (!table) return { data: null, error: `Tabela ${tableName} não encontrada` };

      const index = table.rows.findIndex(r => String(r[primaryKeyCol]) === String(id));
      if (index === -1) return { data: null, error: 'Registro não encontrado' };

      table.rows[index] = { ...table.rows[index], ...rowData };
      return { data: table.rows[index], error: null };
    }

    try {
      const { data, error } = await this.client.from(tableName).update(rowData).eq(primaryKeyCol, id).select().single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (e: any) {
      return { data: null, error: e.message || 'Erro ao atualizar registro' };
    }
  }

  // Delete row
  public async deleteRow(tableName: string, primaryKeyCol: string, id: any): Promise<{ success: boolean; error: string | null }> {
    if (!this.config.isLive || !this.client) {
      const table = this.demoState[tableName];
      if (!table) return { success: false, error: `Tabela ${tableName} não encontrada` };

      const prevLength = table.rows.length;
      table.rows = table.rows.filter(r => String(r[primaryKeyCol]) !== String(id));
      return { success: table.rows.length < prevLength, error: null };
    }

    try {
      const { error } = await this.client.from(tableName).delete().eq(primaryKeyCol, id);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro ao excluir registro' };
    }
  }

  // Compute rich statistical metrics from table data
  public computeStats(tableName: string, definition: TableDefinition, rows: any[]): TableStats {
    const totalRows = rows.length;
    const columnCount = definition.columns.length;

    // Numeric statistics for number/integer columns
    const numericStats: Record<string, { sum: number; avg: number; min: number; max: number }> = {};
    // Categorical breakdown for string/status columns
    const categoricalBreakdown: Record<string, { label: string; count: number; percentage: number }[]> = {};
    // Activity timeline if date column exists
    const timelineCounts: Record<string, number> = {};
    // Completeness per column
    const columnCompleteness: { column: string; filledCount: number; percentage: number; type: string }[] = [];

    // Identify candidate columns
    const numCols = definition.columns.filter(c => c.type === 'number' || c.type === 'integer');
    const catCols = definition.columns.filter(c => c.type === 'string' && !c.name.includes('email') && !c.name.includes('sku') && !c.name.includes('nome') && !c.name.includes('url'));
    const dateCol = definition.columns.find(c => c.type === 'timestamp' || c.name.includes('date') || c.name.includes('created') || c.name.includes('data'));

    // Compute column completeness
    definition.columns.forEach(col => {
      let filled = 0;
      rows.forEach(r => {
        if (r[col.name] !== undefined && r[col.name] !== null && r[col.name] !== '') {
          filled++;
        }
      });
      columnCompleteness.push({
        column: col.name,
        filledCount: filled,
        percentage: totalRows > 0 ? Math.round((filled / totalRows) * 100) : 100,
        type: col.type
      });
    });

    // Compute numerical aggregates
    numCols.forEach(col => {
      const values = rows.map(r => Number(r[col.name])).filter(v => !isNaN(v) && v !== null);
      if (values.length > 0) {
        const sum = values.reduce((acc, curr) => acc + curr, 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = sum / values.length;
        numericStats[col.name] = { sum, avg, min, max };
      }
    });

    // Compute categorical distribution for top categorical columns
    catCols.slice(0, 3).forEach(col => {
      const counts: Record<string, number> = {};
      rows.forEach(r => {
        const val = r[col.name] !== null && r[col.name] !== undefined ? String(r[col.name]) : 'N/A';
        counts[val] = (counts[val] || 0) + 1;
      });
      const entries = Object.entries(counts)
        .map(([label, count]) => ({
          label,
          count,
          percentage: totalRows > 0 ? Math.round((count / totalRows) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      categoricalBreakdown[col.name] = entries;
    });

    // Compute timeline activity
    if (dateCol) {
      rows.forEach(r => {
        const rawDate = r[dateCol.name];
        if (rawDate) {
          const dateStr = String(rawDate).substring(0, 10);
          timelineCounts[dateStr] = (timelineCounts[dateStr] || 0) + 1;
        }
      });
    }

    const timelineActivity = Object.entries(timelineCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRows,
      columnCount,
      numericStats,
      categoricalBreakdown,
      timelineActivity,
      columnCompleteness
    };
  }

  private getDemoTableData(tableName: string, options: QueryOptions) {
    const table = this.demoState[tableName] || this.demoState['view_carregamento_expedicao'] || Object.values(this.demoState)[0];
    let filtered = [...table.rows];

    // Global Search
    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(row => {
        return Object.values(row).some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        );
      });
    }

    // Filters
    if (options.filters && options.filters.length > 0) {
      options.filters.forEach(filter => {
        if (!filter.column || !filter.operator) return;
        filtered = filtered.filter(row => {
          const val = row[filter.column];
          const filterVal = filter.value;
          switch (filter.operator) {
            case 'eq':
              return String(val).toLowerCase() === String(filterVal).toLowerCase();
            case 'neq':
              return String(val).toLowerCase() !== String(filterVal).toLowerCase();
            case 'like':
            case 'ilike':
              return String(val).toLowerCase().includes(String(filterVal).toLowerCase());
            case 'gt':
              return Number(val) > Number(filterVal);
            case 'gte':
              return Number(val) >= Number(filterVal);
            case 'lt':
              return Number(val) < Number(filterVal);
            case 'lte':
              return Number(val) <= Number(filterVal);
            case 'is_null':
              return val === null || val === undefined;
            case 'not_null':
              return val !== null && val !== undefined;
            default:
              return true;
          }
        });
      });
    }

    // Sort
    if (options.sortColumn) {
      const col = options.sortColumn;
      const asc = options.sortAscending ?? true;
      filtered.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return asc ? valA - valB : valB - valA;
        }
        return asc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }

    const totalCount = filtered.length;
    const start = (options.page - 1) * options.pageSize;
    const paginated = filtered.slice(start, start + options.pageSize);

    return {
      data: paginated,
      totalCount,
      definition: table.definition
    };
  }

  public resetDemoData() {
    this.demoState = JSON.parse(JSON.stringify(DEMO_TABLES));
  }

  // Fetch products loaded for a specific carreta (id_item references movimentacao.id)
  public async getProdutosByMovimentacao(movimentacaoId: number | string): Promise<CarregamentoProduto[]> {
    if (!this.config.isLive || !this.client) {
      return [];
    }

    try {
      const { data, error } = await this.client
        .from('produtos')
        .select('*')
        .eq('id_item', movimentacaoId)
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching produtos for movimentacao:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        produto: item.produto,
        lote: item.lote,
        id_item: item.id_item,
        qtd_Plt: Number(item.qtd_Plt || 0),
        qtd_pct: Number(item.qtd_pct || 0),
        somatotalproduto: Number(item.somatotalproduto || 0)
      }));
    } catch (e) {
      console.error('Error in getProdutosByMovimentacao:', e);
      return [];
    }
  }

  // Batch fetch products for multiple visible carretas in one fast request
  public async getBatchProdutos(movimentacaoIds: (number | string)[]): Promise<Record<string, CarregamentoProduto[]>> {
    if (!this.config.isLive || !this.client || movimentacaoIds.length === 0) {
      return {};
    }

    try {
      const { data, error } = await this.client
        .from('produtos')
        .select('*')
        .in('id_item', movimentacaoIds)
        .order('id', { ascending: true });

      if (error) {
        console.error('Error batch fetching produtos:', error);
        return {};
      }

      const map: Record<string, CarregamentoProduto[]> = {};
      (data || []).forEach((item: any) => {
        const key = String(item.id_item);
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push({
          id: item.id,
          created_at: item.created_at,
          produto: item.produto,
          lote: item.lote,
          id_item: item.id_item,
          qtd_Plt: Number(item.qtd_Plt || 0),
          qtd_pct: Number(item.qtd_pct || 0),
          somatotalproduto: Number(item.somatotalproduto || 0)
        });
      });

      return map;
    } catch (e) {
      console.error('Error in getBatchProdutos:', e);
      return {};
    }
  }
}

export const supabaseService = new SupabaseService();
