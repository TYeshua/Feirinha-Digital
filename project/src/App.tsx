// Corrigindo os caminhos: Adicionando "./" para indicar que são arquivos locais
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext'; 
import Auth from './components/Auth';
import Layout from './components/Layout';
import ConsumerDashboard from './components/consumer/ConsumerDashboard';
import SellerDashboard from './components/seller/SellerDashboard';
import SupplierDashboard from './components/supplier/SupplierDashboard';
import ProfileSetup from './components/ProfileSetup';

function AppContent() {
  const { user, profile, activeRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!profile) {
    // Se não há perfil, pode ser um usuário recém-cadastrado
    // ou um estado de carregamento. O Auth deve lidar com isso,
    // mas por segurança, redirecionamos para o Auth.
    return <Auth />; 
  }

  const hasRequiredProfile =
    (activeRole === 'consumer' && profile.is_consumer) ||
    (activeRole === 'seller' && profile.is_seller) ||
    (activeRole === 'supplier' && profile.is_supplier);

  if (!hasRequiredProfile) {
    // Se o perfil ativo não está habilitado, mostra o Setup
    return (
      <Layout>
        <ProfileSetup />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* 2. Mostra o painel correto baseado no activeRole */}
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

// 3. Esta é a linha que faltava
export default App;