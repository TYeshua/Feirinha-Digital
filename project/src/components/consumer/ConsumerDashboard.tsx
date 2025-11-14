import { useState } from 'react';
import { Store, ShoppingBag } from 'lucide-react';
// Importa os dois componentes que ele vai alternar
// Corrigindo os caminhos para serem absolutos a partir de 'src/'
import ProductList from './ProductList';
import OrderHistory from './OrderHistory';

type View = 'store' | 'orders';

export default function ConsumerDashboard() {
  const [view, setView] = useState<View>('store');

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Botões de Abas */}
      <div className="mb-6 flex gap-2 bg-gray-100 p-1 rounded-lg max-w-md">
        <button
          onClick={() => setView('store')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            view === 'store' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Store className="w-5 h-5" />
          Loja
        </button>
        <button
          onClick={() => setView('orders')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            view === 'orders' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          Meus Pedidos
        </button>
      </div>

      {/* Renderização da Aba Ativa */}
      <div>
        {view === 'store' && <ProductList />}
        {view === 'orders' && <OrderHistory />}
      </div>
    </div>
  );
}