import { useState, useEffect } from 'react';
import { 
  Plus, Package, ShoppingBag, TrendingUp, Edit2, Trash2, 
  User, Clock, Upload, Image as ImageIcon, Loader2, Search, X,
  DollarSign, Calendar, AlertCircle
} from 'lucide-react';
import { supabase, Product, Order } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import MarketQuotations from './MarketQuotations';
import { toast } from 'sonner';

type View = 'products' | 'orders' | 'quotations';

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

export default function SellerDashboard() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('products');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  
  // Estados de Estatísticas (Dashboard)
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    pendingCount: 0
  });

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'frutas',
    price_per_unit: '',
    unit_type: 'kg',
    stock_quantity: '',
    image_url: '',
  });

  useEffect(() => {
    loadProducts();
    loadOrders(); // Carregamos os pedidos sempre para calcular as estatísticas
  }, [user]);

  // --- LÓGICA DE ESTATÍSTICAS ---
  const calculateStats = (ordersData: OrderWithDetails[]) => {
    const now = new Date();
    const today = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayTotal = 0;
    let monthTotal = 0;
    let pending = 0;

    ordersData.forEach(order => {
      const orderDate = new Date(order.created_at);
      
      // Ignora cancelados para somar dinheiro
      if (order.status !== 'Cancelado') {
        // Vendas de Hoje
        if (orderDate.toDateString() === today) {
          todayTotal += order.total_price;
        }
        // Vendas do Mês
        if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
          monthTotal += order.total_price;
        }
      }

      // Contagem de Pendentes
      if (order.status === 'Pendente') {
        pending++;
      }
    });

    setStats({
      todaySales: todayTotal,
      monthSales: monthTotal,
      pendingCount: pending
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const loadOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    const { data } = await supabase
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
      setOrders(data as any);
      calculateStats(data as any); // Calcula as estatísticas assim que os dados chegam
    }
    setLoadingOrders(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      toast.success('Imagem enviada!');
    } catch (error: any) {
      toast.error('Erro no upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const productData = {
      seller_id: user.id,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price_per_unit: parseFloat(formData.price_per_unit),
      unit_type: formData.unit_type,
      stock_quantity: parseFloat(formData.stock_quantity),
      image_url: formData.image_url,
      is_active: true,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        toast.success('Produto criado!');
      }

      setFormData({ name: '', description: '', category: 'frutas', price_per_unit: '', unit_type: 'kg', stock_quantity: '', image_url: '' });
      setShowForm(false);
      setEditingProduct(null);
      loadProducts();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price_per_unit: product.price_per_unit.toString(),
      unit_type: product.unit_type,
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    toast.promise(
      async () => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        loadProducts();
      },
      {
        loading: 'Excluindo...',
        success: 'Produto excluído!',
        error: 'Erro ao excluir.',
      }
    );
  };

  const toggleActive = async (product: Product) => {
    try {
      await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
      toast.success('Status alterado!');
      loadProducts();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      toast.success(`Pedido ${newStatus}!`);
      loadOrders(); // Recarrega para atualizar as estatísticas
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  if (view === 'quotations') return <MarketQuotations onBack={() => setView('products')} />;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* --- CABEÇALHO DO DASHBOARD (NOVO) --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visão Geral</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Card 1: Vendas Hoje */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Vendas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.todaySales.toFixed(2)}</p>
            </div>
          </div>

          {/* Card 2: Vendas Mês */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Faturamento (Mês)</p>
              <p className="text-2xl font-bold text-gray-900">R$ {stats.monthSales.toFixed(2)}</p>
            </div>
          </div>

          {/* Card 3: Pedidos Pendentes */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setView('orders')}>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pedidos Pendentes</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- NAVEGAÇÃO DE ABAS --- */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
        <button onClick={() => setView('products')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${view === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
          <Package className="w-5 h-5" /> Meus Produtos
        </button>
        <button onClick={() => setView('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${view === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
          <ShoppingBag className="w-5 h-5" /> Pedidos
          {stats.pendingCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{stats.pendingCount}</span>
          )}
        </button>
        <button onClick={() => setView('quotations')} className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${view === 'quotations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}>
          <TrendingUp className="w-5 h-5" /> Cotação de Mercado
        </button>
      </div>

      {/* --- CONTEÚDO DA ABA PRODUTOS --- */}
      {view === 'products' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingProduct(null);
                setFormData({ name: '', description: '', category: 'frutas', price_per_unit: '', unit_type: 'kg', stock_quantity: '', image_url: '' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" /> Adicionar Produto
            </button>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar em meus produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-green-100">
              <h2 className="text-xl font-bold mb-4 text-gray-800">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="Ex: Banana Prata" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                      <select value={formData.unit_type} onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                        <option value="kg">Kg</option>
                        <option value="unidade">Unidade</option>
                        <option value="maço">Maço</option>
                        <option value="dúzia">Dúzia</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                      <input type="number" step="0.01" value={formData.price_per_unit} onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="0.00" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                      <input type="number" step="0.1" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" placeholder="0" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (Opcional)</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" rows={3} placeholder="Detalhes sobre o produto..." />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Produto</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] bg-gray-50 hover:bg-gray-100 transition-colors relative">
                    {uploading ? (
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-2 mx-auto" />
                        <p className="text-sm text-gray-500">Enviando imagem...</p>
                      </div>
                    ) : formData.image_url ? (
                      <div className="relative w-full h-full text-center group">
                        <img src={formData.image_url} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain shadow-sm" />
                        <button type="button" onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-md transition-transform transform hover:scale-110" title="Remover imagem">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center pointer-events-none">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-2">Clique ou arraste uma foto aqui</p>
                        <p className="text-xs text-gray-400">JPG, PNG (Máx 2MB)</p>
                      </div>
                    )}
                    {!uploading && !formData.image_url && (
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 flex gap-3 pt-4 border-t mt-2">
                  <button type="submit" disabled={uploading} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors shadow-sm">
                    {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingProduct(null); }} className="px-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Produtos */}
          {loadingProducts ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-green-600 animate-spin" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Nenhum produto encontrado</h3>
              <p className="text-gray-500 mt-1">Tente ajustar sua busca ou adicione um novo produto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden group">
                  <div className="h-48 bg-gray-50 relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50"><span className="text-4xl opacity-50">🥬</span></div>
                    )}
                    <div className="absolute top-2 right-2">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {product.is_active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 line-clamp-1" title={product.name}>{product.name}</h3>
                    </div>
                    
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-xl font-bold text-green-600">R$ {product.price_per_unit.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">/{product.unit_type}</span>
                      <span className="ml-auto text-sm text-gray-600">Estoque: <b>{product.stock_quantity}</b></span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-50">
                      <button onClick={() => handleEdit(product)} className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button onClick={() => toggleActive(product)} className={`flex items-center justify-center gap-1 py-1.5 rounded-md text-sm font-medium transition-colors ${product.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                         {product.is_active ? 'Pausar' : 'Ativar'}
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="flex items-center justify-center gap-1 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
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
           <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-green-600 animate-spin" /></div>
         ) : orders.length === 0 ? (
           <div className="text-center py-12">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
             </div>
             <h3 className="text-lg font-semibold text-gray-700">Você ainda não tem pedidos</h3>
             <p className="text-gray-500">Divulgue seus produtos para começar a vender!</p>
           </div>
         ) : (
           <div className="space-y-4">
             {orders.map((order: OrderWithDetails) => (
               <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-green-200 transition-colors">
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
                        <p className="font-bold text-lg text-green-600">R$ {order.total_price.toFixed(2)}</p>
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
                            <span><span className="font-bold">{item.quantity}x</span> {item.products?.name || 'Produto removido'}</span>
                            <span className="text-gray-500">R$ {item.price_at_purchase.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                     <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Endereço de Entrega</p>
                        <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded-md border border-gray-100 inline-block min-w-[200px]">
                          {order.shipping_address || 'Retirada no local'}
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
    </div>
  );
}