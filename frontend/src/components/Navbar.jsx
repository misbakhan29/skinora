import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api';
import { Search, Menu, X } from 'lucide-react';
import SkinoraLogo from './SkinoraLogo';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    try { await logout(); } catch {}
    logoutUser();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <NavLink to="/dashboard" className="navbar__logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }} onClick={closeMenu}>
          <SkinoraLogo size={32} />
          <span style={{ fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)', fontSize: '1.45rem', fontWeight: 700, color: '#854456', letterSpacing: '-0.02em' }}>Skinora</span>
        </NavLink>
        
        <button 
          className="navbar__hamburger" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`navbar__nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <li>
            <NavLink to="/dashboard" end className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/skin-type" className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Skin Profile
            </NavLink>
          </li>
          <li>
            <NavLink to="/routine" className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Routine
            </NavLink>
          </li>
          <li>
            <NavLink to="/products" className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Products
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" className={({isActive}) => `navbar__link${isActive ? ' active' : ''}`} onClick={closeMenu}>
              Profile
            </NavLink>
          </li>
          <li>
            {location.pathname !== '/products' && (
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => { navigate('/products'); closeMenu(); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--clr-text-muted)', width: isMobileMenuOpen ? '100%' : 'auto', justifyContent: isMobileMenuOpen ? 'center' : 'flex-start' }}
              >
                <Search size={16} /> Search
              </button>
            )}
          </li>
          <li>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
