import { LogOut, User, Settings, Store, ShoppingBag, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import ProfileSetup from './ProfileSetup';

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { profile, signOut, activeRole, setActiveRole } = useAuth();
  const [showSetup, setShowSetup] = useState(false);

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Configuração</h1>
            <button onClick={() => setShowSetup(false)} className="text-gray-600 hover:text-gray-900 font-medium">
              Voltar
            </button>
          </div>
        </header>
        <ProfileSetup />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* 1. Logo */}
            {/* 1. Logo */}
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Feirinha Logo" className="h-10 w-auto object-contain" />
              <h1 className="text-2xl font-bold text-gray-900">Feirinha</h1>
            </div>

            {/* 2. BOTÕES DE NAVEGAÇÃO (DIRETOS NO CÓDIGO) */}
            <div className="flex bg-gray-100 p-1 rounded-lg shadow-inner">
              <button
                onClick={() => setActiveRole('consumer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeRole === 'consumer' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Comprar
              </button>

              <button
                onClick={() => setActiveRole('seller')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeRole === 'seller' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Store className="w-4 h-4" />
                Vender
              </button>
              
              <button
                onClick={() => setActiveRole('supplier')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeRole === 'supplier' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                Fornecer
              </button>
            </div>

            {/* 3. Menu do Usuário */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <User className="w-4 h-4" />
                <span className="font-medium text-sm">{profile?.full_name}</span>
              </div>
              
              <button 
                onClick={() => setShowSetup(true)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full border border-transparent hover:border-gray-200 transition-all"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}