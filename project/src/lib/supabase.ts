import { createClient } from '@supabase/supabase-js';

// 1. Tipos de dados (Extraídos do seu schema.sql)
// Isso resolve todos os erros de "tipo"
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

// 2. Leitura das chaves do .env
// (O arquivo que está aberto na sua tela, .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem ser definidos no .env");
}

// 3. Criação e exportação do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);