import { useState, useEffect } from 'react';
import { Search, MapPin, ShoppingCart, Filter, Store, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProductWithSeller } from '../../lib/types';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'sonner';

export default function ProductList() {
  const [products, setProducts] = useState<ProductWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeller, setSelectedSeller] = useState<string>('all');
  
  // Listas auxiliares para os filtros
  const [availableSellers, setAvailableSellers] = useState<string[]>([]);

  const { addToCart } = useCart();

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'frutas', label: 'Frutas' },
    { id: 'verduras', label: 'Verduras' },
    { id: 'legumes', label: 'Legumes' },
    { id: 'temperos', label: 'Temperos' },
    { id: 'outros', label: 'Outros' }
  ];

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
        .eq('is_active', true)
        .gt('stock_quantity', 0); // Só mostra produtos com estoque!

      if (error) throw error;

      if (data) {
        const safeData = data as ProductWithSeller[];
        setProducts(safeData);
        
        // Extrai lista única de vendedores para o filtro
        const sellers = Array.from(new Set(safeData.map(p => p.seller_profiles?.store_name).filter(Boolean)));
        setAvailableSellers(sellers);
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Filtragem Poderosa
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSeller = selectedSeller === 'all' || product.seller_profiles?.store_name === selectedSeller;
    
    return matchesSearch && matchesCategory && matchesSeller;
  });

  const handleAddToCart = (product: ProductWithSeller) => {
    addToCart(product, 1);
    toast.success(
      <div className="flex flex-col">
        <span className="font-bold">{product.name} adicionado!</span>
        <span className="text-xs text-gray-500">Continue comprando ou vá para a sacola.</span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      
      {/* --- CABEÇALHO E BUSCA --- */}
      <div className="flex flex-col gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feira Digital</h1>
          <p className="text-gray-600">Produtos frescos direto do produtor para sua mesa.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Barra de Busca */}
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all shadow-sm"
              placeholder="O que você procura hoje?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Filtro de Vendedor (Dropdown) */}
          <div className="relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Store className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">Todas as Barracas</option>
              {availableSellers.map(seller => (
                <option key={seller} value={seller}>{seller}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Categorias (Chips) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-green-600 text-white shadow-md shadow-green-200 transform scale-105'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- GRADE DE PRODUTOS --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-100 border-t-green-600 mb-4"></div>
          <p className="text-gray-500 animate-pulse">Buscando as melhores ofertas...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-500 max-w-xs mx-auto">
            Não encontramos o que você procura nesta categoria ou vendedor.
          </p>
          <button 
            onClick={() => {setSelectedCategory('all'); setSelectedSeller('all'); setSearchTerm('')}}
            className="mt-6 text-green-600 font-semibold hover:underline"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Imagem */}
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                    <span className="text-6xl select-none opacity-50">🥬</span>
                  </div>
                )}
                
                {/* Badge de Vendedor (Flutuante) */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <Store className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {product.seller_profiles?.store_name || 'Vendedor Local'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-1" title={product.name}>
                    {product.name}
                  </h3>
                </div>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">
                  {product.description || 'Produto fresco e selecionado.'}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Preço</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-green-600">
                        R$ {product.price_per_unit.toFixed(2)}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        /{product.unit_type}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200 hover:bg-green-700 hover:scale-110 active:scale-95 transition-all"
                    title="Adicionar à sacola"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* A Sacola Flutuante continua sendo gerenciada pelo estado global e aparecerá automaticamente se tiver itens */}
      {/* Como melhoria futura, podemos transformar a sacola em um Drawer (Gaveta) lateral */}
    </div>
  );
}