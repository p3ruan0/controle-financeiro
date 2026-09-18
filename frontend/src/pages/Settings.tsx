import React, { useState } from 'react';
import { User, Lock, Sparkles, Trash2, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [demoMsg, setDemoMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setProfileError('A nova senha e a confirmação não conferem.');
        return;
      }
      if (newPassword.length < 6) {
        setProfileError('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setIsLoadingProfile(true);
    try {
      const res = await api.put<{ message: string; user: any }>('/auth/profile', {
        name,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      updateUser(res.user);
      setProfileMsg('Perfil e credenciais atualizados com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setProfileError(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleLoadDemo = async () => {
    if (window.confirm('Carregar dados de demonstração completos? Isso criará receitas, gastos fixos, despesas do mês e contas a receber de teste para você explorar todos os recursos do sistema.')) {
      setIsDemoLoading(true);
      setDemoMsg('');
      try {
        const res = await api.post<{ message: string }>('/demo/load');
        setDemoMsg(res.message);
      } catch (err: any) {
        alert('Erro ao carregar dados de demonstração.');
      } finally {
        setIsDemoLoading(false);
      }
    }
  };

  const handleClearData = async () => {
    if (window.confirm('ATENÇÃO: Deseja realmente limpar todos os seus lançamentos, contas a pagar e a receber? Esta ação não pode ser desfeita.')) {
      setIsDemoLoading(true);
      setDemoMsg('');
      try {
        const res = await api.post<{ message: string }>('/demo/clear');
        setDemoMsg(res.message);
      } catch (err: any) {
        alert('Erro ao limpar dados.');
      } finally {
        setIsDemoLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Configurações do Sistema</h1>
        <p className="text-xs text-slate-500">Gerencie seu perfil, segurança e dados da conta</p>
      </div>

      {demoMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{demoMsg}</span>
        </div>
      )}

      {/* Profile & Security Form */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-sky-600" />
          <span>Dados Pessoais & Senha</span>
        </h2>
        <p className="text-xs text-slate-400 mb-6">Mantenha seus dados e senha de acesso sempre atualizados</p>

        {profileMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
            {profileMsg}
          </div>
        )}

        {profileError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
            {profileError}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Cadastrado</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">O e-mail é a chave única da sua conta.</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Alterar Senha de Acesso</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Senha Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 dígitos"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoadingProfile}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              {isLoadingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* DEMO DATA & RESET AREA */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-indigo-600" />
            <span>Dados de Demonstração & Gerenciamento</span>
          </h2>
          <p className="text-xs text-slate-400">
            Você pode popular sua conta instantaneamente com dados de exemplo para testar todos os gráficos e relatórios
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Load demo */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Carregar Dados de Exemplo</span>
              </h3>
              <p className="text-xs text-indigo-800/80 mt-1 leading-relaxed">
                Cria salários, freelas, despesas fixas (aluguel, condomínio, internet), gastos do dia a dia e devedores para você ver o sistema 100% ativo.
              </p>
            </div>
            <button
              onClick={handleLoadDemo}
              disabled={isDemoLoading}
              className="mt-4 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              {isDemoLoading ? 'Processando...' : 'Popular com Dados de Teste'}
            </button>
          </div>

          {/* Clear data */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Limpar Lançamentos</span>
              </h3>
              <p className="text-xs text-rose-800/80 mt-1 leading-relaxed">
                Remove todos os lançamentos e contas de teste para você começar seus registros pessoais com o painel limpo.
              </p>
            </div>
            <button
              onClick={handleClearData}
              disabled={isDemoLoading}
              className="mt-4 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              {isDemoLoading ? 'Processando...' : 'Zerar Todos os Lançamentos'}
            </button>
          </div>
        </div>
      </div>

      {/* System Security Info */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Sua conexão está protegida por criptografia e autenticação JWT.</span>
        </div>
        <span className="font-semibold text-slate-700">Brasil (BRL / R$)</span>
      </div>
    </div>
  );
};
