import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart";
import Home from "@/pages/Home";
import Scan from "@/pages/Scan";
import Menu from "@/pages/Menu";
import Track from "@/pages/Track";
import Bill from "@/pages/Bill";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/t/:tableId" element={<Scan />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/track" element={<Track />} />
        <Route path="/bill" element={<Bill />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </CartProvider>
  );
}

export { App };
