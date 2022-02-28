import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

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
    // get localStorage
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    // if not empty then store items into cart
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    // if empty, just return empty array
    return [];
  });

  // Previous value of cart
  const prevCart = useRef<Product[]>();

  // Update constantly prevCart
  useEffect(() => {
    prevCart.current = cart;
  });

  // Create varibale to be used as an argumento for useEffect so it doesn't use the Reference variable as well as if it's undefined, it will just get the current value of cart.
  const prevCartValue = prevCart.current ?? cart;

  // set localStorage to cart everytime cart is updated differently.
  useEffect(() => {
    if (prevCartValue !== cart) {
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    }
  }, [cart, prevCartValue]);

  const addProduct = async (productId: number) => {
    try {
      // Get data from stock
      const stock = await api.get(`/stock/${productId}`).then((response) => {
        return response.data;
      });

      // updatedCart to not mutate cart array
      const updatedCart = [...cart];

      // get product if it exists from cart
      const productExists = updatedCart.find(
        (product) => product.id === productId
      );

      const cartAmount = productExists?.amount ? productExists.amount + 1 : 0;

      // if there isn't enough in stock for the given order, return error message
      if (stock.amount < cartAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        // If it exists in the Cart, plus 1
        productExists.amount += 1;
        setCart(updatedCart);
      } else {
        // get product information
        const product = await api
          .get(`/products/${productId}`)
          .then((response) => {
            return response.data;
          });

        // Add item to cart with all information and amount igualing 1
        updatedCart.push({
          ...product,
          amount: 1,
        });
        setCart(updatedCart);
      }
    } catch (err) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // get product if it exists from cart
      const productExists = cart.find((product) => product.id === productId);

      if (!productExists) throw new Error();

      const updatedCart = cart.filter((product) => product.id !== productId);

      setCart(updatedCart);
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // If amount is less than one, then do nothing
      if (amount < 1) return;

      // Get data from stock api
      const stock = await api.get(`/stock/${productId}`).then((response) => {
        return response.data;
      });

      // if there isn't enough in stock for the given order, return error message
      if (stock.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      // mutable array
      const updatedCart = [...cart];
      // find product to update
      const productUpdate = updatedCart.find((item) => item.id === productId);

      //If product exists
      if (productUpdate?.amount) {
        //update amount of product
        productUpdate.amount = amount;
        setCart(updatedCart);
      } else {
        toast.error("Erro na alteração de quantidade do produto");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
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
