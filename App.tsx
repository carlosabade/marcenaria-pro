
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Clients from './components/Clients';
import Settings from './components/Settings';
import AuthLogin from './components/AuthLogin';
import Pricing from './pages/Pricing';
import CheckoutSuccess from './pages/CheckoutSuccess';
import PublicEstimate from './pages/PublicEstimate';
import ProtectedRoute from './components/ProtectedRoute';
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
        const localUser = getUser();
        if (localUser) {
          setUser(localUser);
          setLoading(false);
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (session?.user) {
          if (!localUser || localUser.id !== session.user.id) {
            const { data } = await supabase.from('profiles').select('data').eq('email', session.user.email).maybeSingle();
            if (data?.data) {
              const profile = data.data as UserProfile;
              saveUser(profile);
              setUser(profile);
            }
          }
        } else if (!localUser) {
          setLoading(false);
        } else {
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_OUT') {
            setUser(null);
            logoutUser();
            navigate('/');
          } else if (event === 'SIGNED_IN' && session?.user) {
            const { data } = await supabase.from('profiles').select('data').eq('email', session.user.email).maybeSingle();
            if (data?.data) {
              const profile = data.data as UserProfile;
              saveUser(profile);
              setUser(profile);
            }
          }
        });

        return () => subscription.unsubscribe();

      } catch (err) {
        console.error("Auth init error:", err);
        setLoading(false);
      }
    };

    initAuth();

    // Notification logic
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    const intervalId = setInterval(() => {
      if (getUser()) {
        checkAppointments();
        checkProjectDeadlines();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-wood-600 animate-spin mx-auto mb-4" />
          <p className="text-wood-400 font-medium">Carregando oficina...</p>
        </div>
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
        <ProtectedRoute>
          <Layout activeTab="dashboard" setActiveTab={handleNav}>
            <Dashboard user={user as UserProfile} />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/projects" element={
        <ProtectedRoute>
          <Layout activeTab="projects" setActiveTab={handleNav}>
            <Projects />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/clients" element={
        <ProtectedRoute>
          <Layout activeTab="clients" setActiveTab={handleNav}>
            <Clients />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout activeTab="settings" setActiveTab={handleNav}>
            <Settings />
          </Layout>
        </ProtectedRoute>
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
