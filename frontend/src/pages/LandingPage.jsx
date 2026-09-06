import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/AnimatedBackground';
import { Sparkles, Search, Beaker, ShoppingBag } from 'lucide-react';
import SkinoraLogo from '../components/SkinoraLogo';
import Footer from '../components/Footer';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', position: 'relative' }}>
      <AnimatedBackground />

      {/* Navbar for Logged Out */}
      <nav className="navbar" style={{ background: 'rgba(255, 255, 255, 0.6)', borderBottom: 'none' }}>
        <div className="navbar__inner">
          <div className="navbar__logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SkinoraLogo size={24} style={{ color: 'var(--clr-primary)' }} /> Skinora
          </div>
          <div className="flex gap-sm">
            <button className="btn btn-ghost" onClick={() => navigate('/auth?mode=login')}>
              Log in
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth?mode=register')}>
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container relative" style={{ zIndex: 1, paddingTop: '180px', paddingBottom: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="animate-in stagger" style={{ maxWidth: '700px' }}>
          <h1 className="display-lg mb-md" style={{ color: 'var(--clr-primary-dark)' }}>
            Know Your Skin.<br />
            <span style={{ color: 'var(--clr-text)' }}>Love Your Routine.</span>
          </h1>
          <p className="text-muted mb-xl" style={{ fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 40px' }}>
            Discover your exact skin type and get a personalized, science-backed skincare routine in minutes. No more guessing.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=register')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Get Started
          </button>
        </div>

      </div>

      {/* How it Works */}
      <section className="section-sm relative" style={{ zIndex: 1, background: 'rgba(255, 245, 248, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: '1px solid var(--clr-border)' }}>
        <div className="container">
          <div className="text-center mb-xl">
            <h2 className="mb-sm">How it works</h2>
            <p className="text-muted">Three simple steps to your best skin ever.</p>
          </div>
          <div className="grid-3 stagger">
            <div className="card card-glass text-center">
              <div className="step-icon mx-auto mb-md" style={{ margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Search size={28} />
              </div>
              <h3 className="mb-sm">1. Discover your skin type</h3>
              <p className="text-muted text-sm">Take our simple quiz or use camera analysis to pinpoint exactly what your skin needs.</p>
            </div>
            <div className="card card-glass text-center">
              <div className="step-icon mx-auto mb-md" style={{ margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Beaker size={28} />
              </div>
              <h3 className="mb-sm">2. Get your routine</h3>
              <p className="text-muted text-sm">Receive a personalized AM & PM routine matched precisely to your skin type.</p>
            </div>
            <div className="card card-glass text-center">
              <div className="step-icon mx-auto mb-md" style={{ margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <ShoppingBag size={28} />
              </div>
              <h3 className="mb-sm">3. Shop smart</h3>
              <p className="text-muted text-sm">Browse approved products with live price comparison so you know you're getting the best deal.</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
