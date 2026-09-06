import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoutineSteps, getProducts, saveRoutine, getSavedRoutines } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Star, AlertTriangle, Sun, Moon, Beaker, Droplet, Sparkles, Leaf } from 'lucide-react';

const SUITABILITY_LABELS = {
  highly_recommended: <><Star size={12} style={{ display: 'inline', marginRight: 4 }} /> Highly Recommended</>,
  recommended: '✓ Recommended',
  recommended_with_caution: <><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} /> Use with Caution</>,
  caution: <><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} /> Caution</>,
};

function SuitabilityPill({ value }) {
  return (
    <span className={`pill pill--${value}`}>
      {SUITABILITY_LABELS[value] || value?.replace(/_/g, ' ')}
    </span>
  );
}

const STEP_ICONS = {
  cleanser: Beaker,
  toner: Droplet,
  serum: Sparkles,
  moisturizer: Leaf,
  sunscreen: Sun,
};

function ProductMiniCard({ product, selected, onSelect }) {
  const bestPrice = product.best_price || (product.platform_listings ? Math.min(...product.platform_listings.map(l => Number(l.price))) : '—');
  return (
    <div
      className="card"
      style={{
        padding: 'var(--sp-md)',
        cursor: 'pointer',
        border: selected ? '1.5px solid var(--clr-primary)' : undefined,
        background: selected ? 'rgba(244,114,182,0.08)' : undefined,
        display: 'flex',
        gap: 'var(--sp-md)',
        alignItems: 'center',
      }}
      onClick={onSelect}
    >
      <div style={{ width: 60, height: 60, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--clr-bg-elevated)' }}>
        <img
          src={product.image_url}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.src = '/images/product_placeholder.jpg'; }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--clr-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{product.brand}</p>
        <p style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--clr-gold)' }}>₹{bestPrice}</p>
      </div>
      {selected && <span style={{ color: 'var(--clr-primary)', fontSize: '1.2rem' }}>✓</span>}
    </div>
  );
}

