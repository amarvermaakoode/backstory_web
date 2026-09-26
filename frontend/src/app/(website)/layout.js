import { UserAuthProvider } from "@/context/UserAuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import CartDrawer from "@/components/layout/CartDrawer";
import WishlistDrawer from "@/components/layout/WishlistDrawer";

export default function WebsiteLayout({ children }) {
  return (
    <UserAuthProvider>
      <ToastProvider>
        <WishlistProvider>
          <CartProvider>
            <main id="main-content" tabIndex={-1} className="outline-none flex-1">
              {children}
            </main>
            <CartDrawer />
            <WishlistDrawer />
          </CartProvider>
        </WishlistProvider>
      </ToastProvider>
    </UserAuthProvider>
  );
}
