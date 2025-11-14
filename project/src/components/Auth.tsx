import { useState } from 'react';
import { LogIn, UserPlus, Store, Package, ShoppingBag } from 'lucide-react';
// Corrigindo o caminho de importação
import { useAuth, AppRole } from '../contexts/AuthContext';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // --- NOVOS ESTADOS ---
  const [role, setRole] = useState<AppRole>('consumer');
  const [storeOrCompanyName, setStoreOrCompanyName] = useState('');
  // 1. NOVO ESTADO PARA O DOCUMENTO
  const [documentNumber, setDocumentNumber] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // 2. Passa o documento para a função signUp
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

  // Limpa os campos extras ao trocar de modo
  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setStoreOrCompanyName('');
    // 3. Limpa o documento ao trocar
    setDocumentNumber('');
    setRole('consumer');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <span className="text-3xl">🥬</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">HortiFruti Market</h1>
          <p className="text-gray-600 mt-2">{isSignUp ? "Crie sua conta" : "Acesse sua conta"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignUp && (
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

          {isSignUp && (
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

          {isSignUp && role === 'seller' && (
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
          {isSignUp && role === 'supplier' && (
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

          {/* 4. NOVO CAMPO DE DOCUMENTO (CPF/CNPJ) */}
          {isSignUp && (role === 'seller' || role === 'supplier') && (
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
            ) : isSignUp ? (
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
            onClick={toggleMode}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
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
      className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all ${
        isActive
          ? 'border-green-500 bg-green-50 text-green-700'
          : 'border-gray-300 text-gray-500 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}