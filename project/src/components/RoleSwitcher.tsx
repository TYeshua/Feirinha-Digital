import { ShoppingBag, Store, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RoleSwitcher() {
  const { profile, activeRole, setActiveRole } = useAuth();

  if (!profile) return null;

  const roles = [
    { id: 'consumer' as const, label: 'Comprar', icon: ShoppingBag, enabled: profile.is_consumer },
    { id: 'seller' as const, label: 'Vender', icon: Store, enabled: profile.is_seller },
    { id: 'supplier' as const, label: 'Fornecedor', icon: Package, enabled: profile.is_supplier },
  ].filter(role => role.enabled);

  if (roles.length <= 1) return null;

  return (
    <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
      {roles.map(role => {
        const Icon = role.icon;
        return (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeRole === role.id
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {role.label}
          </button>
        );
      })}
    </div>
  );
}