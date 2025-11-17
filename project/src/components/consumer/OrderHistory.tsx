import { useState, useEffect } from 'react';
import { ShoppingBag, User, Clock, Star } from 'lucide-react';
// Corrigindo os caminhos de importação para relativos
import { supabase, Order } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Este tipo é similar ao do Vendedor, mas o join é com 'seller_profiles'
type OrderWithDetails = Order & {
  seller_profiles: { // O perfil do *vendedor*
    store_name: string;
  };
  order_items: Array<{ // Os itens do pedido
    quantity: number;
    price_at_purchase: number;
    products: { // O nome do produto
      name: string;
    };
  }>;
};

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderHistory();
  }, [user]);

  const loadOrderHistory = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Busca pedidos onde o 'customer_id' é o meu
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          seller_profiles ( store_name ),
          order_items (
            quantity,
            price_at_purchase,
            products ( name )
          )
        `)
        .eq('customer_id', user.id) // A mudança é aqui!
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setOrders(data as any);
      } else {
        setOrders([]); // Garante array vazio
      }
    } catch (error: any) {
      console.error("Erro ao carregar histórico de pedidos:", error.message || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Histórico vazio</h3>
          <p className="text-gray-600">Você ainda não fez nenhum pedido.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order: OrderWithDetails) => (
            <div key={order.id} className="border border-gray-200 rounded-lg">
              <div className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-gray-50 rounded-t-lg">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Pedido #{order.id.substring(0, 8)}...</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4" /> 
                    {/* PROTEÇÃO (v7): Optional Chaining para evitar crash se vendedor não existir */}
                    Vendedor: {order.seller_profiles?.store_name || 'Vendedor desconhecido'}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Data: {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right mt-2 md:mt-0">
                  <p className="font-bold text-2xl text-green-600">R$ {order.total_price.toFixed(2)}</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'Aprovado' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'Concluído' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="font-semibold mb-2">Itens:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {order.order_items.map((item: any, index: number) => (
                    <li key={index} className="text-sm text-gray-700">
                      {item.quantity}x {item.products?.name || 'Produto indisponível'}
                      <span className="text-gray-500"> (R$ {item.price_at_purchase.toFixed(2)} cada)</span>
                    </li>
                  ))}
                </ul>
                
                {/* 5.A. Botão de Avaliação (placeholder) */}
                {order.status === 'Concluído' && (
                  <div className="mt-4">
                    <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors">
                      <Star className="w-5 h-5" />
                      Avaliar Pedido
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}