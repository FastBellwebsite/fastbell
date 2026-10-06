import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { StoreProvider } from '@/context/StoreContext';
import { CartProvider } from '@/context/CartContext';
import { OrderProvider } from '@/context/OrderContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import StudentLayout from '@/layouts/StudentLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

import Login from '@/pages/Login';
import RoleLogin from '@/pages/RoleLogin';
import RegisterStudent from '@/pages/RegisterStudent';
import RegisterVendor from '@/pages/RegisterVendor';
import RegisterDelivery from '@/pages/RegisterDelivery';

import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import CategoryPage from '@/pages/CategoryPage';
import Stores from '@/pages/Stores';
import StoreDetail from '@/pages/StoreDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import Orders from '@/pages/Orders';
import OrderTracking from '@/pages/OrderTracking';
import Favorites from '@/pages/Favorites';
import Profile from '@/pages/Profile';

import VendorDashboard from '@/pages/vendor/VendorDashboard';
import VendorProducts from '@/pages/vendor/VendorProducts';
import VendorNewProduct from '@/pages/vendor/VendorNewProduct';
import VendorEditProduct from '@/pages/vendor/VendorEditProduct';
import VendorOrders from '@/pages/vendor/VendorOrders';
import VendorOrderDetail from '@/pages/vendor/VendorOrderDetail';
import VendorProfile from '@/pages/vendor/VendorProfile';

import DeliveryDashboard from '@/pages/delivery/DeliveryDashboard';
import DeliveryOrders from '@/pages/delivery/DeliveryOrders';
import DeliveryOrderDetail from '@/pages/delivery/DeliveryOrderDetail';
import DeliveryProfile from '@/pages/delivery/DeliveryProfile';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminVendors from '@/pages/admin/AdminVendors';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminOrders from '@/pages/admin/AdminOrders';

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <OrderProvider>
            <Toaster position="bottom-right" />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/auth/:role" element={<RoleLogin />} />
                <Route path="/register/student" element={<RegisterStudent />} />
                <Route path="/register/vendor" element={<RegisterVendor />} />
                <Route path="/register/delivery" element={<RegisterDelivery />} />

                <Route element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/search" element={<Shop />} />
                  <Route path="/category/:categoryId" element={<CategoryPage />} />
                  <Route path="/product/:productId" element={<ProductDetail />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/store/:storeId" element={<StoreDetail />} />
                  <Route path="/stores/:storeId" element={<StoreDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-success" element={<OrderSuccess />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:orderId" element={<OrderTracking />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                <Route path="/vendor" element={<ProtectedRoute role="vendor"><DashboardLayout role="vendor" /></ProtectedRoute>}>
                  <Route index element={<VendorDashboard />} />
                  <Route path="products" element={<VendorProducts />} />
                  <Route path="products/new" element={<VendorNewProduct />} />
                  <Route path="products/:productId/edit" element={<VendorEditProduct />} />
                  <Route path="orders" element={<VendorOrders />} />
                  <Route path="orders/:orderId" element={<VendorOrderDetail />} />
                  <Route path="profile" element={<VendorProfile />} />
                </Route>

                <Route path="/delivery" element={<ProtectedRoute role="delivery"><DashboardLayout role="delivery" /></ProtectedRoute>}>
                  <Route index element={<DeliveryDashboard />} />
                  <Route path="orders" element={<DeliveryOrders />} />
                  <Route path="orders/:orderId" element={<DeliveryOrderDetail />} />
                  <Route path="profile" element={<DeliveryProfile />} />
                </Route>

                <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="vendors" element={<AdminVendors />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </OrderProvider>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}
