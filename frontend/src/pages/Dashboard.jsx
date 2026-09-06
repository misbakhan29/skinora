import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSavedRoutines, setConcerns } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, Clock, Sparkles, Droplet, Sun, Moon, ArrowRight, FileText, Camera, PenLine, ExternalLink, Flower2, Zap, Leaf, Shield, Beaker, ShoppingBag, User } from 'lucide-react';
import SkinoraLogo from '../components/SkinoraLogo';

const SKIN_TYPE_INFO = {
  normal:      { icon: Sparkles, label: 'Normal',      color: 'var(--clr-normal)' },
  oily:        { icon: Droplet, label: 'Oily',         color: 'var(--clr-oily)' },
  dry:         { icon: Flower2, label: 'Dry',           color: 'var(--clr-dry)' },
  combination: { icon: Zap, label: 'Combination',  color: 'var(--clr-combination)' },
  sensitive:   { icon: Leaf, label: 'Sensitive',    color: 'var(--clr-sensitive)' },
  acne_prone:  { icon: Shield, label: 'Acne-Prone', color: 'var(--clr-acne_prone)' },
};

const STEP_ICONS = {
  cleanser: Beaker, toner: Droplet, serum: Sparkles, moisturizer: Leaf, sunscreen: Sun,
};
const STEP_ORDER = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen'];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [savedRoutines, setSavedRoutines] = useState([]);
  const [routineLoading, setRoutineLoading] = useState(false);
  const [selectedConcerns, setSelectedConcerns] = useState([]);
  const [savingConcerns, setSavingConcerns] = useState(false);

  const CONCERNS_LIST = [
    { id: 'acne', label: 'Acne' },
    { id: 'dryness', label: 'Dryness' },
    { id: 'sensitivity', label: 'Sensitivity' },
    { id: 'dullness', label: 'Dullness' },
    { id: 'aging', label: 'Aging' },
    { id: 'hyperpigmentation', label: 'Hyperpigmentation' },
    { id: 'excess_oil', label: 'Excess Oil' }
  ];

  const profile = user?.skin_profile;
  const skinInfo = profile ? SKIN_TYPE_INFO[profile.skin_type] : null;

  useEffect(() => {
    if (profile?.skin_type) {
      setRoutineLoading(true);
      getSavedRoutines()
        .then((res) => setSavedRoutines(res.data.routines || []))
        .catch(() => {})
        .finally(() => setRoutineLoading(false));
    }
    if (profile?.concerns) {
      setSelectedConcerns(profile.concerns);
    }
  }, [profile?.skin_type, profile?.concerns]);

  const handleToggleConcern = (id) => {
    if (selectedConcerns.includes(id)) {
      setSelectedConcerns(selectedConcerns.filter(c => c !== id));
    } else if (selectedConcerns.length < 3) {
      setSelectedConcerns([...selectedConcerns, id]);
    }
  };

  const handleSaveConcerns = async () => {
    setSavingConcerns(true);
    try {
      await setConcerns(selectedConcerns);
      if (refreshUser) await refreshUser();
    } catch (error) {
      console.error(error);
    } finally {
      setSavingConcerns(false);
    }
  };

  const latestAM = savedRoutines.find(r => r.am_pm === 'am');
  const latestPM = savedRoutines.find(r => r.am_pm === 'pm');

  const renderRoutinePreview = (routine, label, IconComponent) => {
    if (!routine) {
      return (
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <div className="flex items-center gap-md mb-lg">
            <IconComponent size={24} style={{ color: 'var(--clr-text)' }} />
            <h3 style={{ fontSize: '1rem' }}>{label} Routine</h3>
          </div>
          <p className="text-muted text-sm mb-lg">You haven't built your {label.toLowerCase()} routine yet.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/routine')}>
            Build {label} Routine →
          </button>
        </div>
      );
    }

    const selections = routine.step_selections || {};
    const filledSteps = STEP_ORDER.filter(s => selections[s]);
    const totalSteps = label === 'Evening' ? 4 : 5;

    return (
      <div className="card" style={{ flex: 1, minWidth: 280 }}>
        <div className="flex items-center justify-between mb-lg">
          <div className="flex items-center gap-md">
            <IconComponent size={24} style={{ color: 'var(--clr-text)' }} />
            <h3 style={{ fontSize: '1rem' }}>{label} Routine</h3>
          </div>
          <span className="pill pill--recommended" style={{ fontSize: '0.7rem' }}>
            {filledSteps.length} of {totalSteps} steps
          </span>
        </div>

        <div className="flex flex-col gap-sm">
          {STEP_ORDER.map((step) => {
            if (label === 'Evening' && step === 'sunscreen') return null;
            const selection = selections[step];
            const isFilled = !!selection;
            const isSkipped = selection === 'skip';
            const isOwn = typeof selection === 'object' && selection.type === 'own';
            const StepIcon = STEP_ICONS[step];
            
            return (
              <div key={step} className="flex items-center gap-md" style={{ padding: 'var(--sp-sm) var(--sp-md)', borderRadius: 'var(--r-sm)', background: isFilled ? 'rgba(244, 114, 182, 0.06)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--clr-border)' }}>
                <span style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                  <StepIcon size={18} style={{ color: isFilled ? 'var(--clr-text)' : 'var(--clr-text-faint)' }} />
                </span>
                <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, textTransform: 'capitalize', color: isFilled ? 'var(--clr-text)' : 'var(--clr-text-faint)' }}>
                  {step}
                </span>
                {isSkipped ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontWeight: 600 }}>Skipped</span>
                ) : isOwn ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-primary)', fontWeight: 600 }}>✓ Own</span>
                ) : selection ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-primary)', fontWeight: 600 }}>✓ Set</span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-faint)' }}>—</span>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn btn-ghost btn-sm mt-md" onClick={() => navigate('/routine')} style={{ width: '100%' }}>
          {filledSteps.length > 0 ? 'Edit Routine →' : 'Build Routine →'}
        </button>
      </div>
    );
  };

  return (
    <div className="page-container page-top">
      <Navbar />

      {/* Hero greeting */}
      <section className="section-sm" style={{ 
        background: 'radial-gradient(circle at 100% 0%, rgba(244, 114, 182, 0.2) 0%, rgba(255, 255, 255, 0) 60%), radial-gradient(circle at 0% 100%, rgba(219, 39, 119, 0.1) 0%, rgba(255, 255, 255, 0) 60%), linear-gradient(135deg, rgba(254, 228, 234, 0.4) 0%, transparent 100%)', 
        borderBottom: '1px solid var(--clr-border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <SkinoraLogo size={280} style={{ position: 'absolute', right: '-5%', bottom: '-30%', opacity: 0.06, transform: 'rotate(-15deg)', color: 'var(--clr-primary)' }} />
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', left: '-5%', top: '-20%', opacity: 0.04, transform: 'rotate(15deg)' }}>
          <path d="M10 100 Q 50 10 100 100 T 190 100" stroke="var(--clr-primary)" strokeWidth="2" strokeLinecap="round" />
          <path d="M10 120 Q 50 30 100 120 T 190 120" stroke="var(--clr-primary)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--sp-lg)' }}>
            <div style={{ padding: 'var(--sp-xl) 0' }}>
              <p className="text-muted text-sm mb-sm" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Welcome back</p>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: 'var(--sp-md)' }}>
                {user?.name?.split(' ')[0]}
              </h1>
              {skinInfo && (
                <div className="flex items-center gap-md mt-md">
                  <span className={`skin-badge skin-badge--${profile.skin_type}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <skinInfo.icon size={14} /> {skinInfo.label} Skin
                  </span>
                </div>
              )}
            </div>
            {skinInfo && (
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/skin-type')}>
                Update Skin Type
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="section-sm mt-lg">
        <div className="container">
          {!profile ? (
            <div className="card text-center animate-in" style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--sp-2xl)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-lg)' }}>
                <div style={{ background: 'var(--grad-primary)', padding: '24px', borderRadius: '50%', color: 'white' }}>
                  <Search size={48} />
                </div>
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--sp-md)' }}>
                Let's discover your skin type
              </h2>
              <p className="text-muted mb-xl">
                We'll personalize your entire routine — cleanser to sunscreen — based on your unique skin.
              </p>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/skin-type')}>
                Get Started →
              </button>
            </div>
          ) : (
            <>
              <div className="mb-xl">
                <div className="flex items-center justify-between mb-lg">
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem' }}>My Routine</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/routine')}>
                    {savedRoutines.length > 0 ? 'Edit Routine →' : 'Build Routine →'}
                  </button>
                </div>

                {routineLoading ? (
                  <div className="flex justify-center" style={{ padding: 'var(--sp-xl)' }}>
                    <div className="spinner" />
                  </div>
                ) : (
                  <div className="flex gap-lg" style={{ flexWrap: 'wrap' }}>
                    {renderRoutinePreview(latestAM, 'Morning', Sun)}
                    {renderRoutinePreview(latestPM, 'Evening', Moon)}
                  </div>
                )}
              </div>

              <div className="grid-3 stagger">
                <div className="card animate-in flex flex-col items-center" style={{ cursor: 'pointer', textAlign: 'center', padding: 'var(--sp-xl)' }} onClick={() => navigate('/products')}>
                  <div style={{ marginBottom: 'var(--sp-md)', color: 'var(--clr-primary)', background: 'rgba(219, 39, 119, 0.1)', padding: '16px', borderRadius: '50%' }}>
                    <ShoppingBag size={32} />
                  </div>
                  <h3 className="mb-sm" style={{ fontSize: '1rem' }}>Browse Products</h3>
                  <p className="text-muted text-xs">Products matched for {skinInfo?.label} skin with live prices</p>
                </div>

                <div className="card animate-in flex flex-col items-center" style={{ cursor: 'pointer', textAlign: 'center', padding: 'var(--sp-xl)' }} onClick={() => navigate('/skin-type')}>
                  <div style={{ marginBottom: 'var(--sp-md)', color: skinInfo.color || 'var(--clr-primary)', background: 'rgba(219, 39, 119, 0.1)', padding: '16px', borderRadius: '50%' }}>
                    {skinInfo ? <skinInfo.icon size={32} /> : <Sparkles size={32} />}
                  </div>
                  <h3 className="mb-sm" style={{ fontSize: '1rem' }}>Skin Profile</h3>
                  <p className="text-muted text-xs">Retake quiz, camera analysis, or update manually</p>
                </div>

                <div className="card animate-in flex flex-col items-center" style={{ cursor: 'pointer', textAlign: 'center', padding: 'var(--sp-xl)' }} onClick={() => navigate('/profile')}>
                  <div style={{ marginBottom: 'var(--sp-md)', color: 'var(--clr-primary)', background: 'rgba(219, 39, 119, 0.1)', padding: '16px', borderRadius: '50%' }}>
                    <User size={32} />
                  </div>
                  <h3 className="mb-sm" style={{ fontSize: '1rem' }}>My Profile</h3>
                  <p className="text-muted text-xs">Account settings and preferences</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {skinInfo && profile && (
        <section className="section-sm">
          <div className="container-md">
            <div className="card" style={{ background: 'var(--grad-card)', border: '1px solid var(--clr-border)' }}>
              <div className="flex items-center gap-lg mb-lg">
                <div className="step-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <skinInfo.icon size={24} />
                </div>
                <div>
                  <h3>{skinInfo.label} Skin Overview</h3>
                  <p className="text-muted text-sm">{profile.detection_method === 'camera' && profile.confidence_score
                    ? `Camera confidence: ${Math.round(profile.confidence_score * 100)}%`
                    : `Detected via ${profile.detection_method}`}
                  </p>
                </div>
              </div>
              <div className="grid-2" style={{ gap: 'var(--sp-lg)', marginBottom: 'var(--sp-xl)' }}>
                <div style={{ background: 'rgba(255,255,255,0.4)', padding: 'var(--sp-md)', borderRadius: 'var(--r-md)' }}>
                  <div className="flex items-center gap-sm mb-sm">
                    <Sun size={14} style={{ color: 'var(--clr-primary)' }} />
                    <p className="text-sm font-weight-600" style={{ color: 'var(--clr-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem', margin: 0 }}>AM Tip</p>
                  </div>
                  <p className="text-muted text-sm">Keep it light and protected — SPF is mandatory, even indoors.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.4)', padding: 'var(--sp-md)', borderRadius: 'var(--r-md)' }}>
                  <div className="flex items-center gap-sm mb-sm">
                    <Moon size={14} style={{ color: 'var(--clr-secondary)' }} />
                    <p className="text-sm font-weight-600" style={{ color: 'var(--clr-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem', margin: 0 }}>PM Tip</p>
                  </div>
                  <p className="text-muted text-sm">Focus on repair and actives — your skin does its best regeneration overnight.</p>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-lg)' }}>
                <h4 style={{ marginBottom: 'var(--sp-sm)', fontSize: '1rem' }}>Your Skin Concerns</h4>
                <p className="text-muted text-sm mb-md">Select up to 3 concerns to get better product recommendations.</p>
                
                <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                  {CONCERNS_LIST.map(c => {
                    const isSelected = selectedConcerns.includes(c.id);
                    const isDisabled = !isSelected && selectedConcerns.length >= 3;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleToggleConcern(c.id)}
                        disabled={isDisabled}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '100px',
                          border: `1px solid ${isSelected ? 'var(--clr-primary)' : 'var(--clr-border)'}`,
                          background: isSelected ? 'rgba(244, 114, 182, 0.1)' : 'transparent',
                          color: isSelected ? 'var(--clr-primary)' : 'var(--clr-text)',
                          fontSize: '0.85rem',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.5 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
                
                {(!profile.concerns || JSON.stringify(profile.concerns) !== JSON.stringify(selectedConcerns)) && (
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={handleSaveConcerns}
                    disabled={savingConcerns}
                  >
                    {savingConcerns ? 'Saving...' : 'Save Concerns'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}
