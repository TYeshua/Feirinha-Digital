import { createClient } from '@supabase/supabase-js';

// 1. Tipos de dados (Extraídos do seu schema.sql)
export type UserProfile = {
  id: string;
  full_name: string;
  is_consumer: boolean;
  is_seller: boolean;
  is_supplier: boolean;
};

export type Product = {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  price_per_unit: number;
  unit_type: string;
  stock_quantity: number;
  is_active: boolean;
};

export type SupplierProduct = {
  id: string;
  supplier_id: string;
  name: string;
  category: string;
  price_per_unit: number;
  unit_type: string;
  stock_quantity: number;
};

export type MarketQuotation = {
  id: string;
  supplier_id: string;
  product_name: string;
  category: string;
  unit: string;
  min_price: number;
  max_price: number;
  average_price: number;
  sample_count: number;
};

export type Order = {
  id: string;
  created_at: string;
  customer_id: string;
  seller_id: string;
  total_price: number;
  status: string;
  shipping_address: string;
  reviewed: boolean;
};

export type Review = {
  id: string;
  order_id: string;
  customer_id: string;
  seller_id: string;
  rating: number;
  comment: string | null;
};

// 2. Diagnóstico de Conexão e Leitura de Chaves
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log para verificar se as variáveis estão carregando (sem mostrar a chave inteira por segurança)
console.log("[Supabase] Inicializando cliente...");
console.log("[Supabase] URL:", supabaseUrl ? supabaseUrl : "NÃO DEFINIDA (Vazia)");
console.log("[Supabase] Key:", supabaseAnonKey ? "Presente (Oculta)" : "NÃO DEFINIDA (Vazia)");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO CRÍTICO: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão faltando no arquivo .env");
}

// 3. Criação e exportação do cliente Supabase
// Usamos '' como fallback para que o createClient não falhe na inicialização do app,
// permitindo que a UI mostre erros em vez de travar numa tela branca.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,     // Garante que a sessão seja salva no LocalStorage
    autoRefreshToken: true,   // Tenta renovar o token automaticamente
    detectSessionInUrl: true, // Importante para links de confirmação de email
  },
});