export default function RoutinePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const skinType = user?.skin_profile?.skin_type;

  const [time, setTime] = useState('am');
  const [steps, setSteps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [products, setProducts] = useState({});  // step -> products[]
  const [selections, setSelections] = useState({});  // step_id -> product_id | 'skip' | {type: 'own', ...}
  const [stepMode, setStepMode] = useState({}); // step_id -> 'recommend' | 'own'
  const [ownProductForm, setOwnProductForm] = useState({ name: '', ingredients: '' });
  const [checkingOwn, setCheckingOwn] = useState(false);
  const [ownProductError, setOwnProductError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleCheckOwnProduct = async (stepId) => {
    if (!ownProductForm.name.trim() && !ownProductForm.ingredients.trim()) return;
    setCheckingOwn(true);
    setOwnProductError(null);
    try {
      // Use dynamic import or just standard import for checkOwnProduct
      const { checkOwnProduct } = await import('../api');
      const res = await checkOwnProduct({
        skin_type: skinType,
        product_name: ownProductForm.name,
        ingredients: ownProductForm.ingredients.split(',').map(s => s.trim()).filter(Boolean)
      });
      
      setSelections(prev => ({
        ...prev,
        [stepId]: {
          type: 'own',
          product_name: ownProductForm.name,
          ingredients: ownProductForm.ingredients,
          conflicts: res.data.conflicts || [],
          status: res.data.status
        }
      }));
      setSaved(false);
      setOwnProductForm({ name: '', ingredients: '' }); // reset form
    } catch(e) {
      setOwnProductError("Failed to check product. Try again.");
    } finally {
      setCheckingOwn(false);
    }
  };

  // Load routine steps AND any previously saved routine
  useEffect(() => {
    if (!skinType) return;
    setLoading(true);
    setSaved(false);

    const loadData = async () => {
      try {
        // Fetch steps and products
        const stepsRes = await getRoutineSteps(skinType, time);
        setSteps(stepsRes.data.steps);
        setProfile(stepsRes.data.skin_profile);

        const productMap = {};
        await Promise.all(
          stepsRes.data.steps.map(async (step) => {
            try {
              const pr = await getProducts({ skin_type: skinType, step: step.step_id });
              productMap[step.step_id] = pr.data.products;
            } catch {
              productMap[step.step_id] = [];
            }
          })
        );
        setProducts(productMap);

        // Fetch saved routines and pre-populate selections
        try {
          const savedRes = await getSavedRoutines();
          const routines = savedRes.data.routines || [];
          const matchingRoutine = routines.find(r => r.am_pm === time && r.skin_type === skinType);
          if (matchingRoutine && matchingRoutine.step_selections) {
            setSelections(matchingRoutine.step_selections);
            setSaved(true);
          } else {
            setSelections({});
          }
        } catch {
          setSelections({});
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [skinType, time]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveRoutine({ skin_type: skinType, step_selections: selections, am_pm: time });
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!skinType) {
    return (
      <div className="page-container page-top">
        <Navbar />
        <div className="section text-center">
          <div className="container-sm">
            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--sp-lg)' }}>Discover your skin type first</h2>
            <button className="btn btn-primary" onClick={() => navigate('/skin-type')}>Get Started →</button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="text-muted">Building your routine…</p>
      </div>
    );
  }

  const currentStep = steps[activeStep];
  const CurrentStepIcon = currentStep ? (STEP_ICONS[currentStep.step_id] || Sparkles) : Sparkles;

  return (
    <div className="page-container page-top">
      <Navbar />

      {/* Header */}
      <section className="section-sm" style={{ borderBottom: '1px solid var(--clr-border)', background: 'var(--grad-hero)' }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--sp-md)' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--sp-sm)' }}>
                Your <span className="text-gradient">{profile?.label || skinType}</span> Routine
              </h1>
              <p className="text-muted text-sm">{profile?.description}</p>
            </div>
            <div className="tabs" style={{ minWidth: 200 }}>
              <button className={`tab-btn${time === 'am' ? ' active' : ''}`} onClick={() => setTime('am')}>
                <Sun size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> Morning
              </button>
              <button className={`tab-btn${time === 'pm' ? ' active' : ''}`} onClick={() => setTime('pm')}>
                <Moon size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} /> Evening
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--sp-xl)', alignItems: 'start' }}>

            {/* Step sidebar */}
            <div className="flex flex-col gap-sm" style={{ position: 'sticky', top: 90 }}>
              {steps.map((step, idx) => {
                const SidebarIcon = STEP_ICONS[step.step_id] || Sparkles;
                return (
                <button
                  key={step.step_id}
                  className={`card${idx === activeStep ? ' active' : ''}`}
                  style={{
                    padding: 'var(--sp-md) var(--sp-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-md)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: idx === activeStep ? 'rgba(244,114,182,0.08)' : 'var(--clr-bg-card)',
                    borderColor: idx === activeStep ? 'var(--clr-primary)' : 'var(--clr-border)',
                  }}
                  onClick={() => setActiveStep(idx)}
                >
                  <span className="step-number">{idx + 1}</span>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <SidebarIcon size={20} color={idx === activeStep ? 'var(--clr-primary)' : 'var(--clr-text)'} />
                  </span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{step.label}</p>
                    {selections[step.step_id] === 'skip' ? (
                      <p style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>Skipped</p>
                    ) : typeof selections[step.step_id] === 'object' && selections[step.step_id]?.type === 'own' ? (
                      <p style={{ fontSize: '0.7rem', color: 'var(--clr-primary)' }}>✓ Own product</p>
                    ) : selections[step.step_id] ? (
                      <p style={{ fontSize: '0.7rem', color: 'var(--clr-primary)' }}>✓ Product selected</p>
                    ) : null}
                  </div>
                </button>
                );
              })}

              {Object.keys(selections).length > 0 && (
                <button
                  className="btn btn-primary mt-md"
                  onClick={saved ? () => navigate('/dashboard') : handleSave}
                  disabled={saving}
                >
                  {saved ? '✓ Routine Saved!' : saving ? 'Saving…' : 'Save My Routine'}
                </button>
              )}
            </div>

            {/* Step detail */}
            {currentStep && (
              <div className="animate-in" key={currentStep.step_id}>
                {/* Step header */}
                <div className="flex items-center gap-lg mb-xl">
                  <div className="step-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CurrentStepIcon size={28} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-serif)' }}>{currentStep.label}</h2>
                    <p className="text-muted text-sm">{currentStep.description}</p>
                    {currentStep.skippable && <span className="pill pill--recommended mt-sm">Optional step</span>}
                  </div>
                </div>

                {/* Recommended ingredients */}
                {currentStep.ingredients.length > 0 && (
                  <div className="card mb-xl">
                    <h4 className="mb-lg" style={{ color: 'var(--clr-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      Recommended Ingredients for Your Skin
                    </h4>
                    <div className="flex flex-col gap-md">
                      {currentStep.ingredients.map((ing) => (
                        <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-md)', paddingBottom: 'var(--sp-md)', borderBottom: '1px solid var(--clr-border)' }}>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{ing.name}</p>
                            <p className="text-muted text-xs mt-sm">{ing.function}</p>
                          </div>
                          <SuitabilityPill value={ing.suitability} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3-Way Choice */}
                <div className="flex gap-sm mb-lg" style={{ flexWrap: 'wrap' }}>
                  <button 
                    className={`btn btn-sm ${(!stepMode[currentStep.step_id] || stepMode[currentStep.step_id] === 'recommend') ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setStepMode({ ...stepMode, [currentStep.step_id]: 'recommend' })}
                  >
                    Recommend me one
                  </button>
                  <button 
                    className={`btn btn-sm ${stepMode[currentStep.step_id] === 'own' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setStepMode({ ...stepMode, [currentStep.step_id]: 'own' })}
                  >
                    I use my own
                  </button>
                  <button 
                    className={`btn btn-sm ${selections[currentStep.step_id] === 'skip' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => {
                      setSelections(prev => ({ ...prev, [currentStep.step_id]: 'skip' }));
                      setSaved(false);
                    }}
                  >
                    Skip this step
                  </button>
                </div>

                {selections[currentStep.step_id] === 'skip' && (
                  <div className="card text-center mb-xl" style={{ padding: 'var(--sp-xl)', background: 'rgba(219,39,119,0.03)' }}>
                    <p>You have skipped this step.</p>
                  </div>
                )}

                {stepMode[currentStep.step_id] === 'own' && selections[currentStep.step_id] !== 'skip' && (
                  <div className="card mb-xl" style={{ padding: 'var(--sp-lg)' }}>
                    {typeof selections[currentStep.step_id] === 'object' && selections[currentStep.step_id]?.type === 'own' ? (
                      <div>
                        <div className="flex items-center justify-between mb-sm">
                          <h4 style={{ fontWeight: 600 }}>{selections[currentStep.step_id].product_name || 'Custom Product'}</h4>
                          <button className="btn btn-ghost btn-sm" onClick={() => {
                            setSelections(prev => ({ ...prev, [currentStep.step_id]: undefined }));
                            setSaved(false);
                          }}>Remove</button>
                        </div>
                        {selections[currentStep.step_id].conflicts?.length > 0 ? (
                          <div style={{ background: 'rgba(248,113,113,0.1)', padding: 'var(--sp-md)', borderRadius: 'var(--r-md)', border: '1px solid rgba(248,113,113,0.3)' }}>
                            <p style={{ color: 'var(--clr-avoid)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}><AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/> Ingredient Conflicts Found</p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.85rem' }}>
                              {selections[currentStep.step_id].conflicts.map((c, i) => (
                                <li key={i} style={{ marginBottom: '4px' }}>{c.message}</li>
                              ))}
                            </ul>
                          </div>
                        ) : selections[currentStep.step_id].status === 'safe' ? (
                          <div style={{ color: 'var(--clr-normal)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}><Star size={14} /> This product looks safe for your skin type.</div>
                        ) : (
                          <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Saved custom product.</div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <h4 className="mb-md" style={{ fontSize: '1rem', fontWeight: 600 }}>Check your own product</h4>
                        <p className="text-muted text-sm mb-md">Enter the product name and key ingredients to check for conflicts with your skin type.</p>
                        <div className="form-group mb-md">
                          <input type="text" className="form-input" placeholder="Product Name (Optional)" value={ownProductForm.name} onChange={e => setOwnProductForm({...ownProductForm, name: e.target.value})} />
                        </div>
                        <div className="form-group mb-md">
                          <textarea className="form-input" placeholder="Ingredients (comma separated, e.g. Niacinamide, Salicylic Acid)" value={ownProductForm.ingredients} onChange={e => setOwnProductForm({...ownProductForm, ingredients: e.target.value})} rows={3} />
                        </div>
                        {ownProductError && <p className="text-sm" style={{ color: 'var(--clr-avoid)' }}>{ownProductError}</p>}
                        <button className="btn btn-primary" onClick={() => handleCheckOwnProduct(currentStep.step_id)} disabled={checkingOwn || (!ownProductForm.name && !ownProductForm.ingredients)}>
                          {checkingOwn ? 'Checking...' : 'Save & Check Product'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(!stepMode[currentStep.step_id] || stepMode[currentStep.step_id] === 'recommend') && selections[currentStep.step_id] !== 'skip' && (
                  <div>
                    {(products[currentStep.step_id] || []).length === 0 ? (
                      <p className="text-muted text-sm">No products found for this step and skin type.</p>
                    ) : (
                      <div className="flex flex-col gap-md">
                        {(products[currentStep.step_id] || []).map((product) => (
                          <ProductMiniCard
                            key={product.id}
                            product={product}
                            selected={selections[currentStep.step_id] === product.id}
                            onSelect={() => {
                              setSelections((prev) => ({
                                ...prev,
                                [currentStep.step_id]: prev[currentStep.step_id] === product.id ? undefined : product.id,
                              }));
                              setSaved(false);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-xl">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    disabled={activeStep === 0}
                  >
                    ← Previous Step
                  </button>
                  {activeStep < steps.length - 1 ? (
                    <button className="btn btn-primary" onClick={() => setActiveStep(activeStep + 1)}>
                      Next: {steps[activeStep + 1]?.label} →
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || saved}>
                      {saved ? '✓ Saved!' : saving ? 'Saving…' : 'Save Routine →'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
