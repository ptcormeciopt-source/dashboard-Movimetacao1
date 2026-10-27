import React, { useState } from 'react';
import { X, KeyRound, ExternalLink, CheckCircle2, AlertCircle, Loader2, Sparkles, HelpCircle, Copy, Check, Terminal } from 'lucide-react';
import { SupabaseConfig } from '../types/supabase';
import { supabaseService, DEFAULT_SUPABASE_URL } from '../services/supabaseService';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SupabaseConfig;
  onSaveConfig: (newConfig: SupabaseConfig) => void;
  onRefreshData: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRefreshData
}) => {
  const [url, setUrl] = useState(config.url || DEFAULT_SUPABASE_URL);
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesFound?: string[] } | null>(null);
  const [copiedGrant, setCopiedGrant] = useState(false);

  if (!isOpen) return null;

  const grantSql = `grant select on public.view_carregamento_expedicao to anon, authenticated;`;

  const handleCopyGrant = () => {
    navigator.clipboard.writeText(grantSql);
    setCopiedGrant(true);
    setTimeout(() => setCopiedGrant(false), 2000);
  };

  const handleTest = async () => {
    if (!anonKey.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, insira a chave anon/public do Supabase para testar a conexão.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await supabaseService.testConnection(url, anonKey);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSaveLive = () => {
    const updated: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      isLive: true,
      lastConnected: new Date().toISOString()
    };
    onSaveConfig(updated);
    onClose();
    onRefreshData();
  };

  const handleUseDemo = () => {
    const updated: SupabaseConfig = {
      url: DEFAULT_SUPABASE_URL,
      anonKey: '',
      isLive: false
    };
    onSaveConfig(updated);
    onClose();
    onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c1220]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Conectar ao Banco Supabase</h3>
              <p className="text-xs text-slate-400 font-mono">vndgeizmqworbwwgyihl.supabase.co</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Step by step guide */}
          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>Como obter a chave de conexão em 3 passos:</span>
            </div>
            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
              <li>
                Acesse as configurações do seu projeto:{' '}
                <a
                  href="https://supabase.com/dashboard/project/vndgeizmqworbwwgyihl/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  Abrir Supabase API Keys <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Na seção <strong className="text-white">Project API keys</strong>, copie o token <strong className="text-emerald-400 font-mono">anon public</strong> (ou <strong className="text-amber-400 font-mono">service_role</strong>).
              </li>
              <li>Cole a chave no campo abaixo e clique em <strong className="text-white">Salvar e Conectar</strong>.</li>
            </ol>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              URL do Projeto Supabase
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://vndgeizmqworbwwgyihl.supabase.co"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Chave da API (anon / public ou service_role)
              </label>
              <a
                href="https://supabase.com/dashboard/project/vndgeizmqworbwwgyihl/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Copiar no Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <textarea
              rows={3}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="Cole aqui a chave anon/public (começa com eyJhbGciOi...)"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-700 resize-none"
            />
          </div>

          {/* View Permission Notice */}
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Terminal className="w-3 h-3 text-cyan-400" />
                Dica para a view_carregamento_expedicao:
              </span>
              <button
                type="button"
                onClick={handleCopyGrant}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                {copiedGrant ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedGrant ? 'Copiado!' : 'Copiar comando SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              No Supabase, Views criadas no schema <code className="text-white">public</code> precisam de permissão SELECT para a API pública. Caso sua view retorne vazia ou erro 403, execute no{' '}
              <a
                href="https://supabase.com/dashboard/project/vndgeizmqworbwwgyihl/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline"
              >
                SQL Editor do Supabase
              </a>:
            </p>
            <code className="block p-1.5 bg-slate-900 rounded font-mono text-[10px] text-emerald-300 truncate">
              {grantSql}
            </code>
          </div>

          {/* Test results banner */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="font-medium">{testResult.message}</div>
                {testResult.tablesFound && testResult.tablesFound.length > 0 && (
                  <div className="mt-1 text-[11px] text-emerald-400/80">
                    Tabelas/Views: {testResult.tablesFound.slice(0, 5).join(', ')}
                    {testResult.tablesFound.length > 5 ? ` e mais ${testResult.tablesFound.length - 5}...` : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleUseDemo}
            className="w-full sm:w-auto text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Manter Modo Demonstração</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !anonKey.trim()}
              className="text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 py-2 px-3.5 rounded-lg border border-slate-800 transition-colors flex items-center gap-1.5"
            >
              {isTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Testar</span>
            </button>

            <button
              type="button"
              onClick={handleSaveLive}
              disabled={!anonKey.trim()}
              className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 py-2 px-4 rounded-lg transition-colors font-semibold"
            >
              Salvar e Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
