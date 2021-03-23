import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    else return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get('/products');
      
      //Procura o produto referente ao ID nos produtos
      const product = response.data.find((product: Product) => product.id === productId)

      //Procura o produto referente ao ID no carrinho de compras
      const cartProduct = cart.find((product: Product) => product.id === productId)

      if (!cartProduct)
      {
        const newCart = [...cart, {amount: 1, ...product}].sort((a, b) => {
          if (a.id > b.id) return 1;
          if (a.id < b.id) return -1;
          return 0
        });
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        updateProductAmount({productId: cartProduct.id, amount: cartProduct.amount+1});
      } 
    } catch {
      // TODO
    }
  };

  const removeProduct = (productId: number) => {
    const productsFiltered = cart.filter((product: Product) => product.id !== productId)
    try {
          const newCart = productsFiltered
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }
     catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
      const response = await api.get('/stock');
      const stock = response.data.find((stock: Stock) => stock.id === productId);
    try {
      const cartProduct = cart.find((product: Product) => product.id === productId)
      if (!cartProduct) {
        return
      }
      else if (amount <= stock.amount) {
      const updatedProduct ={...cartProduct, amount: Math.max(0, amount)}
      const productsFiltered = cart.filter((product: Product) => product.id !== productId)
      const newCart = [...productsFiltered, updatedProduct].sort((a, b) => {
        if (a.id > b.id) return 1;
        if (a.id < b.id) return -1;
        return 0
      })
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    }
      else throw toast.error; 
      
    } catch {
      toast.error('Não há estoque disponível')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
