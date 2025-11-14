/*
  # Marketplace de Hortifrúti - Schema Inicial

  ## Tabelas Criadas
  
  ### 1. user_profiles
  - `id` (uuid, PK) - vinculado ao auth.users
  - `full_name` (text) - nome completo
  - `phone` (text) - telefone
  - `is_consumer` (boolean) - pode comprar no varejo
  - `is_seller` (boolean) - pode vender no varejo
  - `is_supplier` (boolean) - pode vender no atacado
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. seller_profiles
  - `user_id` (uuid, FK) - referência ao user_profiles
  - `store_name` (text) - nome da loja/barraca
  - `description` (text) - descrição
  - `latitude` (decimal) - localização GPS
  - `longitude` (decimal) - localização GPS
  - `delivery_radius_km` (integer) - raio de entrega
  - `delivery_fee_per_km` (decimal) - taxa por km
  - `accepts_pickup` (boolean) - aceita retirada
  - `accepts_delivery` (boolean) - aceita entrega
  - `subscription_tier` (text) - plano: free, basic, premium
  - `is_active` (boolean) - loja ativa

  ### 3. supplier_profiles
  - `user_id` (uuid, FK)
  - `company_name` (text) - nome da empresa
  - `description` (text)
  - `visibility_boost_until` (timestamptz) - boost pago até
  - `is_active` (boolean)

  ### 4. products
  - `id` (uuid, PK)
  - `seller_id` (uuid, FK) - vendedor
  - `name` (text) - nome do produto
  - `description` (text)
  - `category` (text) - categoria: frutas, verduras, legumes, etc
  - `image_url` (text)
  - `price_per_unit` (decimal) - preço
  - `unit_type` (text) - kg, unidade, maço
  - `stock_quantity` (decimal)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 5. supplier_products
  - `id` (uuid, PK)
  - `supplier_id` (uuid, FK)
  - `name` (text)
  - `description` (text)
  - `category` (text)
  - `price_per_unit` (decimal) - preço atacado
  - `unit_type` (text) - caixa, saco, kg
  - `min_order_quantity` (decimal)
  - `is_active` (boolean)

  ### 6. market_quotations
  - `id` (uuid, PK)
  - `product_name` (text)
  - `category` (text)
  - `average_price` (decimal) - preço médio calculado
  - `min_price` (decimal)
  - `max_price` (decimal)
  - `sample_count` (integer) - quantos fornecedores
  - `updated_at` (timestamptz)

  ### 7. orders
  - `id` (uuid, PK)
  - `consumer_id` (uuid, FK)
  - `seller_id` (uuid, FK)
  - `total_amount` (decimal)
  - `delivery_fee` (decimal)
  - `delivery_type` (text) - delivery, pickup
  - `delivery_address` (text)
  - `delivery_latitude` (decimal)
  - `delivery_longitude` (decimal)
  - `status` (text) - pending, accepted, rejected, completed, cancelled
  - `payment_method` (text) - app, cash_on_delivery
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 8. order_items
  - `id` (uuid, PK)
  - `order_id` (uuid, FK)
  - `product_id` (uuid, FK)
  - `quantity` (decimal)
  - `unit_price` (decimal)
  - `subtotal` (decimal)

  ### 9. reviews
  - `id` (uuid, PK)
  - `order_id` (uuid, FK)
  - `consumer_id` (uuid, FK)
  - `seller_id` (uuid, FK)
  - `rating` (integer) - 1-5
  - `comment` (text)
  - `created_at` (timestamptz)

  ## Segurança
  - RLS habilitado em todas as tabelas
  - Políticas específicas por perfil de usuário
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  is_consumer boolean DEFAULT true,
  is_seller boolean DEFAULT false,
  is_supplier boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  description text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  delivery_radius_km integer DEFAULT 5,
  delivery_fee_per_km decimal(10, 2) DEFAULT 2.00,
  accepts_pickup boolean DEFAULT true,
  accepts_delivery boolean DEFAULT true,
  subscription_tier text DEFAULT 'free',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_profiles (
  user_id uuid PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  description text,
  visibility_boost_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES seller_profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  image_url text,
  price_per_unit decimal(10, 2) NOT NULL,
  unit_type text NOT NULL,
  stock_quantity decimal(10, 2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES supplier_profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price_per_unit decimal(10, 2) NOT NULL,
  unit_type text NOT NULL,
  min_order_quantity decimal(10, 2) DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS market_quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  category text NOT NULL,
  average_price decimal(10, 2) NOT NULL,
  min_price decimal(10, 2) NOT NULL,
  max_price decimal(10, 2) NOT NULL,
  sample_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_name, category)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES seller_profiles(user_id) ON DELETE CASCADE,
  total_amount decimal(10, 2) NOT NULL,
  delivery_fee decimal(10, 2) DEFAULT 0,
  delivery_type text NOT NULL,
  delivery_address text,
  delivery_latitude decimal(10, 8),
  delivery_longitude decimal(11, 8),
  status text DEFAULT 'pending',
  payment_method text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity decimal(10, 2) NOT NULL,
  unit_price decimal(10, 2) NOT NULL,
  subtotal decimal(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  consumer_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES seller_profiles(user_id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view active seller profiles"
  ON seller_profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Sellers can update own profile"
  ON seller_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can insert own profile"
  ON seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active supplier profiles"
  ON supplier_profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Suppliers can update own profile"
  ON supplier_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Suppliers can insert own profile"
  ON supplier_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Sellers can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Anyone can view active supplier products"
  ON supplier_products FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Suppliers can manage own products"
  ON supplier_products FOR ALL
  TO authenticated
  USING (auth.uid() = supplier_id)
  WITH CHECK (auth.uid() = supplier_id);

CREATE POLICY "Anyone can view market quotations"
  ON market_quotations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Consumers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = consumer_id OR auth.uid() = seller_id);

CREATE POLICY "Consumers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Sellers can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.consumer_id = auth.uid() OR orders.seller_id = auth.uid())
    )
  );

CREATE POLICY "Consumers can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.consumer_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Consumers can create reviews for their orders"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = consumer_id);