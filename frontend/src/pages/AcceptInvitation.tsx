import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Token de convite não encontrado na URL.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: any; message: string }>('/auth/accept-invitation', {
        token,
        password,
      });

      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Erro ao ativar conta. O convite pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-sky-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ativar sua Conta
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Você foi convidado para acessar a plataforma. Crie sua senha de acesso abaixo.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/60 sm:px-10">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Conta ativada com sucesso!</h3>
              <p className="text-sm text-slate-300">
                Redirecionando você para o sistema financeiro...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/70 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 shadow-lg shadow-purple-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <span>{loading ? 'Ativando Conta...' : 'Ativar Minha Conta e Entrar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-slate-400 hover:text-white transition">
                  Já possui conta ativa? Entrar
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
