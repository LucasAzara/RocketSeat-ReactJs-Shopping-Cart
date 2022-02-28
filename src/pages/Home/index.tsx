import React, { useState, useEffect } from "react";
import { MdAddShoppingCart } from "react-icons/md";

import { ProductList } from "./styles";
import { api } from "../../services/api";
import { formatPrice } from "../../util/format";
import { useCart } from "../../hooks/useCart";
import { toast } from "react-toastify";

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  // useState to store and update all of the products in the home page.
  const [products, setProducts] = useState<ProductFormatted[]>([]);

  // Cart Context and Function that will be used in this section of code
  const { addProduct, cart } = useCart();

  // Count the amount of each specific item in cart upon any refresh of the page
  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    sumAmount[product.id] = product.amount;

    return sumAmount;
  }, {} as CartItemsAmount);

  // Load all the products from API and store into product useState Variable
  useEffect(() => {
    async function loadProducts() {
      //Get products from API, with a new price variable added to object of each product
      const products = await api
        .get("/products")
        .then((response) => {
          return response.data.map((product: Product) => ({
            ...product,
            priceFormatted: formatPrice(product.price),
          }));
        })
        // catch error if api not working
        .catch(() => toast.error("Error: Unable to Retrieve Products!"));

      // set all products to homepage
      setProducts(products);
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    // Add Item to Cart or amount of item into Cart
    addProduct(id);
  }

  return (
    <ProductList>
      {products.map((product) => (
        <li key={product.id}>
          <img src={product.image} alt={product.title} />
          <strong>{product.title}</strong>
          <span>{product.priceFormatted}</span>
          <button
            type="button"
            data-testid="add-product-button"
            onClick={() => handleAddProduct(product.id)}
          >
            <div data-testid="cart-product-quantity">
              <MdAddShoppingCart size={16} color="#FFF" />
              {cartItemsAmount[product.id] || 0}
            </div>

            <span>ADICIONAR AO CARRINHO</span>
          </button>
        </li>
      ))}
    </ProductList>
  );
};

export default Home;
