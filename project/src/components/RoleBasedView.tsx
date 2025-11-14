import { useAuth } from '../contexts/AuthContext';
import ProductList from './consumer/ProductList';
import SellerDashboard from './seller/SellerDashboard';
import SupplierDashboard from './supplier/SupplierDashboard'; // Vamos criar um placeholder para este
import ProfileSetup from './ProfileSetup';

export default function RoleBasedView() {
  const { profile, activeRole } = useAuth();

  // Caso especial: se o usuário ainda não ativou perfis (ex: Vendedor)
  // podemos mostrar a tela de setup.
  // Você pode remover isso se quiser que o "consumer" seja o padrão.
  if (!profile?.is_seller && !profile?.is_supplier && activeRole !== 'consumer') {
    return <ProfileSetup />;
  }

  // O 'switch' que faz a mágica de trocar a tela
  switch (activeRole) {
    case 'consumer':
      return <ProductList />;
    case 'seller':
      return <SellerDashboard />;
    case 'supplier':
      return <SupplierDashboard />;
    default:
      // Caso padrão, mostra o painel do consumidor
      return <ProductList />;
  }
}