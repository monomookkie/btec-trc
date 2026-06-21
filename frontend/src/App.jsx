import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import LoginPage from './pages/auth/LoginPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Toast from './components/ui/Toast';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CourseManagement from './pages/admin/CourseManagement';
import CertificateEngine from './pages/admin/CertificateEngine';
import UsersPage from './pages/admin/UsersPage';
import Reports from './pages/admin/Reports';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import BrowseCourses from './pages/user/BrowseCourses';
import MyCertificates from './pages/user/MyCertificates';
import MyReport from './pages/user/MyReport';
import ProfilePage from './pages/ProfilePage';

function useAutoReload() {
  useEffect(() => {
    const getCurrentHash = () => {
      const s = [...document.querySelectorAll('script[src]')].find(el => el.src.includes('/assets/index-'));
      return s ? s.src : null;
    };
    const currentHash = getCurrentHash();
    if (!currentHash) return;

    const check = async () => {
      try {
        const res = await fetch('/?_=' + Date.now(), { cache: 'no-store' });
        const html = await res.text();
        const match = html.match(/\/assets\/index-[^"']+\.js/);
        if (match && !currentHash.includes(match[0])) {
          window.location.reload();
        }
      } catch {}
    };

    const timer = setInterval(check, 60 * 1000);
    return () => clearInterval(timer);
  }, []);
}

function AppLayout({ user, onUpdateUser, onLogout, showToast }) {
  useAutoReload();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageProps = { user, showToast };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar user={user} onLogout={onLogout} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} onMenuClick={() => setSidebarOpen(o => !o)} />
        <div className="flex-1 overflow-auto">
          <Routes>
            {user.role === 'ADMIN' ? (
              <>
                <Route path="/admin/dashboard"    element={<AdminDashboard {...pageProps} />} />
                <Route path="/admin/courses"      element={<CourseManagement {...pageProps} />} />
                <Route path="/admin/certificates" element={<CertificateEngine {...pageProps} />} />
                <Route path="/admin/users"        element={<UsersPage {...pageProps} />} />
                <Route path="/admin/reports"      element={<Reports {...pageProps} />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/dashboard" element={<UserDashboard {...pageProps} />} />
                <Route path="/courses"   element={<BrowseCourses {...pageProps} />} />
                <Route path="/certs"     element={<MyCertificates {...pageProps} />} />
                <Route path="/report"    element={<MyReport {...pageProps} />} />
                <Route path="/profile"   element={<ProfilePage {...pageProps} onUpdate={onUpdateUser} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            )}
            {user.role === 'ADMIN' && (
              <Route path="/profile" element={<ProfilePage {...pageProps} onUpdate={onUpdateUser} />} />
            )}
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, login, logout, register, updateUser } = useAuth();
  const { toast, showToast, clearToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    const u = await login(email, password);
    navigate(u.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    return u;
  };

  const handleRegister = async (body) => {
    const u = await register(body);
    navigate('/dashboard');
    return u;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />;

  return (
    <>
      <AppLayout user={user} onUpdateUser={updateUser} onLogout={handleLogout} showToast={showToast} />
      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={clearToast} />}
    </>
  );
}
