import { useState } from 'react';
import { X, CreditCard, MapPin, Loader2 } from 'lucide-react';
// Corrigindo os caminhos de importação para serem relativos
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CartItem } from '../../lib/types';

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const handleConfirmOrder = async () => {
    if (!user || cart.length === 0) return;

    setLoading(true);

    // 1. Agrupa os itens do carrinho por vendedor
    // Assumindo que seu 'Product' tem 'seller_id'
    const ordersBySeller = new Map<string, CartItem[]>();
    for (const item of cart) {
      const sellerId = item.product.seller_id; // <- Você PRECISA ter 'seller_id' no seu produto
      if (!sellerId) {
        console.error("Produto sem seller_id!", item.product);
        continue; // Pula este item se não tiver vendedor
      }
      
      if (!ordersBySeller.has(sellerId)) {
        ordersBySeller.set(sellerId, []);
      }
      ordersBySeller.get(sellerId)!.push(item);
    }

    try {
      // 2. Cria um pedido para cada vendedor
      for (const [sellerId, items] of ordersBySeller.entries()) {
        
        // Calcula o total para este vendedor específico
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
            shipping_address: address, // Adiciona o endereço
          })
          .select() // Pede ao Supabase para retornar o registro criado
          .single(); // Esperamos apenas um

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

      // 6. Se tudo deu certo, limpa o carrinho e fecha
      alert('Pedido(s) realizado(s) com sucesso!');
      clearCart();
      setLoading(false);
      onClose();

    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error.message);
      alert('Erro ao finalizar pedido: ' + error.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* 1. Resumo do Pedido */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Resumo da Sacola</h3>
            <div className="space-y-2 rounded-lg border p-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{item.quantity}x {item.product.name}</span>
                    <p className="text-xs text-gray-600">{item.product.seller_profiles.store_name}</p>
                  </div>
                  <span className="font-medium">
                    R$ {(item.product.price_per_unit * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>R$ {cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* 2. Endereço */}
          <div>
            <label className="text-lg font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-700" />
              Endereço de Entrega
            </label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Digite seu endereço completo (Rua, Número, Bairro, CEP)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>

          {/* 3. Pagamento (Simplificado) */}
          <div>
            <label className="text-lg font-semibold mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-700" />
              Forma de Pagamento
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg has-[:checked]:bg-green-50 has-[:checked]:border-green-500">
                <input 
                  type="radio" 
                  name="payment" 
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-green-600" 
                />
                <span className="ml-3 font-medium">Cartão de Crédito</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg has-[:checked]:bg-green-50 has-[:checked]:border-green-500">
                <input 
                  type="radio" 
                  name="payment" 
                  value="pix"
                  checked={paymentMethod === 'pix'}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-green-600" 
                />
                <span className="ml-3 font-medium">PIX</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg has-[:checked]:bg-green-50 has-[:checked]:border-green-500">
                <input 
                  type="radio" 
                  name="payment" 
                  value="delivery"
                  checked={paymentMethod === 'delivery'}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-green-600" 
                />
                <span className="ml-3 font-medium">Pagar na Entrega</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-gray-50 border-t rounded-b-xl">
          <button
            onClick={handleConfirmOrder}
            disabled={loading || !address}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Confirmar Pedido'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}