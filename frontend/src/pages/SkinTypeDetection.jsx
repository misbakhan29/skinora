import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setSkinTypeManually } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  Sparkles, Droplet, Flower2, Zap, Leaf, Shield, 
  FileText, Camera, PenLine, Lock 
} from 'lucide-react';

const SKIN_TYPES = [
  { id: 'normal',      icon: Sparkles, label: 'Normal',      desc: 'Balanced, comfortable, minimal issues' },
  { id: 'oily',        icon: Droplet, label: 'Oily',         desc: 'Shiny, enlarged pores, prone to breakouts' },
  { id: 'dry',         icon: Flower2, label: 'Dry',           desc: 'Tight, flaky, dull, needs rich hydration' },
  { id: 'combination', icon: Zap, label: 'Combination',  desc: 'Oily T-zone, drier cheeks' },
  { id: 'sensitive',   icon: Leaf, label: 'Sensitive',    desc: 'Reactive, redness, stings easily' },
  { id: 'acne_prone',  icon: Shield, label: 'Acne-Prone', desc: 'Regular breakouts, clogged pores' },
];

export default function SkinTypeDetection() {
  const [path, setPath] = useState(null); // null | 'quiz' | 'camera' | 'manual'
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleManualSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await setSkinTypeManually(selected);
      updateUser({ skin_profile: { skin_type: selected, detection_method: 'manual' } });
      navigate('/routine');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (path === 'quiz') {
    navigate('/quiz');
    return null;
  }

  if (path === 'camera') {
    navigate('/camera');
    return null;
  }

  return (
    <div className="page-container page-top">
      <Navbar />

      <section className="section">
        <div className="container">
          {/* Two-column layout with image on the side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--sp-2xl)', alignItems: 'start' }}>

            {/* Main content */}
            <div>
              <div className="text-center mb-xl animate-in" style={{ textAlign: 'left' }}>
                <h1 style={{ fontFamily: 'var(--font-serif)' }}>How do you want to<br /><em className="text-gradient">discover your skin?</em></h1>
                <p className="text-muted mt-md">Your skin type powers every recommendation — cleanser to sunscreen.</p>
              </div>

              {!path && (
                <div className="flex flex-col gap-md stagger">
                  {/* Quiz path */}
                  <div
                    className="card animate-in"
                    style={{ cursor: 'pointer', display: 'flex', gap: 'var(--sp-lg)', alignItems: 'flex-start' }}
                    onClick={() => navigate('/quiz')}
                  >
                    <div className="step-icon" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="mb-sm">Take the Skin Quiz</h3>
                      <p className="text-muted text-sm">10 questions about how your skin feels, looks, and reacts. Fast, reliable, and always available.</p>
                      <p className="text-xs mt-sm" style={{ color: 'var(--clr-primary)' }}>Recommended for beginners → 3 minutes</p>
                    </div>
                  </div>

                  {/* Camera path */}
                  <div
                    className="card animate-in"
                    style={{ cursor: 'pointer', display: 'flex', gap: 'var(--sp-lg)', alignItems: 'flex-start' }}
                    onClick={() => navigate('/camera')}
                  >
                    <div className="step-icon" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={24} />
                    </div>
                    <div>
                      <h3 className="mb-sm">Camera Analysis <span style={{ fontSize: '0.7rem', background: 'rgba(244,114,182,0.15)', color: 'var(--clr-primary)', padding: '2px 10px', borderRadius: '999px', verticalAlign: 'middle', marginLeft: 4 }}>BETA</span></h3>
                      <p className="text-muted text-sm">Use your webcam or upload a photo. Our AI analyzes oil distribution, pore size, and texture.</p>
                      <p className="text-xs mt-sm flex items-center gap-xs" style={{ color: 'var(--clr-text-faint)' }}><Lock size={12} /> Your photo is never stored</p>
                    </div>
                  </div>

                  {/* Manual path */}
                  <div
                    className="card animate-in"
                    style={{ cursor: 'pointer', display: 'flex', gap: 'var(--sp-lg)', alignItems: 'flex-start' }}
                    onClick={() => setPath('manual')}
                  >
                    <div className="step-icon" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PenLine size={24} />
                    </div>
                    <div>
                      <h3 className="mb-sm">I Know My Skin Type</h3>
                      <p className="text-muted text-sm">Already know what you're working with? Skip detection and go straight to your personalized routine.</p>
                    </div>
                  </div>
                </div>
              )}

              {path === 'manual' && (
                <div className="animate-in">
                  <button className="btn btn-ghost btn-sm mb-lg" onClick={() => setPath(null)}>← Back</button>
                  <h2 className="mb-xl" style={{ fontFamily: 'var(--font-serif)' }}>Select your skin type</h2>
                  <div className="grid-2 stagger" style={{ marginBottom: 'var(--sp-xl)' }}>
                    {SKIN_TYPES.map((st) => (
                      <div
                        key={st.id}
                        className={`card animate-in${selected === st.id ? ' animate-border' : ''}`}
                        style={{
                          cursor: 'pointer',
                          display: 'flex',
                          gap: 'var(--sp-md)',
                          alignItems: 'center',
                          border: selected === st.id ? '1.5px solid var(--clr-primary)' : undefined,
                          background: selected === st.id ? 'rgba(244,114,182,0.08)' : undefined,
                        }}
                        onClick={() => setSelected(st.id)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected === st.id ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                          <st.icon size={32} />
                        </span>
                        <div>
                          <p style={{ fontWeight: 600 }}>{st.label}</p>
                          <p className="text-muted text-xs">{st.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-primary btn-lg w-full"
                    disabled={!selected || saving}
                    onClick={handleManualSave}
                  >
                    {saving ? 'Saving…' : `Build My Routine for ${SKIN_TYPES.find(s => s.id === selected)?.label || 'My'} Skin →`}
                  </button>
                </div>
              )}
            </div>

            {/* Side imagery panel */}
            <div className="animate-in" style={{ position: 'sticky', top: 100 }}>
              <div style={{
                borderRadius: 'var(--r-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-card)',
                border: '1px solid var(--clr-border)',
              }}>
                <img
                  src="/images/skincare_flatlay.jpg"
                  alt="Skincare products"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
              <div className="card mt-lg" style={{ background: 'var(--grad-card)', textAlign: 'center', padding: 'var(--sp-lg)' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--clr-primary-dark)', marginBottom: 'var(--sp-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Your skin is unique <Sparkles size={16} style={{ color: 'var(--clr-gold)' }} />
                </p>
                <p className="text-muted text-xs">
                  Over 10,000 skin profiles analyzed. Science-backed recommendations tailored just for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
