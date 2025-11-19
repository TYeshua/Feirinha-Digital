import { useState } from 'react';
import { Store, ShoppingBag, ShoppingCart } from 'lucide-react';
import ProductList from './ProductList';
import OrderHistory from './OrderHistory';
import CheckoutModal from './CheckoutModal';
import { useCart } from '../../contexts/CartContext';

type View = 'store' | 'orders';

export default function ConsumerDashboard() {
  const [view, setView] = useState<View>('store');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { cartItemCount } = useCart();

  return (
    <div className="max-w-7xl mx-auto p-6 relative">
      {/* Header com Abas e Carrinho */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Botões de Abas */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-full max-w-md">
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

        {/* Botão da Sacola */}
        <button
          onClick={() => setIsCheckoutOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 hover:scale-105 transition-all active:scale-95"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Minha Sacola</span>
          {cartItemCount > 0 && (
            <span className="bg-white text-green-700 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Renderização da Aba Ativa */}
      <div>
        {view === 'store' && <ProductList />}
        {view === 'orders' && <OrderHistory />}
      </div>

      {/* Modal de Checkout */}
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />
    </div>
  );
}