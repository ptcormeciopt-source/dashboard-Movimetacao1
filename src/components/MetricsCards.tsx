import React from 'react';
import { Layers, Database, BarChart3, CheckSquare, Clock, Truck, Package, Boxes, Users } from 'lucide-react';
import { TableDefinition, TableStats } from '../types/supabase';

interface MetricsCardsProps {
  definition: TableDefinition;
  stats: TableStats;
  tableName: string;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  definition,
  stats,
  tableName
}) => {
  const isExpedicao = tableName.includes('carregamento') || tableName.includes('expedicao') || (
    stats.numericStats['total_plt'] !== undefined || stats.numericStats['total_unidades'] !== undefined
  );

  // Logistics specific metrics
  if (isExpedicao) {
    const pltStats = stats.numericStats['total_plt'] || { sum: 0, avg: 0, min: 0, max: 0 };
    const pctStats = stats.numericStats['total_pct'] || { sum: 0, avg: 0, min: 0, max: 0 };
    const unidadesStats = stats.numericStats['total_unidades'] || { sum: 0, avg: 0, min: 0, max: 0 };
    const motoristas = stats.categoricalBreakdown['motorista'] || [];
    const placas = stats.categoricalBreakdown['placa'] || [];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
        {/* Total Carregamentos */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Carregamentos (Viagens)</span>
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {stats.totalRows.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-500 font-mono">expedições</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>Frota</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300">{placas.length} veículos ativos</span>
          </div>
        </div>

        {/* Total Paletes */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Paletes (PLT)</span>
            <Boxes className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-cyan-300">
              {pltStats.sum.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-500 font-mono">paletes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>Média</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300 tabular-nums">
              {(Math.round(pltStats.avg * 10) / 10).toLocaleString('pt-BR')} PLT / viagem
            </span>
          </div>
        </div>

        {/* Total Pacotes */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total Pacotes (PCT)</span>
            <Package className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-300">
              {pctStats.sum.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-500 font-mono">pacotes</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>Média</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300 tabular-nums">
              {Math.round(pctStats.avg).toLocaleString('pt-BR')} PCT / viagem
            </span>
          </div>
        </div>

        {/* Total Unidades */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Unidades Expedidas</span>
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {unidadesStats.sum.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-slate-500 font-mono">itens</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>Média</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300 tabular-nums">
              {Math.round(unidadesStats.avg).toLocaleString('pt-BR')} unidades / viagem
            </span>
          </div>
        </div>

        {/* Motoristas Ativos */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Motoristas Operando</span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {motoristas.length}
            </span>
            <span className="text-xs text-slate-500 font-mono">motoristas</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
            <span>Top</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300 truncate">
              {motoristas[0] ? `${motoristas[0].label} (${motoristas[0].count})` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Generic fallback for other tables
  const numStatKeys = Object.keys(stats.numericStats);
  const primaryNumCol = numStatKeys.find(k => k.includes('valor') || k.includes('preco') || k.includes('total')) || numStatKeys[0];
  const primaryNumData = primaryNumCol ? stats.numericStats[primaryNumCol] : null;

  const formatNumber = (num: number, isCurrency = false) => {
    if (isCurrency) {
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return num.toLocaleString('pt-BR');
  };

  const avgCompleteness = stats.columnCompleteness.length > 0
    ? Math.round(stats.columnCompleteness.reduce((acc, c) => acc + c.percentage, 0) / stats.columnCompleteness.length)
    : 100;

  const topCatKey = Object.keys(stats.categoricalBreakdown)[0];
  const topCategory = topCatKey && stats.categoricalBreakdown[topCatKey]?.length > 0
    ? stats.categoricalBreakdown[topCatKey][0]
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
      {/* Total Rows */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Total de Linhas</span>
          <Layers className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">
            {stats.totalRows.toLocaleString('pt-BR')}
          </span>
          <span className="text-xs text-slate-500 font-mono">registros</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
          <span>Tabela</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-slate-400">{tableName}</span>
        </div>
      </div>

      {/* Columns & Schema */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Estrutura de Colunas</span>
          <Database className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-white">
            {stats.columnCount}
          </span>
          <span className="text-xs text-slate-500 font-mono">campos</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
          <span>Chave Primária</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-emerald-400">{definition.primaryKey || 'id'}</span>
        </div>
      </div>

      {/* Numerical Volume or Top Sum */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="truncate">
            {primaryNumCol ? `Volume (${primaryNumCol})` : 'Integridade dos Dados'}
          </span>
          <BarChart3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </div>
        {primaryNumData ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400 truncate">
                {formatNumber(primaryNumData.sum, primaryNumCol.includes('valor') || primaryNumCol.includes('preco'))}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
              <span>Média</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-400">
                {formatNumber(Math.round(primaryNumData.avg * 100) / 100, primaryNumCol.includes('valor') || primaryNumCol.includes('preco'))}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-cyan-400">
                {avgCompleteness}%
              </span>
              <span className="text-xs text-slate-500 font-mono">preenchido</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Sem valores nulos</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-400">{stats.columnCompleteness.filter(c => c.percentage === 100).length} colunas</span>
            </div>
          </>
        )}
      </div>

      {/* Top Category or Timeline activity */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span className="truncate">
            {topCatKey ? `Predominância (${topCatKey})` : 'Última Atividade'}
          </span>
          {topCatKey ? <CheckSquare className="w-3.5 h-3.5 text-slate-500" /> : <Clock className="w-3.5 h-3.5 text-slate-500" />}
        </div>
        {topCategory ? (
          <>
            <div className="flex items-baseline gap-2 truncate">
              <span className="text-2xl font-bold font-mono tabular-nums text-white truncate">
                {topCategory.label}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-slate-300">{topCategory.count} ocorrências</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-emerald-400">{topCategory.percentage}% do total</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {stats.timelineActivity.length}
              </span>
              <span className="text-xs text-slate-500 font-mono">dias com registros</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Status</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">Ativo</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
