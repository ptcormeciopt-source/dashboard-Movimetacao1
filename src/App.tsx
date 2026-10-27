/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { DataFilterBar } from './components/DataFilterBar';
import { DataTable } from './components/DataTable';
import { RecordDetailDrawer } from './components/RecordDetailDrawer';
import { AnalyticsView } from './components/AnalyticsView';
import { SchemaInspector } from './components/SchemaInspector';
import { ConnectionModal } from './components/ConnectionModal';
import { TableDefinition, FilterCondition, TableStats, SupabaseConfig, CarregamentoProduto } from './types/supabase';
import { supabaseService, DEFAULT_SUPABASE_URL } from './services/supabaseService';
import { AlertCircle, CheckCircle2, User, Truck, Calendar, X } from 'lucide-react';
import { DateRange, DateRangePicker } from './components/DateRangePicker';

export default function App() {
  // Supabase Configuration
  const [config, setConfig] = useState<SupabaseConfig>(() => supabaseService.getConfig());

  // Views: Data Table | Analytics & Charts | SQL Definition
  const [activeView, setActiveView] = useState<'data' | 'analytics' | 'schema'>('data');

  // Query & Data State for view_carregamento_expedicao
  const [tableData, setTableData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Products loaded in each truck (from public.produtos where id_item = movimentacao_id)
  const [productsMap, setProductsMap] = useState<Record<string, CarregamentoProduto[]>>({});
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedPlate, setSelectedPlate] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'movimentacao_id',
    'motorista',
    'placa',
    'data_criacao',
    'total_plt',
    'total_pct',
    'total_unidades'
  ]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [sortColumn, setSortColumn] = useState<string>('movimentacao_id');
  const [sortAscending, setSortAscending] = useState<boolean>(false);

  // Modals & Drawers
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [selectedRecordForDrawer, setSelectedRecordForDrawer] = useState<any | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);

  // Toast Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fixed definition for view_carregamento_expedicao
  const tableDefinition: TableDefinition = useMemo(() => ({
    name: 'view_carregamento_expedicao',
    comment: 'View analítica de expedição agrupada por movimentação, motorista, placa e data de carregamento',
    primaryKey: 'movimentacao_id',
    columns: [
      { name: 'movimentacao_id', type: 'integer', isPrimaryKey: true, required: true, description: 'ID da movimentação' },
      { name: 'motorista', type: 'string', required: true, description: 'Nome do motorista' },
      { name: 'placa', type: 'string', required: true, description: 'Placa do caminhão/veículo' },
      { name: 'data_criacao', type: 'timestamp', required: true, description: 'Data e hora do carregamento' },
      { name: 'total_plt', type: 'integer', required: true, description: 'Total de pallets expedidos (qtd_Plt)' },
      { name: 'total_pct', type: 'integer', required: true, description: 'Total de pacotes expedidos (qtd_pct)' },
      { name: 'total_unidades', type: 'integer', required: true, description: 'Total de unidades de produto (somatotalproduto)' }
    ]
  }), []);

  // Compute active filters combining driver, plate, calendar date range, and custom filters
  const effectiveFilters = useMemo(() => {
    const list: FilterCondition[] = [...filters];

    if (selectedDriver !== 'all') {
      list.push({ column: 'motorista', operator: 'ilike', value: selectedDriver });
    }

    if (selectedPlate !== 'all') {
      list.push({ column: 'placa', operator: 'ilike', value: selectedPlate });
    }

    // Explicit Calendar Date Range Filter
    if (dateRange.startDate) {
      list.push({
        column: 'data_criacao',
        operator: 'gte',
        value: `${dateRange.startDate}T00:00:00.000Z`
      });
    }

    if (dateRange.endDate) {
      list.push({
        column: 'data_criacao',
        operator: 'lte',
        value: `${dateRange.endDate}T23:59:59.999Z`
      });
    }

    return list;
  }, [filters, selectedDriver, selectedPlate, dateRange]);

  // Load table data from Supabase live
  const loadTableData = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await supabaseService.getTableData('view_carregamento_expedicao', {
        page: currentPage,
        pageSize,
        sortColumn,
        sortAscending,
        searchQuery,
        filters: effectiveFilters
      });

      setTableData(res.data);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error('Error fetching view_carregamento_expedicao:', err);
      showToast(err.message || 'Erro ao carregar dados de expedição', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, pageSize, sortColumn, sortAscending, searchQuery, effectiveFilters]);

  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  // Batch fetch products loaded for all currently visible carretas
  useEffect(() => {
    if (tableData.length === 0) {
      setProductsMap({});
      return;
    }

    const ids = tableData
      .map((r) => r.movimentacao_id)
      .filter((id) => id !== undefined && id !== null);

    if (ids.length === 0) return;

    setIsLoadingProducts(true);
    supabaseService
      .getBatchProdutos(ids)
      .then((map) => {
        setProductsMap(map);
      })
      .catch((err) => {
        console.error('Erro ao buscar produtos das carretas:', err);
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  }, [tableData]);

  // Compute stats on current loaded dataset
  const tableStats: TableStats = useMemo(() => {
    return supabaseService.computeStats('view_carregamento_expedicao', tableDefinition, tableData);
  }, [tableDefinition, tableData]);

  // Extract distinct drivers and plates dynamically for fast filter buttons
  const availableDrivers = useMemo(() => {
    const map = new Map<string, number>();
    tableData.forEach((row) => {
      const name = row.motorista ? String(row.motorista).trim() : '';
      if (name) {
        map.set(name, (map.get(name) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 8);
  }, [tableData]);

  const availablePlates = useMemo(() => {
    const set = new Set<string>();
    tableData.forEach((row) => {
      const p = row.placa ? String(row.placa).trim() : '';
      if (p) set.add(p);
    });
    return Array.from(set).slice(0, 8);
  }, [tableData]);

  // Handlers
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortAscending(!sortAscending);
    } else {
      setSortColumn(column);
      setSortAscending(true);
    }
    setCurrentPage(1);
  };

  const handleToggleColumn = (colName: string) => {
    setVisibleColumns((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  const handleAddFilter = (filter: FilterCondition) => {
    setFilters((prev) => [...prev, filter]);
    setCurrentPage(1);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
    setCurrentPage(1);
  };

  const handleSelectPeriod = (p: 'all' | 'today' | '7days' | '30days') => {
    setPeriodFilter(p);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (p === 'all') {
      setDateRange({ startDate: null, endDate: null });
    } else if (p === 'today') {
      setDateRange({ startDate: todayStr, endDate: todayStr });
    } else if (p === '7days') {
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setDateRange({ startDate: d7, endDate: todayStr });
    } else if (p === '30days') {
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setDateRange({ startDate: d30, endDate: todayStr });
    }
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setPeriodFilter('all');
    setCurrentPage(1);
  };

  const handleResetAllFilters = () => {
    setSelectedDriver('all');
    setSelectedPlate('all');
    setPeriodFilter('all');
    setDateRange({ startDate: null, endDate: null });
    setSearchQuery('');
    setFilters([]);
    setCurrentPage(1);
  };

  // Export handlers
  const handleExportCsv = () => {
    if (tableData.length === 0) {
      showToast('Não há dados para exportar', 'info');
      return;
    }
    const headers = visibleColumns.join(',');
    const rows = tableData.map((row) =>
      visibleColumns
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expedicao_carregamento_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório CSV de expedição baixado!');
  };

  const handleExportJson = () => {
    if (tableData.length === 0) {
      showToast('Não há dados para exportar', 'info');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tableData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `expedicao_carregamento_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Arquivo JSON baixado!');
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium ${
              toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : toast.type === 'info'
                ? 'bg-sky-950/90 border-sky-800 text-sky-200'
                : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        config={config}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onExportCsv={handleExportCsv}
        onRefresh={() => {
          setIsRefreshing(true);
          loadTableData();
        }}
        activeView={activeView}
        setActiveView={setActiveView}
        totalRecords={totalCount}
        isRefreshing={isRefreshing}
      />

      {/* Main Full-Width Content Container */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070b13]">
        <div className="max-w-[1600px] mx-auto space-y-4">
          {/* Logistics KPI Strip */}
          <MetricsCards
            definition={tableDefinition}
            stats={tableStats}
            tableName="view_carregamento_expedicao"
          />

          {/* Table Data View */}
          {activeView === 'data' && (
            <div className="space-y-3">
              {/* Quick Logistics Filter Strip (Drivers & Periods) */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                {/* Row 1: Fast Driver Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <User className="w-3.5 h-3.5 text-purple-400" />
                      <span>Motorista:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedDriver('all');
                          setCurrentPage(1);
                        }}
                        className={`px-2.5 py-1 text-xs rounded transition-colors ${
                          selectedDriver === 'all'
                            ? 'bg-purple-600 text-white font-medium shadow-xs'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        Todos os Motoristas
                      </button>
                      {availableDrivers.map((driver) => (
                        <button
                          key={driver}
                          onClick={() => {
                            setSelectedDriver(driver);
                            setCurrentPage(1);
                          }}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            selectedDriver === driver
                              ? 'bg-purple-600 text-white font-medium shadow-xs'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {driver}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Period Filter */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Período:</span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      {[
                        { id: 'all', label: 'Tudo' },
                        { id: 'today', label: 'Hoje' },
                        { id: '7days', label: '7 Dias' },
                        { id: '30days', label: '30 Dias' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPeriod(p.id as any)}
                          className={`px-2 py-0.5 text-xs rounded transition-colors ${
                            periodFilter === p.id
                              ? 'bg-slate-800 text-white font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {dateRange.startDate && (
                      <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                        <span>📅 {dateRange.startDate}{dateRange.endDate && dateRange.endDate !== dateRange.startDate ? ` → ${dateRange.endDate}` : ''}</span>
                        <button
                          onClick={() => handleDateRangeChange({ startDate: null, endDate: null })}
                          className="hover:text-rose-300 p-0.5"
                          title="Remover filtro de data"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Plates Quick Selector if any */}
                {availablePlates.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Placas Recentes:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {availablePlates.map((plate) => (
                        <button
                          key={plate}
                          onClick={() => {
                            if (selectedPlate === plate) {
                              setSelectedPlate('all');
                            } else {
                              setSelectedPlate(plate);
                            }
                            setCurrentPage(1);
                          }}
                          className={`font-mono px-2 py-0.5 text-[11px] rounded transition-colors border ${
                            selectedPlate === plate
                              ? 'bg-emerald-600 border-emerald-500 text-white font-semibold'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {plate}
                        </button>
                      ))}
                      {(selectedDriver !== 'all' || selectedPlate !== 'all' || periodFilter !== 'all' || dateRange.startDate || searchQuery || filters.length > 0) && (
                        <button
                          onClick={handleResetAllFilters}
                          className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 ml-2"
                        >
                          <X className="w-3 h-3" />
                          <span>Limpar Filtros</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Filter Bar (Search, Calendar picker, Column filter, Export, Page size) */}
              <DataFilterBar
                columns={tableDefinition.columns}
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                  setSearchQuery(q);
                  setCurrentPage(1);
                }}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                filters={filters}
                onAddFilter={handleAddFilter}
                onRemoveFilter={handleRemoveFilter}
                visibleColumns={visibleColumns}
                onToggleColumn={handleToggleColumn}
                onExportCsv={handleExportCsv}
                onExportJson={handleExportJson}
                pageSize={pageSize}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
              />

              {/* High-Density Data Table */}
              <DataTable
                definition={tableDefinition}
                columns={tableDefinition.columns}
                visibleColumns={visibleColumns}
                data={tableData}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                sortColumn={sortColumn}
                sortAscending={sortAscending}
                onSort={handleSort}
                isLoading={isLoading}
                onViewRecord={(row) => {
                  setSelectedRecordForDrawer(row);
                  setIsDetailDrawerOpen(true);
                }}
                onResetFilters={handleResetAllFilters}
                productsMap={productsMap}
                isLoadingProducts={isLoadingProducts}
              />
            </div>
          )}

          {/* Analytics & Performance View */}
          {activeView === 'analytics' && (
            <AnalyticsView
              definition={tableDefinition}
              stats={tableStats}
              tableName="view_carregamento_expedicao"
            />
          )}

          {/* SQL Definition & API Code View */}
          {activeView === 'schema' && (
            <SchemaInspector
              definition={tableDefinition}
              supabaseUrl={config.url || DEFAULT_SUPABASE_URL}
            />
          )}
        </div>
      </main>

      {/* Connection Manager Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          supabaseService.saveConfig(newConfig);
          setConfig(newConfig);
          showToast('Configuração salva com sucesso!');
        }}
        onRefreshData={() => {
          loadTableData();
        }}
      />

      {/* Record Details Slide-over Drawer with Truck Cargo Manifest */}
      <RecordDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        record={selectedRecordForDrawer}
        definition={tableDefinition}
        columns={tableDefinition.columns}
        cachedProdutos={
          selectedRecordForDrawer && selectedRecordForDrawer.movimentacao_id !== undefined
            ? productsMap[String(selectedRecordForDrawer.movimentacao_id)]
            : undefined
        }
      />
    </div>
  );
}
