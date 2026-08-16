import './App.css';
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Activities from './components/Activities';
import OpeningHours from './components/OpeningHours';
import ContactForm from './components/ContactForm';
import FindUs from './components/FindUs';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import MenuPage from './pages/MenuPage';
import ArrangementPage from './pages/ArrangementPage';
import BlogPage from './pages/BlogPage';
import NotFound from './pages/NotFound';
import { Coffee, ArrowRight, Wheat, Soup, Leaf } from 'lucide-react';

// ── Progress bar — mounts fresh on each navigation ──
function NavProgressBar() {
  const [width, setWidth] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const t1 = setTimeout(() => setWidth(75),  30);
    const t2 = setTimeout(() => setWidth(100), 350);
    const t3 = setTimeout(() => setOpacity(0), 420);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, zIndex: 9999,
        height: '2.5px',
        width: `${width}%`,
        opacity,
        background: 'linear-gradient(90deg, #b45309, #f59e0b, #fde68a)',
        boxShadow: '0 0 8px rgba(245,158,11,0.7)',
        borderRadius: '0 2px 2px 0',
        transition: width === 0
          ? 'none'
          : width < 100
            ? 'width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.2s'
            : 'width 0.15s ease-in, opacity 0.25s 0.05s',
        pointerEvents: 'none',
      }}
    />
  );
}

function MenuCTA() {
  const navigate = useNavigate();
  return (
    <section id="meny" className="py-20 bg-gradient-to-b from-amber-50/50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Coffee className="w-10 h-10 text-amber-700 mx-auto mb-3" />
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Meny
          </h2>
          <div className="w-20 h-1 bg-amber-700 mx-auto mb-5" />
          <p className="text-lg text-gray-500">Alt laget fra bunnen, på huset</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-2xl mx-auto">
          {[
            { icon: <Wheat className="w-5 h-5" />, label: 'Bakst' },
            { icon: <Soup className="w-5 h-5" />, label: 'Varm mat' },
            { icon: <Coffee className="w-5 h-5" />, label: 'Drikke' },
            { icon: <Leaf className="w-5 h-5" />, label: 'Spesielt' },
          ].map(({ icon, label }) => (
            <button key={label} onClick={() => navigate('/meny')}
              className="flex flex-col items-center gap-2 py-5 px-3 bg-white rounded-2xl shadow-sm border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all text-amber-800">
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        <div className="text-center">
          <button onClick={() => navigate('/meny')}
            className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all">
            Se full meny <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}


function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <About />
      <OpeningHours />
      <MenuCTA />
      <Activities />
      <FindUs />
      <ContactForm />
      <Footer />
    </>
  );
}

function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();
  if (checking) return <div className="min-h-screen flex items-center justify-center text-gray-500">Laster...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

// ── Routes wrapped with animation ──
// key={location.key} forces a real unmount+remount on every navigation,
// which retriggers the CSS page-enter animation each time.
function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <>
      <NavProgressBar key={`progress-${location.key}`} />
      <div key={`page-${location.key}`} className="page-enter">
        <Routes location={location}>
          <Route path="/"            element={<HomePage />} />
          <Route path="/meny"        element={<MenuPage />} />
          <Route path="/arrangement" element={<ArrangementPage />} />
          <Route path="/blogg"       element={<BlogPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin"       element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="*"            element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
          <BackToTop />
          <Toaster position="top-right" richColors closeButton />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
