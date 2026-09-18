import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Falha ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', { email: email.trim() });
      setSuccess(`Código de recuperação: ${res.resetToken || 'Enviado por e-mail'}`);
      setForgotStep(2);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        resetToken: resetCode.trim(),
        newPassword,
      });
      setSuccess('Senha redefinida com sucesso! Você já pode entrar.');
      setTab('login');
      setForgotStep(1);
    } catch (err: any) {
      setError(err.message || 'Código inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/20 mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Fluxo<span className="text-sky-400">Caixa</span>
        </h1>
        <p className="mt-1 text-sm text-slate-300">Sistema Completo de Gestão Financeira Pessoal</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-100">
          {/* Navigation Tabs */}
          {tab !== 'forgot' && (
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  tab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  tab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center space-x-2">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Senha</label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-xs font-medium text-sky-600 hover:text-sky-700"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-sky-600/25"
              >
                <span>{isLoading ? 'Entrando...' : 'Acessar Meu Painel'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu Nome"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Senha (Mínimo 6 dígitos)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-600/25"
              >
                <span>{isLoading ? 'Criando Conta...' : 'Cadastrar e Começar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {tab === 'forgot' && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-xs text-sky-600 hover:underline font-semibold"
                >
                  ← Voltar para o Login
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-1">Recuperação de Senha</h3>
              <p className="text-xs text-slate-500 mb-4">
                {forgotStep === 1
                  ? 'Informe seu e-mail cadastrado para gerar o código de recuperação.'
                  : 'Informe o código recebido e defina sua nova senha.'}
              </p>

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Seu E-mail</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-600/20"
                  >
                    {isLoading ? 'Enviando...' : 'Gerar Código de Recuperação'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Código de 6 Dígitos</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={resetCode}
                        onChange={e => setResetCode(e.target.value)}
                        placeholder="Ex: 123456"
                        className="w-full pl-10 pr-3 py-2.5 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nova Senha</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
                  >
                    {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Security Badge */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Dados isolados e criptografados com segurança</span>
          </div>
        </div>
      </div>
    </div>
  );
};
