import { ShoppingBag, Store, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RoleSwitcher() {
  const { activeRole, setActiveRole } = useAuth();

  // Definimos as opções fixas, sem depender se o usuário "tem permissão" ou não.
  // Isso permite que ele clique para tentar acessar (e o sistema redireciona para o cadastro se precisar).
  const roles = [
    { id: 'consumer' as const, label: 'Comprar', icon: ShoppingBag },
    { id: 'seller' as const, label: 'Vender', icon: Store },
    // Fornecedor deixamos opcional/oculto se quiser, ou fixo também. 
    // Vou deixar fixo para facilitar seus testes.
    { id: 'supplier' as const, label: 'Fornecer', icon: Package },
  ];

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 shadow-inner border border-gray-200">
      {roles.map(role => {
        const Icon = role.icon;
        const isActive = activeRole === role.id;
        
        return (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-green-600' : ''}`} />
            <span className={isActive ? 'font-bold' : ''}>{role.label}</span>
          </button>
        );
      })}
    </div>
  );
}