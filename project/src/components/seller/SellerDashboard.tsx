import { useState, useEffect } from 'react';
// 1. Importa o ícone de Pedidos
import { Plus, Package, ShoppingBag, TrendingUp, Edit2, Trash2, User, Clock } from 'lucide-react';
// Corrigindo os caminhos de importação
import { supabase, Product, Order } from '../../lib/supabase'; // Assumindo que você definirá 'Order' no seu lib
import { useAuth } from '../../contexts/AuthContext';
import MarketQuotations from './MarketQuotations';

// 2. Define os tipos de visualização
type View = 'products' | 'orders' | 'quotations';

// Define um tipo mais completo para o Pedido, incluindo os dados do "join"
type OrderWithDetails = Order & {
  user_profiles: { // O perfil do *cliente*
    full_name: string;
  };
  order_items: Array<{ // Os itens do pedido
    quantity: number;
    price_at_purchase: number;
    products: { // O nome do produto
      name: string;
    };
  }>;
};

export default function SellerDashboard() {
  const { user } = useAuth();
  // 3. Estado da 'view' para controlar as abas
  const [view, setView] = useState<View>('products');
  
  // Estados para Produtos
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // 4. Novos estados para Pedidos
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'frutas',
    price_per_unit: '',
    unit_type: 'kg',
    stock_quantity: '',
  });

  // 5. useEffect agora carrega dados com base na 'view'
  useEffect(() => {
    if (view === 'products') {
      loadProducts();
    } else if (view === 'orders') {
      loadOrders();
    }
  }, [view, user]); // Roda quando a view ou o usuário mudam

  // --- LÓGICA DE PRODUTOS (Sem alteração) ---
  const loadProducts = async () => {
    if (!user) return;
    setLoadingProducts(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setProducts(data);
    setLoadingProducts(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // ... (Lógica de submit do produto - sem alteração)
    const productData = {
      seller_id: user.id,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price_per_unit: parseFloat(formData.price_per_unit),
      unit_type: formData.unit_type,
      stock_quantity: parseFloat(formData.stock_quantity),
      is_active: true,
    };
    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert(productData);
    }
    setFormData({ name: '', description: '', category: 'frutas', price_per_unit: '', unit_type: 'kg', stock_quantity: '' });
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };
  const handleEdit = (product: Product) => {
    // ... (Lógica de editar produto - sem alteração)
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price_per_unit: product.price_per_unit.toString(),
      unit_type: product.unit_type,
      stock_quantity: product.stock_quantity.toString(),
    });
    setShowForm(true);
  };
  const handleDelete = async (id: string) => {
    // ... (Lógica de deletar produto - sem alteração)
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      await supabase.from('products').delete().eq('id', id);
      loadProducts();
    }
  };
  const toggleActive = async (product: Product) => {
    // ... (Lógica de ativar/desativar produto - sem alteração)
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
    loadProducts();
  };

  // --- 6. NOVA LÓGICA DE PEDIDOS ---
  const loadOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    
    // Esta é a consulta "join" complexa:
    // 1. Pega da 'orders' onde 'seller_id' é o meu
    // 2. Puxa 'full_name' da 'user_profiles' (cliente)
    // 3. Puxa todos 'order_items' e o 'name' do 'products'
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user_profiles ( full_name ),
        order_items (
          quantity,
          price_at_purchase,
          products ( name )
        )
      `)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data as any); // Use 'any' por enquanto, ou o tipo OrderWithDetails
    }
    if (error) {
      console.error("Erro ao carregar pedidos:", error.message);
    }
    setLoadingOrders(false);
  };
  
  // 7. Função para mudar o status do pedido (ex: "Pendente" -> "Aprovado")
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
      
    if (error) {
      alert("Erro ao atualizar status: " + error.message);
    } else {
      // Recarrega a lista de pedidos para mostrar a mudança
      loadOrders();
    }
  };

  // --- RENDERIZAÇÃO ---
  
  // 8. Se a view for 'quotations', mostra o componente de cotação
  if (view === 'quotations') {
    return <MarketQuotations onBack={() => setView('products')} />;
  }

  // 9. Renderização principal (abas 'products' e 'orders')
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel do Vendedor</h1>
          <p className="text-gray-600">Gerencie seu catálogo de produtos e pedidos</p>
        </div>
        {/* 10. Botões de Abas */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              view === 'products' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Package className="w-5 h-5" />
            Produtos
          </button>
          <button
            onClick={() => setView('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              view === 'orders' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            Pedidos
          </button>
          <button
            onClick={() => setView('quotations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              view === 'quotations' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Cotação
          </button>
        </div>
      </div>

      {/* --- ABA DE PRODUTOS --- */}
      {view === 'products' && (
        <div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingProduct(null);
              setFormData({ name: '', description: '', category: 'frutas', price_per_unit: '', unit_type: 'kg', stock_quantity: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors mb-6"
          >
            <Plus className="w-5 h-5" />
            Novo Produto
          </button>

          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ... (Formulário de produto - sem alteração) ... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                    <option value="frutas">Frutas</option>
                    <option value="verduras">Verduras</option>
                    <option value="legumes">Legumes</option>
                    <option value="temperos">Temperos</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço</label>
                  <input type="number" step="0.01" value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select value={formData.unit_type} onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                    <option value="kg">Kg</option>
                    <option value="unidade">Unidade</option>
                    <option value="maço">Maço</option>
                    <option value="dúzia">Dúzia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input type="number" step="0.1" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" rows={3} />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700">{editingProduct ? 'Atualizar' : 'Cadastrar'}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} className="px-6 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Produtos */}
          {loadingProducts ? (
            <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div></div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md"><Package className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-700">Nenhum produto cadastrado</h3></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  {/* ... (Card de Produto - sem alteração) ... */}
                  <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center"><span className="text-6xl">🥬</span></div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                        <span className="text-sm text-gray-600 capitalize">{product.category}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{product.is_active ? 'Ativo' : 'Inativo'}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-green-600">R$ {product.price_per_unit.toFixed(2)}</span>
                      <span className="text-sm text-gray-600">/{product.unit_type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Estoque: {product.stock_quantity} {product.unit_type}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(product)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"><Edit2 className="w-4 h-4" /> Editar</button>
                      <button onClick={() => toggleActive(product)} className={`flex-1 px-3 py-2 rounded-lg font-medium ${product.is_active ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}>{product.is_active ? 'Desativar' : 'Ativar'}</button>
                      <button onClick={() => handleDelete(product.id)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 11. NOVA ABA DE PEDIDOS --- */}
      {view === 'orders' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          {loadingOrders ? (
            <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">Nenhum pedido recebido</h3>
              <p className="text-gray-600">Quando um cliente fizer um pedido, ele aparecerá aqui.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order: OrderWithDetails) => (
                <div key={order.id} className="border border-gray-200 rounded-lg">
                  <div className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-gray-50 rounded-t-lg">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Pedido #{order.id.substring(0, 8)}...</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <User className="w-4 h-4" /> Cliente: {order.user_profiles.full_name}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Data: {new Date(order.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right mt-2 md:mt-0">
                      <p className="font-bold text-2xl text-green-600">R$ {order.total_price.toFixed(2)}</p>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold mb-2">Itens do Pedido:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {order.order_items.map((item: any) => (
                        <li key={item.products.name} className="text-sm text-gray-700">
                          {item.quantity}x {item.products.name}
                          <span className="text-gray-500"> (R$ {item.price_at_purchase.toFixed(2)} cada)</span>
                        </li>
                      ))}
                    </ul>
                    
                    <h4 className="font-semibold mt-4 mb-2">Endereço de Entrega:</h4>
                    <p className="text-sm text-gray-700">{order.shipping_address}</p>
                    
                    {/* Ações do Vendedor */}
                    {order.status === 'Pendente' && (
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'Aprovado')}
                          className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700"
                        >
                          Aprovar Pedido
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'Cancelado')}
                          className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700"
                        >
                          Cancelar Pedido
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}