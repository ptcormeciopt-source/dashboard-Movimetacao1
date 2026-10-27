import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Package,
  Layers,
  Box,
  ChevronsUpDown,
  ChevronsDown,
  ChevronsUp
} from 'lucide-react';
import { ColumnDefinition, TableDefinition, CarregamentoProduto } from '../types/supabase';

interface DataTableProps {
  definition: TableDefinition;
  columns: ColumnDefinition[];
  visibleColumns: string[];
  data: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  sortColumn?: string;
  sortAscending?: boolean;
  onSort: (column: string) => void;
  isLoading: boolean;
  onViewRecord: (row: any) => void;
  onResetFilters?: () => void;
  productsMap?: Record<string, CarregamentoProduto[]>;
  isLoadingProducts?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  definition,
  columns,
  visibleColumns,
  data,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  sortColumn,
  sortAscending,
  onSort,
  isLoading,
  onViewRecord,
  onResetFilters,
  productsMap = {},
  isLoadingProducts = false
}) => {
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  const displayColumns = columns.filter((c) => visibleColumns.includes(c.name));
  const primaryKey = definition.primaryKey || 'movimentacao_id';
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const toggleRowExpanded = (rowId: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const handleToggleAllExpanded = () => {
    if (expandedRows.size === data.length && data.length > 0) {
      setExpandedRows(new Set());
    } else {
      const allIds = data.map((r, idx) => r[primaryKey] !== undefined ? r[primaryKey] : idx);
      setExpandedRows(new Set(allIds));
    }
  };

  const handleCopy = (val: any, cellKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (val === null || val === undefined) return;
    navigator.clipboard.writeText(typeof val === 'object' ? JSON.stringify(val) : String(val));
    setCopiedCell(cellKey);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const renderCellValue = (val: any, col: ColumnDefinition, rowKey: string, row: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-600 italic">null</span>;
    }

    if (col.name === 'placa') {
      const rowId = row[primaryKey];
      const prods = rowId !== undefined ? productsMap[String(rowId)] : undefined;
      const prodCount = prods ? prods.length : null;

      return (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold tracking-wider text-slate-200 bg-slate-900 border border-slate-700/70 px-2.5 py-0.5 rounded shadow-xs">
            {String(val).trim()}
          </span>
          {prodCount !== null && (
            <span
              onClick={(e) => toggleRowExpanded(rowId, e)}
              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                prodCount > 1
                  ? 'bg-purple-950/60 border-purple-800/70 text-purple-300 hover:bg-purple-900/60'
                  : prodCount === 1
                  ? 'bg-slate-900 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}
              title="Clique para ver os produtos carregados nesta carreta"
            >
              <Package className="w-2.5 h-2.5" />
              <span>{prodCount === 1 ? '1 item' : `${prodCount} itens`}</span>
            </span>
          )}
        </div>
      );
    }

    if (col.name === 'motorista') {
      return (
        <span className="font-medium text-white">
          {String(val).trim()}
        </span>
      );
    }

    if (col.name === 'total_plt') {
      return (
        <span className="font-mono tabular-nums text-cyan-300 font-semibold">
          {Number(val).toLocaleString('pt-BR')} <span className="text-[10px] text-slate-500 font-normal">PLT</span>
        </span>
      );
    }

    if (col.name === 'total_pct') {
      return (
        <span className="font-mono tabular-nums text-amber-300 font-semibold">
          {Number(val).toLocaleString('pt-BR')} <span className="text-[10px] text-slate-500 font-normal">PCT</span>
        </span>
      );
    }

    if (col.name === 'total_unidades') {
      return (
        <span className="font-mono tabular-nums text-emerald-400 font-bold">
          {Number(val).toLocaleString('pt-BR')} <span className="text-[10px] text-emerald-500/70 font-normal">un</span>
        </span>
      );
    }

    if (col.type === 'timestamp' || col.format === 'date-time' || col.name === 'data_criacao') {
      try {
        const date = new Date(val);
        return (
          <span className="font-mono tabular-nums text-slate-400 text-xs">
            {date.toLocaleDateString('pt-BR')} <span className="text-slate-600">·</span>{' '}
            <strong className="text-slate-300 font-medium">
              {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </strong>
          </span>
        );
      } catch {
        return <span className="font-mono text-slate-400">{String(val)}</span>;
      }
    }

    if (col.type === 'number' || col.type === 'integer') {
      return (
        <span className="font-mono tabular-nums text-slate-200">
          {Number(val).toLocaleString('pt-BR')}
        </span>
      );
    }

    return <span className="text-slate-300 truncate max-w-[260px] inline-block">{String(val)}</span>;
  };

  const getColumnLabel = (colName: string) => {
    switch (colName) {
      case 'movimentacao_id':
        return 'ID Movimentação';
      case 'motorista':
        return 'Motorista';
      case 'placa':
        return 'Placa do Veículo';
      case 'data_criacao':
        return 'Data / Hora do Carregamento';
      case 'total_plt':
        return 'Total Paletes (PLT)';
      case 'total_pct':
        return 'Total Pacotes (PCT)';
      case 'total_unidades':
        return 'Total Unidades Expedidas';
      default:
        return colName;
    }
  };

  const isAllExpanded = data.length > 0 && expandedRows.size === data.length;

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b101a] overflow-hidden flex flex-col shadow-lg">
      {/* Table Container with Horizontal Scroll */}
      <div className="overflow-x-auto min-h-[420px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-[#0d1424] text-slate-400 font-medium select-none">
              {/* Expand all button in header */}
              <th className="py-3 px-3 w-16 text-center text-slate-500 font-mono">
                <button
                  type="button"
                  onClick={handleToggleAllExpanded}
                  className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title={isAllExpanded ? 'Recolher todos os itens das carretas' : 'Expandir o que está carregado em todas as carretas'}
                >
                  {isAllExpanded ? (
                    <ChevronsUp className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <ChevronsDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </th>
              {displayColumns.map((col) => {
                const isSorted = sortColumn === col.name;
                const isNumeric = col.type === 'number' || col.type === 'integer' || col.name.startsWith('total_');
                return (
                  <th
                    key={col.name}
                    onClick={() => onSort(col.name)}
                    className={`py-3 px-3.5 cursor-pointer hover:bg-slate-800/50 hover:text-slate-200 transition-colors whitespace-nowrap ${
                      isNumeric ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${isNumeric ? 'flex-row-reverse' : ''}`}>
                      <span className="font-medium text-slate-200">{getColumnLabel(col.name)}</span>
                      {col.isPrimaryKey && (
                        <span className="text-[10px] text-emerald-400 font-mono px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/50">
                          PK
                        </span>
                      )}
                      <span className="text-slate-500">
                        {isSorted ? (
                          sortAscending ? (
                            <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="py-3 px-3.5 w-20 text-center text-slate-500">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {isLoading ? (
              // Loading Skeleton matching exact row height
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-3.5 text-center">
                    <div className="w-5 h-4 bg-slate-800 rounded mx-auto" />
                  </td>
                  {displayColumns.map((col) => (
                    <td key={col.name} className="py-3 px-3.5">
                      <div className="h-4 bg-slate-800/70 rounded w-3/4" />
                    </td>
                  ))}
                  <td className="py-3 px-3.5 text-center">
                    <div className="h-4 bg-slate-800/70 rounded w-6 mx-auto" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={displayColumns.length + 2} className="py-16 text-center">
                  <div className="max-w-md mx-auto space-y-2.5">
                    <AlertCircle className="w-9 h-9 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-300">Nenhum carregamento encontrado</h4>
                    <p className="text-xs text-slate-500">
                      Não há registros em <code className="text-emerald-400 font-mono">view_carregamento_expedicao</code> que correspondam aos filtros selecionados.
                    </p>
                    {onResetFilters && (
                      <div className="pt-2">
                        <button
                          onClick={onResetFilters}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Limpar Filtros</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              // Render Data Rows + Expandable Sub-Rows
              data.map((row, index) => {
                const rowId = row[primaryKey] !== undefined ? row[primaryKey] : index;
                const rowIndex = (currentPage - 1) * pageSize + index + 1;
                const isExpanded = expandedRows.has(rowId);
                const loadedProducts = productsMap[String(rowId)] || [];

                return (
                  <React.Fragment key={rowId}>
                    {/* Primary Row */}
                    <tr
                      onClick={() => toggleRowExpanded(rowId)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isExpanded ? 'bg-slate-900/50' : ''
                      }`}
                    >
                      {/* Expand Chevron + Row Index */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => toggleRowExpanded(rowId, e)}
                            className={`p-1 rounded transition-transform text-slate-400 hover:text-white hover:bg-slate-800 ${
                              isExpanded ? 'text-emerald-400 rotate-90' : ''
                            }`}
                            title={isExpanded ? 'Recolher produtos' : 'Ver o que está carregado nesta carreta'}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-[11px] text-slate-600 w-4 text-right">
                            {rowIndex}
                          </span>
                        </div>
                      </td>

                      {/* Columns */}
                      {displayColumns.map((col) => {
                        const isNumeric = col.type === 'number' || col.type === 'integer' || col.name.startsWith('total_');
                        const cellKey = `${rowId}-${col.name}`;
                        const isCopied = copiedCell === cellKey;
                        const val = row[col.name];

                        return (
                          <td
                            key={col.name}
                            className={`py-2.5 px-3.5 ${isNumeric ? 'text-right' : 'text-left'}`}
                          >
                            <div
                              onClick={(e) => handleCopy(val, cellKey, e)}
                              title="Clique para copiar valor"
                              className="inline-flex items-center gap-1.5 group/cell"
                            >
                              {renderCellValue(val, col, cellKey, row)}
                              <span className="opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1">
                                {isCopied ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 text-slate-500" />
                                )}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Action button */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewRecord(row);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          title="Ver manifesto completo da viagem"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* Inline Expandable Sub-Row (Produtos Carregados na Carreta) */}
                    {isExpanded && (
                      <tr className="bg-[#080d17] border-y border-slate-800/90">
                        <td colSpan={displayColumns.length + 2} className="p-0">
                          <div className="py-3 px-6 sm:px-12 bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-slate-900/40 border-l-4 border-emerald-500 space-y-2.5">
                            {/* Sub-row Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-emerald-400" />
                                <span className="font-semibold text-white">
                                  Itens Carregados na Carreta:
                                </span>
                                <span className="font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-bold">
                                  {row.placa}
                                </span>
                                <span className="text-slate-400">
                                  · Motorista: <strong className="text-slate-200">{row.motorista}</strong>
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-mono text-slate-400">
                                  Origem: <code className="text-emerald-400">public.produtos</code> (id_item: {rowId})
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewRecord(row);
                                  }}
                                  className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium"
                                >
                                  Abrir Manifesto Completo
                                </button>
                              </div>
                            </div>

                            {/* Sub-row Products Grid/Table */}
                            {loadedProducts.length === 0 ? (
                              <div className="py-4 text-center text-slate-400 text-xs bg-slate-950/60 rounded-lg border border-slate-800/80">
                                {isLoadingProducts ? (
                                  <span>Carregando itens da carreta...</span>
                                ) : (
                                  <span>Nenhum produto cadastrado para esta movimentação (id_item: {rowId}).</span>
                                )}
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-lg border border-slate-800/80 bg-slate-950/70 shadow-inner">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                                      <th className="py-2 px-3 text-slate-300">Produto Carregado</th>
                                      <th className="py-2 px-3 text-center">Lote</th>
                                      <th className="py-2 px-3 text-right">Paletes (qtd_Plt)</th>
                                      <th className="py-2 px-3 text-right">Pacotes (qtd_pct)</th>
                                      <th className="py-2 px-3 text-right text-emerald-300">Total Unidades</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60 text-xs">
                                    {loadedProducts.map((prod, pIdx) => (
                                      <tr key={prod.id || pIdx} className="hover:bg-slate-900/50 transition-colors">
                                        <td className="py-2 px-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                                              <Package className="w-3 h-3" />
                                            </div>
                                            <span className="font-medium text-slate-100">
                                              {prod.produto || 'Item sem descrição'}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          {prod.lote !== null && prod.lote !== undefined ? (
                                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-300">
                                              Lote {prod.lote}
                                            </span>
                                          ) : (
                                            <span className="text-slate-600 italic">-</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono tabular-nums text-cyan-300 font-semibold">
                                          {prod.qtd_Plt.toLocaleString('pt-BR')}{' '}
                                          <span className="text-[10px] text-slate-500 font-normal">PLT</span>
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono tabular-nums text-amber-300 font-semibold">
                                          {prod.qtd_pct.toLocaleString('pt-BR')}{' '}
                                          <span className="text-[10px] text-slate-500 font-normal">PCT</span>
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-400 font-bold">
                                          {prod.somatotalproduto.toLocaleString('pt-BR')}{' '}
                                          <span className="text-[10px] text-emerald-500/70 font-normal">un</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  {loadedProducts.length > 1 && (
                                    <tfoot>
                                      <tr className="border-t border-slate-700 bg-slate-900/60 text-[11px] font-semibold">
                                        <td colSpan={2} className="py-1.5 px-3 text-right text-slate-300">
                                          Soma desta Carreta:
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono text-cyan-300">
                                          {loadedProducts.reduce((sum, p) => sum + p.qtd_Plt, 0).toLocaleString('pt-BR')} PLT
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono text-amber-300">
                                          {loadedProducts.reduce((sum, p) => sum + p.qtd_pct, 0).toLocaleString('pt-BR')} PCT
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-mono text-emerald-400">
                                          {loadedProducts.reduce((sum, p) => sum + p.somatotalproduto, 0).toLocaleString('pt-BR')} un
                                        </td>
                                      </tr>
                                    </tfoot>
                                  )}
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Status Footer */}
      <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0d1424] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 font-mono text-xs flex items-center gap-3">
          <div>
            Exibindo{' '}
            <span className="text-white font-semibold tabular-nums">
              {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            a{' '}
            <span className="text-white font-semibold tabular-nums">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{' '}
            de <span className="text-emerald-400 font-semibold tabular-nums">{totalCount.toLocaleString('pt-BR')}</span> viagens
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline text-[11px]">
            Clique na linha ou na seta <span className="text-emerald-400 font-semibold">›</span> para ver os produtos carregados na carreta
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-slate-400 font-mono text-[11px] px-2">
            Página <span className="text-white font-medium tabular-nums">{currentPage}</span> de{' '}
            <span className="text-white font-medium tabular-nums">{totalPages}</span>
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
