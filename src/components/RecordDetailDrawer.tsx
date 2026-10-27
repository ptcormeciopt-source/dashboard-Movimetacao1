import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Code, Package, Truck, User, Calendar, Hash, Layers, Box, CheckCircle2, Loader2 } from 'lucide-react';
import { ColumnDefinition, TableDefinition, CarregamentoProduto } from '../types/supabase';
import { supabaseService } from '../services/supabaseService';

interface RecordDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: any | null;
  definition: TableDefinition;
  columns: ColumnDefinition[];
  cachedProdutos?: CarregamentoProduto[];
}

export const RecordDetailDrawer: React.FC<RecordDetailDrawerProps> = ({
  isOpen,
  onClose,
  record,
  definition,
  columns,
  cachedProdutos
}) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [produtos, setProdutos] = useState<CarregamentoProduto[]>(cachedProdutos || []);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);

  const primaryKey = definition.primaryKey || 'movimentacao_id';
  const recordId = record ? record[primaryKey] : null;

  useEffect(() => {
    if (!isOpen || !recordId) return;

    if (cachedProdutos && cachedProdutos.length > 0) {
      setProdutos(cachedProdutos);
      return;
    }

    let isMounted = true;
    setIsLoadingProdutos(true);

    supabaseService
      .getProdutosByMovimentacao(recordId)
      .then((items) => {
        if (isMounted) {
          setProdutos(items);
        }
      })
      .catch((err) => {
        console.error('Failed to load items in drawer:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProdutos(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, recordId, cachedProdutos]);

  if (!isOpen || !record) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyManifest = () => {
    if (produtos.length === 0) return;
    const lines = [
      `MANIFESTO DE EXPEDIÇÃO - CARRETA ${record.placa || ''}`,
      `Motorista: ${record.motorista || ''}`,
      `Data: ${record.data_criacao ? new Date(record.data_criacao).toLocaleString('pt-BR') : ''}`,
      `ID Movimentação: ${recordId}`,
      '----------------------------------------',
      'PRODUTO | LOTE | PALETES | PACOTES | TOTAL UNIDADES',
      ...produtos.map(
        (p) =>
          `${p.produto || 'Item'} | Lote: ${p.lote ?? '-'} | ${p.qtd_Plt} PLT | ${p.qtd_pct} PCT | ${p.somatotalproduto.toLocaleString('pt-BR')} un`
      ),
      '----------------------------------------',
      `TOTAIS: ${totalPaletes} PLT | ${totalPacotes} PCT | ${totalUnidades.toLocaleString('pt-BR')} un`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  // Aggregated sums from the loaded products
  const totalPaletes = produtos.reduce((acc, p) => acc + (Number(p.qtd_Plt) || 0), 0);
  const totalPacotes = produtos.reduce((acc, p) => acc + (Number(p.qtd_pct) || 0), 0);
  const totalUnidades = produtos.reduce((acc, p) => acc + (Number(p.somatotalproduto) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#090e1a] border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d1424]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded">
                  {record.placa || 'Sem Placa'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Movimentação #{recordId}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-slate-400">
                  <User className="w-3 h-3 text-purple-400" />
                  <strong className="text-white">{record.motorista || 'Não informado'}</strong>
                </span>
                {record.data_criacao && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      {new Date(record.data_criacao).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(record.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyManifest}
              disabled={produtos.length === 0}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors disabled:opacity-40"
              title="Copiar manifesto dos produtos da carreta"
            >
              {copiedManifest ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Manifesto</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section: Loaded Products in this Carreta */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  O que está carregado nesta carreta
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                Tabela: public.produtos
              </span>
            </div>

            {/* Metrics Ribbon for this specific carreta */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  Paletes Carregados
                </span>
                <span className="text-lg font-bold font-mono text-cyan-300 mt-1 tabular-nums">
                  {totalPaletes.toLocaleString('pt-BR')}{' '}
                  <span className="text-xs font-normal text-slate-500">PLT</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Box className="w-3 h-3 text-amber-400" />
                  Pacotes Carregados
                </span>
                <span className="text-lg font-bold font-mono text-amber-300 mt-1 tabular-nums">
                  {totalPacotes.toLocaleString('pt-BR')}{' '}
                  <span className="text-xs font-normal text-slate-500">PCT</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Total de Unidades
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                  {totalUnidades.toLocaleString('pt-BR')}{' '}
                  <span className="text-xs font-normal text-emerald-500/70">un</span>
                </span>
              </div>
            </div>

            {/* Products Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-inner">
              {isLoadingProdutos ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-xs font-mono">Buscando produtos carregados na carreta...</span>
                </div>
              ) : produtos.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Nenhum item individual encontrado na tabela <code className="text-emerald-400 font-mono">produtos</code> para o <code className="font-mono">id_item = {recordId}</code>.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0d1424] text-slate-400 font-medium select-none">
                      <th className="py-2.5 px-3 w-10 text-center font-mono text-slate-600">#</th>
                      <th className="py-2.5 px-3 text-slate-200">Produto Carregado</th>
                      <th className="py-2.5 px-3 text-center">Lote</th>
                      <th className="py-2.5 px-3 text-right">Qtd Paletes</th>
                      <th className="py-2.5 px-3 text-right">Qtd Pacotes</th>
                      <th className="py-2.5 px-3 text-right text-emerald-300">Total Unidades</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {produtos.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
                              <Package className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-white text-xs">
                              {p.produto || 'Produto sem descrição'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {p.lote !== null && p.lote !== undefined ? (
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                              Lote {p.lote}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-cyan-300 font-semibold">
                          {p.qtd_Plt.toLocaleString('pt-BR')}{' '}
                          <span className="text-[10px] text-slate-500 font-normal">PLT</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-300 font-semibold">
                          {p.qtd_pct.toLocaleString('pt-BR')}{' '}
                          <span className="text-[10px] text-slate-500 font-normal">PCT</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400 font-bold">
                          {p.somatotalproduto.toLocaleString('pt-BR')}{' '}
                          <span className="text-[10px] text-emerald-500/70 font-normal">un</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {produtos.length > 1 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-700 bg-slate-950/80 font-semibold text-xs">
                        <td colSpan={3} className="py-2.5 px-3 text-right text-slate-300 font-medium">
                          Total Geral da Carga:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-cyan-300">
                          {totalPaletes.toLocaleString('pt-BR')} <span className="text-[10px] font-normal">PLT</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                          {totalPacotes.toLocaleString('pt-BR')} <span className="text-[10px] font-normal">PCT</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          {totalUnidades.toLocaleString('pt-BR')} <span className="text-[10px] font-normal">un</span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </div>
          </div>

          {/* Section: Movement Overview Fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Dados da Movimentação (view_carregamento_expedicao)
            </h4>
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
              {columns.map((col) => {
                const val = record[col.name];
                return (
                  <div key={col.name} className="px-4 py-2.5 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-medium text-slate-300">{col.name}</span>
                        {col.isPrimaryKey && (
                          <span className="text-[10px] text-emerald-400 font-mono px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-800/50">
                            PK
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{col.type}</span>
                    </div>

                    <div className="text-right max-w-[280px] truncate">
                      {val === null || val === undefined ? (
                        <span className="text-slate-600 text-xs italic">null</span>
                      ) : col.name === 'data_criacao' ? (
                        <span className="text-xs font-mono tabular-nums text-slate-300">
                          {new Date(val).toLocaleDateString('pt-BR')} {new Date(val).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-xs font-mono tabular-nums text-slate-200">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Raw JSON viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Code className="w-3.5 h-3.5" />
                <span>Objeto JSON da Linha</span>
              </div>
              <button
                onClick={handleCopyJson}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded border border-slate-800 transition-colors"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-56">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
