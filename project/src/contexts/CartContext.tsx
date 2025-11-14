import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// Importamos nossos novos tipos globais
import { CartItem, ProductWithSeller } from '../lib/types';

// O que o contexto irá fornecer
type CartContextType = {
  cart: CartItem[];
  addToCart: (product: ProductWithSeller, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartTotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// O Provedor
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Efeito 1: Carregar a sacola do localStorage ao iniciar
  useEffect(() => {
    const storedCart = localStorage.getItem('hortifruti_cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  // Efeito 2: Salvar a sacola no localStorage sempre que ela mudar
  useEffect(() => {
    localStorage.setItem('hortifruti_cart', JSON.stringify(cart));
  }, [cart]);

  // --- Funções de Gerenciamento ---

  const addToCart = (product: ProductWithSeller, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        // Se já existe, atualiza a quantidade
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Se é novo, adiciona
        return [...prevCart, { product, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove se a quantidade for 0 ou menor
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // --- Cálculos Derivados ---

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price_per_unit * item.quantity,
    0
  );

  // O valor que será passado para os componentes
  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartItemCount,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// O Hook customizado para usar a sacola
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};