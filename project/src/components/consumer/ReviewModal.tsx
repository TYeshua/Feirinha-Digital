import { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
// Corrigindo os caminhos de importação para serem absolutos a partir de 'src/'
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
// Precisamos importar o tipo do Pedido
import { OrderWithDetails } from './OrderHistory'; 

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  // O modal precisa saber qual pedido está sendo avaliado
  order: OrderWithDetails | null; 
  // Função para recarregar o histórico após a avaliação
  onReviewSubmitted: () => void; 
};

export default function ReviewModal({ isOpen, onClose, order, onReviewSubmitted }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0); // Estado para as estrelas
  const [hoverRating, setHoverRating] = useState(0); // Efeito visual de hover
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmitReview = async () => {
    if (!user || rating === 0) {
      alert("Por favor, selecione pelo menos uma estrela.");
      return;
    }
    setLoading(true);

    try {
      // 1. Insere a avaliação na nova tabela 'reviews'
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          order_id: order.id,
          customer_id: user.id,
          seller_id: order.seller_id,
          rating: rating,
          comment: comment,
        });
      
      if (reviewError) throw reviewError;

      // 2. Marca o pedido como 'reviewed = true' na tabela 'orders'
      const { error: orderError } = await supabase
        .from('orders')
        .update({ reviewed: true }) // Você precisa desta coluna na sua tabela 'orders'
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 3. Sucesso
      alert("Avaliação enviada com sucesso!");
      setLoading(false);
      resetForm();
      onReviewSubmitted(); // Recarrega o histórico de pedidos
      onClose(); // Fecha o modal

    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error.message);
      alert('Erro ao enviar avaliação: ' + error.message);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
  }

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
          <h2 className="text-2xl font-bold text-gray-900">Avaliar Pedido</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <p className="text-lg font-semibold mb-2">Vendedor: {order.seller_profiles.store_name}</p>
            <p className="text-gray-600 mb-3">Como foi sua experiência com este pedido?</p>
          </div>
          
          {/* 1. Seletor de Estrelas */}
          <div>
            <label className="text-lg font-semibold mb-2 block">Sua nota:</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    (hoverRating || rating) >= star
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
          </div>
          
          {/* 2. Comentário */}
          <div>
            <label className="text-lg font-semibold mb-2 block">Comentário (opcional):</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Escreva sobre os produtos, a entrega, etc..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              rows={4}
            />
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-gray-50 border-t rounded-b-xl">
          <button
            onClick={handleSubmitReview}
            disabled={loading || rating === 0}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Enviar Avaliação'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}