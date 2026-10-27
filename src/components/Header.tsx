import React from 'react';
import { Download, RefreshCw, Truck } from 'lucide-react';
import { SupabaseConfig } from '../types/supabase';

interface HeaderProps {
  config?: SupabaseConfig;
  onOpenConnectionModal?: () => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  activeView: 'data' | 'analytics' | 'schema';
  setActiveView: (view: 'data' | 'analytics' | 'schema') => void;
  totalRecords?: number;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onExportCsv,
  onRefresh,
  activeView,
  setActiveView,
  isRefreshing
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0c111c] sticky top-0 z-30">
      <div className="flex items-center justify-between gap-8 px-6 py-3.5 max-w-[1700px] mx-auto">
        {/* Zone 1: Brand title & View identifier */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
                Carregamento & Expedição
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation views */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800/80">
          <button
            onClick={() => setActiveView('data')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeView === 'data'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Expedições (Tabela)
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeView === 'analytics'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Métricas & Gráficos
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors disabled:opacity-50"
            title="Recarregar dados do Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
