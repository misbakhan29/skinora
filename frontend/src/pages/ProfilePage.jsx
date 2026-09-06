import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Sparkles, Droplet, Flower2, Zap, Leaf, Shield, FileText, Camera, PenLine } from 'lucide-react';

const SKIN_TYPE_INFO = {
  normal:      { icon: Sparkles, label: 'Normal' },
  oily:        { icon: Droplet, label: 'Oily' },
  dry:         { icon: Flower2, label: 'Dry' },
  combination: { icon: Zap, label: 'Combination' },
  sensitive:   { icon: Leaf, label: 'Sensitive' },
  acne_prone:  { icon: Shield, label: 'Acne-Prone' },
};

export default function ProfilePage() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const profile = user?.skin_profile;
  const skinInfo = profile ? SKIN_TYPE_INFO[profile.skin_type] : null;

  const handleLogout = async () => {
    try { await logout(); } catch {}
    logoutUser();
    navigate('/');
  };

  return (
    <div className="page-container page-top">
      <Navbar />
      <section className="section">
        <div className="container-md">
          <h1 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--sp-xl)' }}>
            My <span className="text-gradient">Profile</span>
          </h1>

          <div className="grid-2" style={{ gap: 'var(--sp-xl)', alignItems: 'start' }}>
            {/* Account info */}
            <div className="card animate-in">
              <h3 className="mb-lg">Account Details</h3>
              <div className="flex flex-col gap-md">
                <div>
                  <p className="text-xs text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</p>
                  <p style={{ fontWeight: 600 }}>{user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</p>
                  <p style={{ fontWeight: 600 }}>{user?.email}</p>
                </div>
                {user?.age_range && (
                  <div>
                    <p className="text-xs text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Age Range</p>
                    <p style={{ fontWeight: 600 }}>{user.age_range}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Member Since</p>
                  <p style={{ fontWeight: 600 }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                </div>
              </div>
            </div>

            {/* Skin profile */}
            <div className="card animate-in">
              <h3 className="mb-lg">Skin Profile</h3>
              {profile ? (
                <div className="flex flex-col gap-md">
                  <div className="flex items-center gap-md">
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)' }}>
                      {skinInfo ? <skinInfo.icon size={48} strokeWidth={1.5} /> : <Sparkles size={48} strokeWidth={1.5} />}
                    </span>
                    <div>
                      <span className={`skin-badge skin-badge--${profile.skin_type}`}>{skinInfo?.label} Skin</span>
                      <p className="text-muted text-xs mt-sm flex items-center gap-xs">
                        Detected via {profile.detection_method === 'quiz' ? <><FileText size={12} /> Skin Quiz</> : profile.detection_method === 'camera' ? <><Camera size={12} /> Camera Analysis</> : <><PenLine size={12} /> Manual Selection</>}
                      </p>
                    </div>
                  </div>
                  {profile.confidence_score && (
                    <div>
                      <p className="text-xs text-muted mb-sm">Camera Confidence</p>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${profile.confidence_score * 100}%`, background: 'var(--grad-primary)', borderRadius: 'var(--r-full)' }} />
                      </div>
                      <p className="text-xs text-muted mt-sm">{Math.round(profile.confidence_score * 100)}%</p>
                    </div>
                  )}
                  <button className="btn btn-outline btn-sm mt-md" onClick={() => navigate('/skin-type')}>
                    Update Skin Type
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-muted mb-lg">You haven't set your skin type yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/skin-type')}>
                    Discover My Skin Type →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card mt-xl animate-in">
            <h3 className="mb-lg">Quick Actions</h3>
            <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => navigate('/routine')}>View Routine</button>
              <button className="btn btn-outline" onClick={() => navigate('/products')}>Browse Products</button>
              <button className="btn btn-outline" onClick={() => navigate('/quiz')}>Retake Quiz</button>
              <button className="btn btn-ghost" style={{ color: '#f87171' }} onClick={handleLogout}>Sign Out</button>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
