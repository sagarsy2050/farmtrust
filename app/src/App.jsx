import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CartProvider } from '@/lib/cartContext';
// Add page imports here
import Home from '@/pages/Home';
import ProductDetail from '@/pages/ProductDetail';
import FarmDetailPage from '@/pages/FarmDetailPage';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import CustomerOrders from '@/pages/CustomerOrders';
import OrderSuccess from '@/pages/OrderSuccess';
import HowItWorks from '@/pages/HowItWorks';
import MarketPrices from '@/pages/MarketPrices';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Farmer portal
import FarmerPortal from '@/components/farmer/FarmerPortal';
import FarmerDashboardPage from '@/pages/farmer/FarmerDashboardPage';
import VerificationCenter from '@/pages/farmer/VerificationCenter';
import FarmsList from '@/pages/farmer/FarmsList';
import FarmEditor from '@/pages/farmer/FarmEditor';
import DocumentsVault from '@/pages/farmer/DocumentsVault';
import ProductsManager from '@/pages/farmer/ProductsManager';
import FarmerOrders from '@/pages/farmer/FarmerOrders';
import Earnings from '@/pages/farmer/Earnings';
import FarmerAnalytics from '@/pages/farmer/FarmerAnalytics';
// Admin portal
import AdminPortal from '@/components/admin/AdminPortal';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminFarmers from '@/pages/admin/AdminFarmers';
import AdminFarms from '@/pages/admin/AdminFarms';
import DocumentReview from '@/pages/admin/DocumentReview';
import AdminVerification from '@/pages/admin/AdminVerification';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminReports from '@/pages/admin/AdminReports';
import AdminMarketData from '@/pages/admin/AdminMarketData';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/farm/:id" element={<FarmDetailPage />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/market-prices" element={<MarketPrices />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Checkout requires an account so the resulting order has a real owner
          (order RLS keys off created_by_id — there is no anonymous-guest path
          in the backend's permission model). */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=%2Fcheckout" replace />} />}>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<CustomerOrders />} />
      </Route>

      {/* Farmer portal - farmers and admins (support/debugging) only */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} allow={u => u?.account_type === 'farmer' || u?.role === 'admin'} />}>
        <Route element={<FarmerPortal />}>
          <Route path="/farmer" element={<FarmerDashboardPage />} />
          <Route path="/farmer/verification" element={<VerificationCenter />} />
          <Route path="/farmer/farms" element={<FarmsList />} />
          <Route path="/farmer/farms/new" element={<FarmEditor />} />
          <Route path="/farmer/farms/:id" element={<FarmEditor />} />
          <Route path="/farmer/documents" element={<DocumentsVault />} />
          <Route path="/farmer/products" element={<ProductsManager />} />
          <Route path="/farmer/orders" element={<FarmerOrders />} />
          <Route path="/farmer/earnings" element={<Earnings />} />
          <Route path="/farmer/analytics" element={<FarmerAnalytics />} />
        </Route>
      </Route>

      {/* Admin portal - admins only */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} allow={u => u?.role === 'admin'} />}>
        <Route element={<AdminPortal />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/farmers" element={<AdminFarmers />} />
          <Route path="/admin/farms" element={<AdminFarms />} />
          <Route path="/admin/documents" element={<DocumentReview />} />
          <Route path="/admin/verification" element={<AdminVerification />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/market-data" element={<AdminMarketData />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </CartProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
