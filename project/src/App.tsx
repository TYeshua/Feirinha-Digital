import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext'; 
import Auth from './components/Auth';
import Layout from './components/Layout';
import ConsumerDashboard from './components/consumer/ConsumerDashboard';
import SellerDashboard from './components/seller/SellerDashboard';
import SupplierDashboard from './components/supplier/SupplierDashboard';
import ProfileSetup from './components/ProfileSetup';
import { LogOut, RefreshCw, UserPlus } from 'lucide-react'; // Importando ícones novos

function AppContent() {
  const { user, profile, activeRole, loading, signOut } = useAuth();

  // 1. Carregamento Inicial (Spinner Verde)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  // 2. Não logado -> Tela de Login
  if (!user) {
    return <Auth />;
  }

  // 3. CORREÇÃO DO LOOP: Logado mas sem Perfil (Erro de Conexão ou Cadastro Incompleto)
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Incompleto</h2>
          <p className="text-gray-600 mb-6">
            Encontramos sua conta, mas seus dados de perfil não foram carregados corretamente.
          </p>

          <div className="flex flex-col gap-3">
            {/* Botão para recarregar a página (Tentar de novo) */}
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Tentar Carregar Novamente
            </button>

            {/* Botão de Sair (Emergência) */}
            <button 
              onClick={signOut}
              className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair e Entrar com Outra Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Verificação de Permissões (Fluxo normal)
  const hasRequiredProfile =
    (activeRole === 'consumer' && profile.is_consumer) ||
    (activeRole === 'seller' && profile.is_seller) ||
    (activeRole === 'supplier' && profile.is_supplier);

  if (!hasRequiredProfile) {
    return (
      <Layout>
        <ProfileSetup />
      </Layout>
    );
  }

  // 5. Painéis Principais
  return (
    <Layout>
      {activeRole === 'consumer' && <ConsumerDashboard />}
      {activeRole === 'seller' && <SellerDashboard />}
      {activeRole === 'supplier' && <SupplierDashboard />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;