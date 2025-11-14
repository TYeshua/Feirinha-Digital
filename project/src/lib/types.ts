// Importamos o tipo 'Product' base do seu arquivo supabase
import { Product } from './supabase';

// Este é o tipo que você criou no ProductList
// Agora ele é global
export type ProductWithSeller = Product & {
  seller_profiles: {
    store_name: string;
    latitude: number | null;
    longitude: number | null;
  };
};

// Este também é o tipo que você criou
// Agora ele é global
export type CartItem = {
  product: ProductWithSeller;
  quantity: number;
};