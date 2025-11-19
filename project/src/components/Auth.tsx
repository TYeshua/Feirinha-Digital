import { useState } from 'react';
import { LogIn, UserPlus, Store, Package, ShoppingBag, ArrowRight, CheckCircle, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth, AppRole } from '../contexts/AuthContext';

type AuthView = 'landing' | 'login' | 'register';

export default function Auth() {
  const [view, setView] = useState<AuthView>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [role, setRole] = useState<AppRole>('consumer');
  const [storeOrCompanyName, setStoreOrCompanyName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (view === 'register') {
        await signUp(email, password, fullName, role, storeOrCompanyName, documentNumber);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setStoreOrCompanyName('');
    setDocumentNumber('');
    setRole('consumer');
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const handleViewChange = (newView: AuthView) => {
    resetForm();
    setView(newView);
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        {/* Header */}
        <header className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white">
              <span className="text-2xl">🥬</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Feirinha Digital</h1>
              <p className="text-xs text-green-600 font-medium">Produtos frescos direto do campo</p>
            </div>
          </div>
          {/* Removed Login/Register buttons from header as requested */}
        </header>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                <span className="text-lg">✨</span> 100% Frescos e Naturais
              </div>

              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Verduras e Frutas <br />
                <span className="text-green-600">Direto do Produtor</span>
              </h2>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Compre produtos frescos, saudáveis e selecionados com carinho.
                Entrega rápida e qualidade garantida para sua mesa.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleViewChange('register')}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-green-200"
                >
                  <UserPlus className="w-6 h-6" />
                  Criar Conta
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleViewChange('login')}
                  className="flex items-center justify-center gap-2 bg-white text-green-600 border-2 border-green-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition-all"
                >
                  <LogIn className="w-6 h-6" />
                  Fazer Login
                </button>
              </div>

              <div className="flex gap-8 pt-8 border-t border-gray-100">
                <div>
                  <p className="text-3xl font-bold text-gray-900">100+</p>
                  <p className="text-gray-500">Produtos</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">1000+</p>
                  <p className="text-gray-500">Clientes</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">4.9★</p>
                  <p className="text-gray-500">Avaliação</p>
                </div>
              </div>
            </div>

            {/* Feature Cards (Right Side) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Compra Fácil</h3>
                <p className="text-gray-600">Navegue pelo catálogo, adicione ao carrinho e finalize em poucos cliques.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">100% Seguro</h3>
                <p className="text-gray-600">Pagamento protegido e garantia de qualidade em todas as suas compras.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-500 mb-4">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Entrega Rápida</h3>
                <p className="text-gray-600">Receba em casa com frete grátis e qualidade garantida.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        <button
          onClick={() => handleViewChange('landing')}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
          title="Voltar para o início"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <span className="text-3xl">🥬</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Feirinha Digital</h1>
          <p className="text-gray-600 mt-2">
            {view === 'register' ? "Crie sua conta" : "Acesse sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {view === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eu quero:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <RoleButton
                  icon={ShoppingBag}
                  label="Comprar"
                  isActive={role === 'consumer'}
                  onClick={() => setRole('consumer')}
                />
                <RoleButton
                  icon={Store}
                  label="Vender"
                  isActive={role === 'seller'}
                  onClick={() => setRole('seller')}
                />
                <RoleButton
                  icon={Package}
                  label="Fornecer"
                  isActive={role === 'supplier'}
                  onClick={() => setRole('supplier')}
                />
              </div>
            </div>
          )}

          {view === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
          )}

          {view === 'register' && role === 'seller' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Loja/Barraca
              </label>
              <input
                type="text"
                value={storeOrCompanyName}
                onChange={(e) => setStoreOrCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Frutas do João"
                required
              />
            </div>
          )}
          {view === 'register' && role === 'supplier' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={storeOrCompanyName}
                onChange={(e) => setStoreOrCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Distribuidora Verde"
                required
              />
            </div>
          )}

          {view === 'register' && (role === 'seller' || role === 'supplier') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF ou CNPJ
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Digite seu documento"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              'Processando...'
            ) : view === 'register' ? (
              <>
                <UserPlus className="w-5 h-5" />
                Criar Conta
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => handleViewChange(view === 'register' ? 'login' : 'register')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            {view === 'register' ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente de botão auxiliar para a seleção de perfil
function RoleButton({ icon: Icon, label, isActive, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${isActive
          ? 'border-green-500 bg-green-50 text-green-700'
          : 'border-gray-300 text-gray-500 hover:bg-gray-50'
        }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}