import React from 'react';
import { BarChart3, PieChart, Activity, CheckCircle, Calculator } from 'lucide-react';
import { TableDefinition, TableStats } from '../types/supabase';

interface AnalyticsViewProps {
  definition: TableDefinition;
  stats: TableStats;
  tableName: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  definition,
  stats,
  tableName
}) => {
  const maxTimelineCount = Math.max(...stats.timelineActivity.map(t => t.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Análise Estatística da Tabela</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas calculadas dinamicamente sobre {stats.totalRows} registros da tabela <code className="text-emerald-400">{tableName}</code>
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div>
            Colunas: <span className="text-white font-semibold tabular-nums">{stats.columnCount}</span>
          </div>
          <span aria-hidden="true">·</span>
          <div>
            Linhas: <span className="text-white font-semibold tabular-nums">{stats.totalRows}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline / Activity Chart */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Volume de Registros por Data
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Histórico</span>
          </div>

          {stats.timelineActivity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8 text-xs text-slate-500 italic">
              Nenhuma coluna de data/timestamp identificada para gerar a linha do tempo.
            </div>
          ) : (
            <div className="space-y-3">
              {/* SVG bar chart */}
              <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 border-b border-slate-800">
                {stats.timelineActivity.map((item, idx) => {
                  const heightPercent = Math.max(12, Math.round((item.count / maxTimelineCount) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap z-10 transition-opacity pointer-events-none">
                        {item.date}: {item.count} reg.
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition-all group-hover:scale-y-105"
                      />
                      <span className="text-[10px] font-mono text-slate-500 rotate-45 origin-left truncate max-w-[40px] block mt-1">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
                <span>Total de dias mapeados: <strong className="text-white font-mono">{stats.timelineActivity.length}</strong></span>
                <span>Pico: <strong className="text-emerald-400 font-mono">{maxTimelineCount} registros</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Categorical Distribution Breakdown */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Distribuição por Categoria & Status
              </h4>
            </div>
          </div>

          {Object.keys(stats.categoricalBreakdown).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              Nenhuma coluna de categorias identificada para agregação.
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(stats.categoricalBreakdown).map(([colName, items]) => (
                <div key={colName} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-300 font-medium">{colName}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{items.length} variantes</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 truncate max-w-[200px]">{item.label}</span>
                          <span className="font-mono tabular-nums text-slate-400">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${item.percentage}%` }}
                            className="h-full bg-cyan-500/80 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column Health & Completeness */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Integridade & Preenchimento de Colunas
              </h4>
            </div>
          </div>

          <div className="space-y-3">
            {stats.columnCompleteness.map((col) => (
              <div key={col.column} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-slate-200">{col.column}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({col.type})</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                    {col.filledCount}/{stats.totalRows} ({col.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${col.percentage}%` }}
                    className={`h-full rounded-full ${
                      col.percentage === 100
                        ? 'bg-emerald-500'
                        : col.percentage > 70
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Numeric Stats */}
        <div className="p-5 rounded-xl bg-[#0d1424] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Agregados Numéricos (Soma, Média, Min, Max)
              </h4>
            </div>
          </div>

          {Object.keys(stats.numericStats).length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              Nenhuma coluna numérica encontrada nesta tabela.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.numericStats).map(([colName, metrics]) => {
                const isMonetary = colName.includes('valor') || colName.includes('preco');
                const fmt = (n: number) =>
                  isMonetary
                    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : n.toLocaleString('pt-BR');

                return (
                  <div key={colName} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2">
                    <div className="text-xs font-mono font-medium text-emerald-400">{colName}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Soma Total</div>
                        <div className="font-mono tabular-nums font-semibold text-white mt-0.5 truncate">
                          {fmt(metrics.sum)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Média</div>
                        <div className="font-mono tabular-nums font-semibold text-white mt-0.5 truncate">
                          {fmt(Math.round(metrics.avg * 100) / 100)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Mínimo</div>
                        <div className="font-mono tabular-nums text-slate-300 mt-0.5 truncate">
                          {fmt(metrics.min)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">Máximo</div>
                        <div className="font-mono tabular-nums text-slate-300 mt-0.5 truncate">
                          {fmt(metrics.max)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
