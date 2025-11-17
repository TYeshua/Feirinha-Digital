import { useState, useEffect } from 'react';
import { Search, MapPin, ShoppingCart, X, Plus, Minus } from 'lucide-react';
// Caminhos de importação corrigidos (usando relativo)
import { supabase } from '../../lib/supabase';
// 1. Importa os tipos globais (caminho corrigido)
import { ProductWithSeller } from '../../lib/types';
// 2. Importa o "cérebro" da sacola (caminho corrigido)
import { useCart } from '../../contexts/CartContext';

export default function ProductList() {
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // 3. Puxa tudo da sacola global!
  const { cart, addToCart, removeFromCart, updateQuantity, cartTotal, cartItemCount } = useCart();

  const categories = ['all', 'frutas', 'verduras', 'legumes', 'temperos', 'outros'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller_profiles (
            store_name,
            latitude,
            longitude
          )
        `)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      if (data) {
        setProducts(data as ProductWithSeller[]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar produtos:", error.message || error);
      // Não damos throw aqui para não travar a tela inteira
    } finally {
      setLoading(false);
    }
  };

  // PROTEÇÃO CONTRA CRASH (v7): Adicionado (products || []) para garantir que é um array antes de filtrar
  const filteredProducts = (products || []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Produtos Frescos</h1>
        <p className="text-gray-600">Encontre os melhores produtos perto de você</p>
      </div>

      {/* --- Filtros e Busca --- */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* --- Lista de Produtos --- */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">🥬</span> // Placeholder
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>

                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  {/* PROTEÇÃO CONTRA CRASH (v7): Optional Chaining (?.) para evitar erro se o vendedor não existir */}
                  <span>{product.seller_profiles?.store_name || 'Vendedor não identificado'}</span>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                )}

                {/* Empurra o preço e o botão para baixo */}
                <div className="flex-grow"></div> 

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-2xl font-bold text-green-600">
                      R$ {product.price_per_unit.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-600">/{product.unit_type}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Estoque: {product.stock_quantity}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(product, 1)} 
                  disabled={product.stock_quantity <= 0}
                  className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Sacola Flutuante --- */}
      {/* Adicionado z-50 para garantir que fique visível */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl p-6 w-80 max-h-[70vh] flex flex-col z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Sacola</h3>
            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {cartItemCount}
            </div>
          </div>

          <div className="space-y-3 mb-4 overflow-y-auto">
            {cart.map(item => (
              <div key={item.product.id} className="flex justify-between items-center gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-600">R$ {item.product.price_per_unit.toFixed(2)}</p>
                  {/* Controles de Quantidade */}
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-5 h-5 bg-gray-200 rounded-full text-gray-700 flex items-center justify-center"><Minus className="w-3 h-3"/></button>
                    <span className="text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-5 h-5 bg-gray-200 rounded-full text-gray-700 flex items-center justify-center"><Plus className="w-3 h-3"/></button>
                  </div>
                </div>
                <p className="font-bold text-green-600 text-sm">
                  R$ {(item.product.price_per_unit * item.quantity).toFixed(2)}
                </p>
                <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4"/>
                </button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-4">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-xl text-green-600">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Finalizar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}