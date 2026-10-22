import TransactionDetails from './components/TransactionDetails';
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import web3 from "./utils/web3";
import SplashScreen from "./components/SplashScreen";
import MetaMaskLogin from "./components/MetaMaskLogin";
import Landing from "./components/Landing";
import AdminLogin from "./components/AdminLogin";
import UserRegistration from "./components/UserRegistration";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import VehicleRegistration from "./components/VehicleRegistration";
import UserLogin from "./components/UserLogin";
import AdminInspect from './components/AdminInspect';
import NFTPage from './components/NftPage';
import PayFee from './components/Fee';
import Notifications from "./components/notifications";
import FAQ from "./components/Faq";
import ContactUs from "./components/Contact";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import {hasSession} from "./utils/session";
import OwnershipHistory from "./components/OwnershipHistory";
import TaxPayment from "./components/TaxPayment";
import OwnershipTransfer from "./components/OwnershipTransfer";
import UserInspections from "./components/UserInspections";
import AdminTaxManagement from "./components/AdminTaxManagement";
import AdminTransferManagement from "./components/AdminTransferManagement";
import MyVehicles from "./components/MyVehicles";
import BulkImport from "./components/BulkImport";

// Create a separate component for routes that uses auth context
const AppRoutes = () => {
  const [account, setAccount] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const expired = event => navigate(event.detail.role === "admin" ? "/admin/login" : "/login", {replace:true});
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [navigate]);

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      if (!web3) return;
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]); // Set account if connected
      }
    };

    checkMetaMaskConnection().catch(() => setAccount(""));
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <Routes>
      {/* Landing Page with Step-by-Step Flow */}
      <Route path="/" element={<Landing />} />

      {/* User Authentication Routes */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegistration />} />

      {/* Vehicle Registration (requires user authentication only) */}
      <Route path="/vehicle/register" element={<ProtectedRoute role="user"><VehicleRegistration /></ProtectedRoute>} />

      {/* Legacy routes (for backward compatibility) */}
      <Route path="/legacy" element={<MetaMaskLogin setAccount={setAccount} />} />
      <Route path="/legacy/dashboard" element={<ProtectedRoute role="user"><Dashboard /></ProtectedRoute>} />

      {/* Main dashboard (will check for user authentication) */}
      <Route path="/dashboard" element={<ProtectedRoute role="user"><Dashboard /></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute role="user"><MyVehicles /></ProtectedRoute>} />

      {/* Other routes */}
      <Route path="/ownership-history" element={<ProtectedRoute role="user"><OwnershipHistory /></ProtectedRoute>} />
      <Route path="/ownership-history/:vehicleId" element={<ProtectedRoute role="user"><OwnershipHistory /></ProtectedRoute>} />
      <Route path="/ownership-transfer" element={<ProtectedRoute role="user"><OwnershipTransfer /></ProtectedRoute>}/>
      <Route path="/tax-payment" element={<ProtectedRoute role="user"><TaxPayment /></ProtectedRoute>} />
      <Route path="/view-nft/:inspectionId" element={<ProtectedRoute role="user"><NFTPage /></ProtectedRoute>} />
      <Route path="/pay-fee/:inspectionId" element={<ProtectedRoute role="user"><PayFee /></ProtectedRoute>} />
      <Route path="/inspections" element={<ProtectedRoute role="user"><UserInspections /></ProtectedRoute>} />
      <Route path="/admin/inspect/" element={<ProtectedRoute><AdminInspect /></ProtectedRoute>} />
      <Route path="/notifications/" element={<ProtectedRoute role="user"><Notifications /></ProtectedRoute>} />
      <Route path="/faqs" element={<FAQ />} />
      <Route path="/contact" element={<ContactUs />} />

      {/* Admin routes with proper authentication */}
      <Route
        path="/admin/login"
        element={isLoggedIn && hasSession("admin") ? <Navigate to="/admin/dashboard" /> : <AdminLogin />}
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tax-management"
        element={
          <ProtectedRoute>
            <AdminTaxManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transfer-management"
        element={
          <ProtectedRoute>
            <AdminTransferManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bulk-import"
        element={
          <ProtectedRoute>
            <BulkImport />
          </ProtectedRoute>
        }
      />
      <Route path="/transactions/:hash" element={<TransactionDetails />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
