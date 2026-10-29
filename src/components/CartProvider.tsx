"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { products } from "@/content/products";
import { addCartItem, CART_STORAGE_KEY, getCartSummary, MAX_ITEM_QUANTITY, parseStoredCart, serializeCart, setCartQuantity, type CartItem } from "@/lib/cart";
import { EMPTY_CHECKOUT_DETAILS, type CheckoutDetails } from "@/lib/checkout";

function useCartState() {
  const [items, setItems] = useState<CartItem[]>([]);
  const current = useRef<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState("");
  const [announcement, setAnnouncement] = useState("");
  // Contact details stay in memory only; never write personal data to browser storage.
  const [checkoutDetails, setCheckoutDetails] = useState<CheckoutDetails>(EMPTY_CHECKOUT_DETAILS);

  useEffect(() => {
    function read() {
      try {
        current.current = parseStoredCart(localStorage.getItem(CART_STORAGE_KEY));
        setItems(current.current);
      } catch {
        setStorageWarning("Your browser couldn’t save your bag. It will stay available during this visit.");
      }
      setReady(true);
    }
    read();
    function onStorage(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY || event.key === null) read();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!announcement) return;
    const timeout = window.setTimeout(() => setAnnouncement(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  function commit(next: CartItem[]) {
    current.current = next;
    setItems(next);
    try {
      localStorage.setItem(CART_STORAGE_KEY, serializeCart(next));
      setStorageWarning("");
    } catch {
      setStorageWarning("Your browser couldn’t save your bag. It will stay available during this visit.");
    }
  }

  function addItem(productId: string) {
    if (!ready) return;
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if ((current.current.find((item) => item.productId === productId)?.quantity ?? 0) >= MAX_ITEM_QUANTITY) {
      setAnnouncement(`You can add up to ${MAX_ITEM_QUANTITY} bottles of ${product.name}.`);
      return;
    }
    commit(addCartItem(current.current, productId));
    setAnnouncement(`${product.name} added to your bag.`);
  }

  function updateQuantity(productId: string, quantity: number) {
    if (!ready) return;
    commit(setCartQuantity(current.current, productId, quantity));
    if (quantity === 0) setAnnouncement(`${products.find((product) => product.id === productId)?.name ?? "Item"} removed from your bag.`);
  }

  return {
    items, ready, storageWarning, announcement, setAnnouncement,
    summary: getCartSummary(items), addItem, updateQuantity,
    checkoutDetails, setCheckoutDetails,
  };
}

const CartContext = createContext<ReturnType<typeof useCartState> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCartState();
  return <CartContext.Provider value={cart}>
    {children}
    <div className="sr-only" role="status">{cart.announcement}</div>
    {cart.announcement && <button className="save-toast cart-toast" onClick={() => cart.setAnnouncement("")} aria-label={`${cart.announcement} Dismiss notification`}>
      <Check size={16} /><span>{cart.announcement}</span><X size={14} />
    </button>}
  </CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
