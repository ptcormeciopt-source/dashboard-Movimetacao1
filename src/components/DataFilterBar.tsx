import React, { useState } from 'react';
import { Search, Filter, Download, Columns, X, Plus } from 'lucide-react';
import { ColumnDefinition, FilterCondition } from '../types/supabase';
import { DateRangePicker, DateRange } from './DateRangePicker';

interface DataFilterBarProps {
  columns: ColumnDefinition[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  filters: FilterCondition[];
  onAddFilter: (filter: FilterCondition) => void;
  onRemoveFilter: (index: number) => void;
  visibleColumns: string[];
  onToggleColumn: (colName: string) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
}

export const DataFilterBar: React.FC<DataFilterBarProps> = ({
  columns,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  filters,
  onAddFilter,
  onRemoveFilter,
  visibleColumns,
  onToggleColumn,
  onExportCsv,
  onExportJson,
  pageSize,
  onPageSizeChange
}) => {
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // New filter form state
  const [selectedCol, setSelectedCol] = useState(columns[0]?.name || '');
  const [selectedOp, setSelectedOp] = useState<FilterCondition['operator']>('ilike');
  const [filterVal, setFilterVal] = useState('');

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCol) return;
    onAddFilter({
      column: selectedCol,
      operator: selectedOp,
      value: filterVal
    });
    setFilterVal('');
    setShowFilterBuilder(false);
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Primary Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input & Date Calendar Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar motorista, placa ou ID..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Interactive Date Range Calendar Picker */}
          <DateRangePicker
            dateRange={dateRange}
            onChange={onDateRangeChange}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Add Filter button */}
          <button
            onClick={() => setShowFilterBuilder(!showFilterBuilder)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              filters.length > 0 || showFilterBuilder
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Mais Filtros {filters.length > 0 ? `(${filters.length})` : ''}</span>
          </button>

          {/* Columns Visibility dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Colunas</span>
            </button>

            {showColumnPicker && (
              <div className="absolute right-0 mt-1.5 w-56 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-2 z-20">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Exibir Colunas
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                  {columns.map((col) => {
                    const isVisible = visibleColumns.includes(col.name);
                    return (
                      <label
                        key={col.name}
                        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-slate-300 hover:bg-slate-800/60 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => onToggleColumn(col.name)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span className="font-mono truncate">{col.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-1 z-20">
                <button
                  onClick={() => {
                    onExportCsv();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors"
                >
                  Exportar como CSV
                </button>
                <button
                  onClick={() => {
                    onExportJson();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded transition-colors"
                >
                  Exportar como JSON
                </button>
              </div>
            )}
          </div>

          {/* Page size selector */}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-slate-700 font-mono"
          >
            <option value={10}>10 linhas</option>
            <option value={25}>25 linhas</option>
            <option value={50}>50 linhas</option>
            <option value={100}>100 linhas</option>
          </select>
        </div>
      </div>

      {/* Filter Builder row */}
      {showFilterBuilder && (
        <form onSubmit={handleApplyFilter} className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Onde</span>
          <select
            value={selectedCol}
            onChange={(e) => setSelectedCol(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1 font-mono text-xs"
          >
            {columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name} ({col.type})
              </option>
            ))}
          </select>

          <select
            value={selectedOp}
            onChange={(e) => setSelectedOp(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1 text-xs"
          >
            <option value="ilike">Contém (ilike)</option>
            <option value="eq">É igual a (=)</option>
            <option value="neq">Diferente de (!=)</option>
            <option value="gt">Maior que (&gt;)</option>
            <option value="gte">Maior ou igual (&gt;=)</option>
            <option value="lt">Menor que (&lt;)</option>
            <option value="lte">Menor ou igual (&lt;=)</option>
          </select>

          <input
            type="text"
            value={filterVal}
            onChange={(e) => setFilterVal(e.target.value)}
            placeholder="Valor..."
            className="flex-1 min-w-[140px] bg-slate-950 border border-slate-800 text-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-slate-700"
          />

          <button
            type="submit"
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aplicar</span>
          </button>
        </form>
      )}

      {/* Active Filter Tags */}
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 text-[11px]">Filtros adicionais:</span>
          {filters.map((f, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs"
            >
              <span className="font-mono text-emerald-400">{f.column}</span>
              <span className="text-slate-500">{f.operator}</span>
              <span className="font-medium text-white">"{f.value}"</span>
              <button
                onClick={() => onRemoveFilter(idx)}
                className="text-slate-500 hover:text-slate-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
