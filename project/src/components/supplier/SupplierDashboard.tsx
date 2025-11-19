import { useState, useEffect } from 'react';
import { Truck, Package, Plus, Edit, Trash, Search, X, Save, DollarSign, BarChart3, ShoppingBag, User, AlertCircle } from 'lucide-react';
import { supabase, Order } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

type SupplierProduct = {
  id: string;
  name: string;
  category: string;
  price_per_unit: number;
  unit_type: string;
  stock_quantity: number;
  min_order_quantity: number;
  is_active: boolean;
};

type OrderWithDetails = Order & {
  user_profiles: {
    full_name: string;
  };
  order_items: Array<{
    quantity: number;
    price_at_purchase: number;
    products: {
      name: string;
    };
  }>;
};

type View = 'products' | 'orders';

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('products');
  
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Frutas',
    price_per_unit: '',
    unit_type: 'Caixa',
    stock_quantity: '',
    min_order_quantity: '1'
  });

  const unitTypes = ['Caixa', 'Saca', 'Engradado', 'Fardo', 'Tonelada', 'Unidade'];
  const categories = ['Frutas', 'Verduras', 'Legumes', 'Grãos', 'Outros'];

  useEffect(() => {
    if (user) {
      loadProducts();
      loadOrders();
    }
  }, [user]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar seu catálogo.");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
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

      if (error) throw error;
      setOrders(data as any || []);
    } catch (error: any) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error("Erro ao carregar pedidos.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenModal = (product?: SupplierProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        price_per_unit: product.price_per_unit.toString(),
        unit_type: product.unit_type,
        stock_quantity: product.stock_quantity?.toString() || '0',
        min_order_quantity: product.min_order_quantity?.toString() || '1'
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'Frutas',
        price_per_unit: '',
        unit_type: 'Caixa',
        stock_quantity: '',
        min_order_quantity: '1'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const payload = {
        supplier_id: user.id,
        name: formData.name,
        category: formData.category,
        price_per_unit: parseFloat(formData.price_per_unit),
        unit_type: formData.unit_type,
        stock_quantity: parseFloat(formData.stock_quantity),
        min_order_quantity: parseFloat(formData.min_order_quantity),
        is_active: true
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('supplier_products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from('supplier_products')
          .insert([payload]);
        if (error) throw error;
        toast.success("Produto cadastrado com sucesso!");
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar produto.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Produto removido.");
      loadProducts();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir produto.");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      toast.success(`Pedido ${newStatus}!`);
      loadOrders();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculos do Dashboard
  const totalProducts = products.length;
  const totalStockValue = products.reduce((acc, p) => acc + (p.price_per_unit * p.stock_quantity), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'Pendente').length;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      
      {/* --- CABEÇALHO --- */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-8 h-8 text-amber-100" />
            <h1 className="text-3xl font-bold">Portal do Fornecedor</h1>
          </div>
          <p className="text-amber-100 max-w-xl">
            Gerencie seu catálogo de atacado e acompanhe seus pedidos.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 transform skew-x-12 translate-x-10"></div>
      </div>

      {/* --- DASHBOARD RÁPIDO (CARDS) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total de Produtos</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalProducts}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Valor em Estoque</p>
            <h3 className="text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalStockValue)}
            </h3>
          </div>
        </div>

        <div 
          className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-amber-50 transition-colors"
          onClick={() => setView('orders')}
        >
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pedidos Pendentes</p>
            <h3 className="text-2xl font-bold text-orange-600">{pendingOrdersCount}</h3>
          </div>
        </div>
      </div>

      {/* --- NAVEGAÇÃO DE ABAS --- */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button 
          onClick={() => setView('products')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${view === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <Package className="w-5 h-5" /> Meus Produtos
        </button>
        <button 
          onClick={() => setView('orders')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${view === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <ShoppingBag className="w-5 h-5" /> Pedidos Recebidos
          {pendingOrdersCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pendingOrdersCount}</span>
          )}
        </button>
      </div>

      {/* --- CONTEÚDO DA ABA PRODUTOS --- */}
      {view === 'products' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos no catálogo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="w-full sm:w-auto bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-amber-700 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Novo Item
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600">Seu catálogo está vazio</h3>
              <p className="text-gray-500 mb-6">Comece adicionando seus produtos de atacado.</p>
              <button onClick={() => handleOpenModal()} className="text-amber-600 font-semibold hover:underline">
                Cadastrar primeiro produto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md mb-2 uppercase tracking-wide">
                        {product.category}
                      </span>
                      <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Preço Atacado:</span>
                      <span className="font-bold text-gray-900">
                        R$ {product.price_per_unit.toFixed(2)} <span className="text-gray-400 font-normal">/ {product.unit_type}</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Estoque:</span>
                      <span className={`font-bold ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {product.stock_quantity} {product.unit_type}s
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Mínimo:</span>
                      <span className="text-gray-900">{product.min_order_quantity} {product.unit_type}s</span>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => handleOpenModal(product)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="flex items-center justify-center px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Excluir"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- ABA DE PEDIDOS --- */}
      {view === 'orders' && (
        <div className="bg-white rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {loadingOrders ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Nenhum pedido recebido</h3>
              <p className="text-gray-500">Seus pedidos de venda aparecerão aqui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-amber-200 transition-colors">
                  <div className="flex flex-col md:flex-row justify-between md:items-center p-4 bg-gray-50 border-b border-gray-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">#{order.id.substring(0, 8)}</h3>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" /> {order.user_profiles?.full_name || 'Cliente'}
                      </div>
                    </div>
                    
                    <div className="mt-2 md:mt-0 flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="font-bold text-lg text-green-600">R$ {order.total_amount.toFixed(2)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                        order.status === 'Aprovado' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        order.status === 'Concluído' ? 'bg-green-100 text-green-700 border border-green-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Itens do Pedido</p>
                      <ul className="space-y-2">
                        {order.order_items.map((item: any, idx: number) => (
                          <li key={idx} className="flex justify-between text-sm text-gray-700 border-b border-dashed border-gray-100 last:border-0 pb-1">
                            <span><span className="font-bold">{item.quantity}x</span> {item.products?.name || 'Produto indisponível'}</span>
                            <span className="text-gray-500">R$ {item.price_at_purchase?.toFixed(2) || item.unit_price?.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Endereço de Entrega</p>
                        <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-100 inline-block min-w-[200px]">
                          {order.delivery_address || order.shipping_address || 'Retirada no local'}
                        </p>
                      </div>

                      {order.status === 'Pendente' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => updateOrderStatus(order.id, 'Aprovado')} className="flex-1 sm:flex-none bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 shadow-sm transition-colors">
                            Aceitar Pedido
                          </button>
                          <button onClick={() => updateOrderStatus(order.id, 'Cancelado')} className="flex-1 sm:flex-none bg-white text-red-600 border border-red-200 py-2 px-4 rounded-lg font-medium hover:bg-red-50 transition-colors">
                            Recusar
                          </button>
                        </div>
                      )}
                      {order.status === 'Aprovado' && (
                        <button onClick={() => updateOrderStatus(order.id, 'Concluído')} className="w-full sm:w-auto bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors">
                          Marcar como Entregue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL DE CADASTRO/EDIÇÃO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-amber-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto Atacado'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-amber-800 hover:bg-amber-200 rounded-full p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ex: Batata Inglesa Lavada"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    value={formData.unit_type}
                    onChange={e => setFormData({...formData, unit_type: e.target.value})}
                  >
                    {unitTypes.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="0.00"
                    value={formData.price_per_unit}
                    onChange={e => setFormData({...formData, price_per_unit: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                    value={formData.stock_quantity}
                    onChange={e => setFormData({...formData, stock_quantity: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Mínima Venda</label>
                <input
                  required
                  type="number"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  value={formData.min_order_quantity}
                  onChange={e => setFormData({...formData, min_order_quantity: e.target.value})}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}