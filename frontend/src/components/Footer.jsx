import { NavLink } from 'react-router-dom';
import { Search } from 'lucide-react';
import SkinoraLogo from './SkinoraLogo';

/* ─── Minimal footer ─────────────────────────────────────────── */
function MinimalFooter() {
  return (
    <footer className="footer-minimal">
      <div className="footer-minimal__inner">
        {/* Logo */}
        <div className="footer-logo">
          <SkinoraLogo size={16} className="footer-logo__icon" />
          <span className="footer-logo__wordmark">Skinora</span>
        </div>

        {/* Copy + links */}
        <p className="footer-minimal__copy">
          © 2026 Skinora. All rights reserved.
          <span className="footer-minimal__sep" />
          <a href="#privacy" className="footer-link">Privacy</a>
          <span className="footer-minimal__dot">·</span>
          <a href="#terms" className="footer-link">Terms</a>
        </p>
      </div>
    </footer>
  );
}

/* ─── Full footer ────────────────────────────────────────────── */
function FullFooter() {
  return (
    <footer className="footer-full">
      <div className="container footer-full__grid">

        {/* Brand block */}
        <div className="footer-brand">
          <div className="footer-logo footer-logo--lg">
            <SkinoraLogo size={22} className="footer-logo__icon" />
            <span className="footer-logo__wordmark">Skinora</span>
          </div>
          <p className="footer-brand__tagline">
            <em>Know Your Skin. Love Your Routine.</em>
          </p>
          <p className="footer-brand__blurb">
            Skinora helps you discover your real skin type and builds you a
            personalized, step-by-step skincare routine — matched products,
            real prices, zero guesswork.
          </p>
        </div>

        {/* Product column */}
        <div className="footer-col">
          <h4 className="footer-col__heading">Product</h4>
          <ul className="footer-col__list">
            <li><NavLink to="/dashboard" className="footer-link">Dashboard</NavLink></li>
            <li><NavLink to="/quiz" className="footer-link">Skin Quiz</NavLink></li>
            <li><NavLink to="/camera" className="footer-link">Camera Analysis</NavLink></li>
            <li><NavLink to="/routine" className="footer-link">Routine Builder</NavLink></li>
            <li><NavLink to="/products" className="footer-link">Products</NavLink></li>
          </ul>
        </div>

        {/* Company column */}
        <div className="footer-col">
          <h4 className="footer-col__heading">Company</h4>
          <ul className="footer-col__list">
            <li><a href="#about" className="footer-link">About</a></li>
            <li><a href="#how-it-works" className="footer-link">How It Works</a></li>
            <li><a href="#contact" className="footer-link">Contact</a></li>
            <li><a href="#blog" className="footer-link">Blog</a></li>
          </ul>
        </div>

        {/* Legal column */}
        <div className="footer-col">
          <h4 className="footer-col__heading">Legal</h4>
          <ul className="footer-col__list">
            <li><a href="#privacy" className="footer-link">Privacy Policy</a></li>
            <li><a href="#terms" className="footer-link">Terms of Service</a></li>
            <li><a href="#cookies" className="footer-link">Cookie Policy</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-full__bottom">
        <div className="container footer-full__bottom-inner">
          <p className="footer-full__copyright">
            © 2026 Skinora. All rights reserved.
          </p>
          <div className="footer-full__social">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon"
              aria-label="Skinora on Instagram"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            {/* Pinterest via custom SVG path since lucide doesn't ship it */}
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-icon"
              aria-label="Skinora on Pinterest"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.428 1.808-2.428.853 0 1.267.64 1.267 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.476 1.806 1.772 0 3.137-1.868 3.137-4.565 0-2.387-1.716-4.057-4.165-4.057-2.837 0-4.502 2.128-4.502 4.33 0 .857.33 1.776.741 2.279a.3.3 0 0 1 .07.285c-.076.315-.243.995-.276 1.134-.044.183-.146.222-.337.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.967-.527-2.292-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446C17.523 22 22 17.523 22 12S17.523 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Public API ─────────────────────────────────────────────── */
/**
 * @param {{ variant?: 'minimal' | 'full' }} props
 */
export default function Footer({ variant = 'full' }) {
  return variant === 'minimal' ? <MinimalFooter /> : <FullFooter />;
}
