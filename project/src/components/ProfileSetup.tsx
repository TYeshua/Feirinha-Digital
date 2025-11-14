import { useState } from 'react';
import { Store, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSetup() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sellerData, setSellerData] = useState({
    store_name: '',
    description: '',
    delivery_radius_km: '5',
    delivery_fee_per_km: '2.00',
  });
  const [supplierData, setSupplierData] = useState({
    company_name: '',
    description: '',
  });

  const enableSeller = async () => {
    if (!user) return;
    setLoading(true);

    await supabase.from('user_profiles').update({ is_seller: true }).eq('id', user.id);

    await supabase.from('seller_profiles').insert({
      user_id: user.id,
      store_name: sellerData.store_name,
      description: sellerData.description,
      delivery_radius_km: parseInt(sellerData.delivery_radius_km),
      delivery_fee_per_km: parseFloat(sellerData.delivery_fee_per_km),
    });

    setLoading(false);
    window.location.reload();
  };

  const enableSupplier = async () => {
    if (!user) return;
    setLoading(true);

    await supabase.from('user_profiles').update({ is_supplier: true }).eq('id', user.id);

    await supabase.from('supplier_profiles').insert({
      user_id: user.id,
      company_name: supplierData.company_name,
      description: supplierData.description,
    });

    setLoading(false);
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure seu Perfil</h1>
        <p className="text-gray-600">Ative perfis adicionais para vender ou fornecer produtos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {!profile?.is_seller && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Vendedor</h2>
                <p className="text-sm text-gray-600">Venda no varejo</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Loja/Barraca
                </label>
                <input
                  type="text"
                  value={sellerData.store_name}
                  onChange={(e) => setSellerData({ ...sellerData, store_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Ex: Frutas do João"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={sellerData.description}
                  onChange={(e) => setSellerData({ ...sellerData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Conte sobre sua loja..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raio de Entrega (km)
                  </label>
                  <input
                    type="number"
                    value={sellerData.delivery_radius_km}
                    onChange={(e) => setSellerData({ ...sellerData, delivery_radius_km: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa por Km (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellerData.delivery_fee_per_km}
                    onChange={(e) => setSellerData({ ...sellerData, delivery_fee_per_km: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={enableSeller}
              disabled={loading || !sellerData.store_name}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ativar Perfil de Vendedor
            </button>
          </div>
        )}

        {!profile?.is_supplier && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Fornecedor</h2>
                <p className="text-sm text-gray-600">Venda no atacado</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  value={supplierData.company_name}
                  onChange={(e) => setSupplierData({ ...supplierData, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ex: Distribuidora Verde"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={supplierData.description}
                  onChange={(e) => setSupplierData({ ...supplierData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  rows={3}
                  placeholder="Conte sobre sua empresa..."
                />
              </div>
            </div>

            <button
              onClick={enableSupplier}
              disabled={loading || !supplierData.company_name}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Ativar Perfil de Fornecedor
            </button>
          </div>
        )}
      </div>

      {profile?.is_seller && profile?.is_supplier && (
        <div className="mt-6 text-center">
          <p className="text-gray-600">Você já tem todos os perfis ativos!</p>
        </div>
      )}
    </div>
  );
}