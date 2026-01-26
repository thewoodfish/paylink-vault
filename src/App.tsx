import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Landing from "./pages/Landing";
import Pay from "./pages/Pay";
import ReceiptPage from "./pages/Receipt";
import Verify from "./pages/Verify";
import NotFound from "./pages/NotFound";

// Dashboard
import { DashboardLayout } from "./components/layout/DashboardLayout";
import PayLinksList from "./pages/dashboard/PayLinksList";
import CreatePayLink from "./pages/dashboard/CreatePayLink";
import PayLinkDetails from "./pages/dashboard/PayLinkDetails";
import ReceiptsList from "./pages/dashboard/ReceiptsList";
import Settings from "./pages/dashboard/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/pay/:id" element={<Pay />} />
          <Route path="/receipt/:id" element={<ReceiptPage />} />
          <Route path="/verify" element={<Verify />} />

          {/* Dashboard routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/paylinks" replace />} />
            <Route path="paylinks" element={<PayLinksList />} />
            <Route path="paylinks/new" element={<CreatePayLink />} />
            <Route path="paylinks/:id" element={<PayLinkDetails />} />
            <Route path="receipts" element={<ReceiptsList />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
