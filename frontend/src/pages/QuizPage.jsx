import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuizQuestions, submitQuiz } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Sparkles, Droplet, Flower2, Zap, Leaf, Shield } from 'lucide-react';

const SKIN_TYPE_RESULTS = {
  normal:      { icon: Sparkles, label: 'Normal Skin',      color: 'var(--clr-normal)',      headline: 'Lucky you — balanced, beautiful skin!', body: 'Normal skin is the unicorn of skin types. You have balanced oil and moisture levels, minimal pores, and rarely experience major issues. Your routine can focus on maintenance and prevention.' },
  oily:        { icon: Droplet, label: 'Oily Skin',         color: 'var(--clr-oily)',        headline: 'That shine? We can work with it.', body: 'Oily skin means your sebaceous glands are overactive — but that also means you\'re less prone to premature wrinkles! The right niacinamide, BHA, and lightweight routine will balance everything out.' },
  dry:         { icon: Flower2, label: 'Dry Skin',           color: 'var(--clr-dry)',         headline: 'Your skin is thirsty — let\'s fix that.', body: 'Dry skin lacks moisture and often feels tight or flaky. The good news: with the right barrier-repairing routine (ceramides, HA, squalane), you can achieve a dewy, plump complexion.' },
  combination: { icon: Zap, label: 'Combination Skin',  color: 'var(--clr-combination)', headline: 'You contain multitudes — and we love that.', body: 'Combination skin requires zone-based thinking: targeting oiliness in the T-zone while keeping drier cheeks hydrated. Niacinamide is your best friend here.' },
  sensitive:   { icon: Leaf, label: 'Sensitive Skin',    color: 'var(--clr-sensitive)',   headline: 'Gentle is the way forward.', body: 'Sensitive skin reacts easily to new products, weather, and stress. Your routine will be minimal, barrier-focused, and fragrance-free — built around ceramides, centella, and mineral SPF.' },
  acne_prone:  { icon: Shield, label: 'Acne-Prone Skin', color: 'var(--clr-acne_prone)',  headline: 'Your skin needs a smart strategy.', body: 'Acne-prone skin benefits from targeted, science-backed actives — not harsh scrubbing. We\'ll build you a BHA-forward, niacinamide-powered routine that clears without destroying your barrier.' },
};

export default function QuizPage() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getQuizQuestions()
      .then((res) => { setQuestions(res.data.questions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const selectAnswer = (questionId, value) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Auto-advance after short delay
    setTimeout(async () => {
      if (current < questions.length - 1) {
        setCurrent((c) => c + 1);
      } else {
        // Last question — submit
        setSubmitting(true);
        try {
          const res = await submitQuiz(newAnswers);
          setResult(res.data);
          updateUser({ skin_profile: { skin_type: res.data.result_skin_type, detection_method: 'quiz' } });
        } catch (e) {
          console.error(e);
        } finally {
          setSubmitting(false);
        }
      }
    }, 250);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="text-muted">Loading quiz…</p>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="loading-screen">
        <div className="spinner pulse-glow" />
        <p className="text-muted">Analyzing your answers…</p>
      </div>
    );
  }

  if (result) {
    const info = SKIN_TYPE_RESULTS[result.result_skin_type];
    return (
      <div className="page-container page-top">
        <Navbar />
        <section className="section">
          <div className="container-sm text-center animate-in">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-lg)', animation: 'fadeInUp 0.6s ease', color: info.color }}>
              <info.icon size={80} strokeWidth={1.5} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: info.color, marginBottom: 'var(--sp-md)' }}>
              {info.label}
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--clr-text)', marginBottom: 'var(--sp-md)' }}>{info.headline}</p>
            <p className="text-muted mb-xl">{info.body}</p>

            {/* Score breakdown */}
            <div className="card mb-xl" style={{ textAlign: 'left' }}>
              <h4 className="mb-lg" style={{ textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Score Breakdown</h4>
              {Object.entries(result.scores)
                .sort(([,a],[,b]) => b - a)
                .map(([type, score]) => {
                  const info = SKIN_TYPE_RESULTS[type];
                  return (
                    <div key={type} className="flex items-center gap-md mb-sm">
                      <span style={{ width: 100, fontSize: '0.8rem', color: 'var(--clr-text-muted)', flexShrink: 0 }}>{info?.label}</span>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, background: info?.color || 'var(--clr-primary)', borderRadius: 'var(--r-full)', transition: 'width 1s ease' }} />
                      </div>
                      <span style={{ width: 40, textAlign: 'right', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{score}%</span>
                    </div>
                  );
                })
              }
            </div>

            <div className="flex gap-md justify-center">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/routine')}>
                Build My Routine →
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const question = questions[current];
  const progress = ((current) / questions.length) * 100;

  return (
    <div className="page-container page-top">
      <Navbar />

      <section className="section">
        <div className="container-sm">
          {/* Progress bar */}
          <div className="flex items-center gap-md mb-xl">
            <button className="btn btn-ghost btn-sm" onClick={() => current > 0 ? setCurrent(c => c - 1) : navigate('/skin-type')}>
              ←
            </button>
            <div style={{ flex: 1 }}>
              <div className="quiz-progress">
                <div className="quiz-progress__bar" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="text-xs text-muted">{current + 1}/{questions.length}</span>
          </div>

          {/* Question */}
          <div className="animate-in" key={question.id}>
            <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--sp-xl)', lineHeight: 1.35 }}>
              {question.text}
            </h2>

            <div className="flex flex-col gap-md">
              {question.options.map((opt) => (
                <button
                  key={opt.value}
                  className={`option-btn${answers[question.id] === opt.value ? ' selected' : ''}`}
                  onClick={() => selectAnswer(question.id, opt.value)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
