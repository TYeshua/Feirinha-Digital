import { useState } from 'react';
import { X, CreditCard, MapPin, Loader2, Banknote, QrCode, ShoppingBag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CartItem } from '../../lib/types';
import { toast } from 'sonner';

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'cash'>('card');
  const [loading, setLoading] = useState(false);

  const handleConfirmOrder = async () => {
    if (!user || cart.length === 0) return;

    if (!address.trim()) {
      toast.error("Por favor, informe o endereço de entrega.");
      return;
    }

    setLoading(true);

    // 1. Agrupa os itens do carrinho por vendedor
    const ordersBySeller = new Map<string, CartItem[]>();
    for (const item of cart) {
      const sellerId = item.product.seller_id;
      if (!sellerId) {
        console.error("Produto sem seller_id!", item.product);
        continue;
      }
      
      if (!ordersBySeller.has(sellerId)) {
        ordersBySeller.set(sellerId, []);
      }
      ordersBySeller.get(sellerId)!.push(item);
    }

    try {
      // 2. Cria um pedido para cada vendedor
      for (const [sellerId, items] of ordersBySeller.entries()) {
        
        const sellerTotal = items.reduce(
          (sum, item) => sum + item.product.price_per_unit * item.quantity,
          0
        );

        // 3. Insere na tabela 'orders'
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: user.id,
            seller_id: sellerId,
            total_price: sellerTotal,
            status: 'Pendente',
            shipping_address: address,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // 4. Prepara os itens para a tabela 'order_items'
        const orderItemsData = items.map(item => ({
          order_id: orderData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price_at_purchase: item.product.price_per_unit,
        }));

        // 5. Insere todos os itens de uma vez
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

        if (itemsError) throw itemsError;
      }

      // 6. Sucesso
      toast.success('Pedido realizado com sucesso!');
      clearCart();
      setLoading(false);
      onClose();

    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error.message);
      toast.error('Erro ao finalizar pedido: ' + error.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h2>
            <p className="text-gray-500 text-sm mt-1">Revise seus itens e escolha a forma de pagamento</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* 1. Resumo do Pedido */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-green-600" />
              Resumo da Sacola
            </h3>
            <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {cart.map(item => (
                  <div key={item.product.id} className="flex gap-4 p-4 hover:bg-white transition-colors">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">🥬</span>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{item.product.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{item.product.seller_profiles.store_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {item.quantity}x
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          R$ {item.product.price_per_unit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        R$ {(item.product.price_per_unit * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Geral */}
              <div className="p-4 bg-white border-t border-gray-100 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Geral</span>
                <span className="text-2xl font-bold text-green-600">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </section>
          
          {/* 2. Endereço */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Endereço de Entrega
            </h3>
            <div className="relative">
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Rua, Número, Bairro, CEP e Complemento..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none min-h-[100px]"
              />
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            </div>
          </section>

          {/* 3. Pagamento */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Forma de Pagamento
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card: Crédito */}
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === 'card' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-green-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <CreditCard className="w-8 h-8" />
                <span className="font-semibold text-sm">Cartão de Crédito</span>
              </button>

              {/* Card: PIX */}
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === 'pix' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-green-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <QrCode className="w-8 h-8" />
                <span className="font-semibold text-sm">PIX</span>
              </button>

              {/* Card: Dinheiro */}
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                  paymentMethod === 'cash' 
                    ? 'border-green-500 bg-green-50 text-green-700' 
                    : 'border-gray-200 hover:border-green-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Banknote className="w-8 h-8" />
                <span className="font-semibold text-sm">Na Entrega</span>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleConfirmOrder}
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100 shadow-lg hover:shadow-green-500/30 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Confirmar Pedido
                <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-normal">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}