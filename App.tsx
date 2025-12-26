
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Settings from './components/Settings';
import AuthLogin from './components/AuthLogin';
import AILab from './components/AILab';
import Pricing from './pages/Pricing';
import CheckoutSuccess from './pages/CheckoutSuccess';
import PublicEstimate from './pages/PublicEstimate';
import MdfCatalog from './pages/MdfCatalog';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import ProductList from './pages/admin/ProductList';
import AdminBrands from './pages/admin/AdminBrands';
import BlockBuilder from './pages/admin/BlockBuilder';
import AdminSettings from './pages/admin/AdminSettings';
import MdfPatternDetails from './pages/MdfPatternDetails';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import { supabase } from './services/supabaseClient';
import { UserProfile, Appointment, Project } from './types';
import { getUser, logoutUser, saveUser, checkProjectDeadlines } from './services/storageService';
import { checkAppointments } from './services/notificationService';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check Supabase Session (Source of Truth)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (session?.user) {
          // Session valid! Sync/Get Profile
          const { data } = await supabase.from('profiles').select('data').eq('email', session.user.email).maybeSingle();
          if (data?.data) {
            const profile = data.data as UserProfile;
            saveUser(profile);
            setUser(profile);
          } else {
            // Fallback: If we have a session but no profile, try local storage or bare minimum
            const local = getUser();
            if (local && local.email === session.user.email) setUser(local);
          }
        } else {
          // No session found.
          console.log("No active session found.");
          // If we had a local user, it's stale. Clear it.
          if (getUser()) {
            console.warn("Clearing stale local user.");
            logoutUser();
            setUser(null);
          }
        }
      } catch (err: any) {
        console.error("Auth init error:", err);
        // CRITICAL: If Refresh Token is invalid, we MUST clear local state to prevent loops
        if (err.message?.includes("Refresh Token") || err.message?.includes("Invalid")) {
          console.error("Critical Auth Error - Force Logout");
          logoutUser();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Background checks
    const intervalId = setInterval(() => {
      if (getUser()) {
        checkAppointments();
        checkProjectDeadlines();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, []); // Run ONCE on mount only. No navigate dependency.

  // Failsafe: if loading takes too long, offer manual reset
  const [showReset, setShowReset] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowReset(true), 5000); // 5s timeout
    return () => clearTimeout(timer);
  }, []);

  const handleHardReset = async () => {
    localStorage.clear();
    try { await supabase.auth.signOut(); } catch { }
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4">
        <div className="text-center mb-6">
          <Loader2 className="w-16 h-16 text-wood-600 animate-spin mx-auto mb-4" />
          <p className="text-wood-400 font-medium">Carregando oficina...</p>
        </div>

        {showReset && (
          <div className="animate-fade-in text-center">
            <p className="text-red-400 text-sm mb-3">Parece que demorou demais?</p>
            <button
              onClick={handleHardReset}
              className="bg-red-900/50 hover:bg-red-800 text-red-200 px-6 py-2 rounded-full border border-red-800 transition-colors text-sm font-bold"
            >
              Forçar Reinício (Limpar Cache)
            </button>
          </div>
        )}
      </div>
    );
  }

  // Handle Navigation from Layout
  const handleNav = (tab: string) => {
    if (tab === 'dashboard') navigate('/');
    else navigate(`/${tab}`);
  };

  return (
    <Routes>
      <Route path="/login" element={!user ? <AuthLogin onLogin={(u) => { setUser(u); navigate('/'); }} /> : <Navigate to="/" />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/checkout/success" element={<CheckoutSuccess />} />
      <Route path="/p/:token" element={<PublicEstimate />} />

      {/* Routes wrapped in Layout */}
      <Route path="/" element={
        <ProtectedRoute user={user}>
          <Layout activeTab="dashboard" setActiveTab={handleNav}>
            <Dashboard user={user as UserProfile} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/projects" element={
        <ProtectedRoute user={user}>
          <Layout activeTab="projects" setActiveTab={handleNav}>
            <Projects />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/clients" element={
        <ProtectedRoute user={user}>
          <Layout activeTab="clients" setActiveTab={handleNav}>
            <Clients />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute user={user}>
          <Layout activeTab="settings" setActiveTab={handleNav}>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/ai-studio" element={
        <ProtectedRoute user={user}>
          <Layout activeTab="ai-studio" setActiveTab={handleNav}>
            <AILab />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/catalog" element={
        <ProtectedRoute user={user}>
          <Layout activeTab="catalog" setActiveTab={handleNav}>
            <MdfCatalog />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/catalog/:id" element={
        <ProtectedRoute user={user}>
          <Layout activeTab="catalog" setActiveTab={handleNav}>
            <MdfPatternDetails />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin Routes (Standalone) */}
      <Route path="/admin/*" element={
        <ProtectedAdminRoute>
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/brands" element={<AdminBrands />} />
              <Route path="/builder" element={<BlockBuilder />} />
              <Route path="/settings" element={<AdminSettings />} />
            </Routes>
          </AdminLayout>
        </ProtectedAdminRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
