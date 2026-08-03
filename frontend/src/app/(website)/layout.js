import { UserAuthProvider } from "@/context/UserAuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import CartDrawer from "@/components/layout/CartDrawer";
import WishlistDrawer from "@/components/layout/WishlistDrawer";

export default function WebsiteLayout({ children }) {
  return (
    <UserAuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            {children}
            <CartDrawer />
            <WishlistDrawer />
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </UserAuthProvider>
  );
}
