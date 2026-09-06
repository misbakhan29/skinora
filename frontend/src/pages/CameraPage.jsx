import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzePhoto } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Sparkles, Droplet, Flower2, Zap, Leaf, Shield, Lock, Camera, Upload, Ban, AlertTriangle } from 'lucide-react';

export default function CameraPage() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef(null);

  const [mode, setMode] = useState(null); // null | 'camera' | 'upload'
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setMode('camera');
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraReady(true);
        };
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings, or use the file upload option below.'
          : err.name === 'NotFoundError'
          ? 'No camera detected on this device. Please use the file upload option instead.'
          : `Could not access camera: ${err.message}. Try the file upload option instead.`
      );
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Capture photo with countdown
  const capturePhoto = useCallback(() => {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);

        // Capture frame from video
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          // Mirror the image (selfie mode)
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0);
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              const capturedFile = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
              setFile(capturedFile);
              setPreview(URL.createObjectURL(blob));
              stopCamera();
            }
          }, 'image/jpeg', 0.9);
        }
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [stopCamera]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    stopCamera();
    setMode('upload');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await analyzePhoto(formData);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    stopCamera();
    setMode(null);
    setPreview(null);
    setFile(null);
    setResult(null);
    setError(null);
    setCountdown(null);
  };

  const SKIN_TYPE_INFO = {
    normal: { icon: Sparkles, label: 'Normal' }, oily: { icon: Droplet, label: 'Oily' },
    dry: { icon: Flower2, label: 'Dry' }, combination: { icon: Zap, label: 'Combination' },
    sensitive: { icon: Leaf, label: 'Sensitive' }, acne_prone: { icon: Shield, label: 'Acne-Prone' },
  };

  return (
    <div className="page-container page-top">
      <Navbar />
      <section className="section">
        <div className="container-sm">
          <div className="text-center mb-xl animate-in">
            <h1 style={{ fontFamily: 'var(--font-serif)' }}>Camera <span className="text-gradient">Analysis</span></h1>
            <p className="text-muted mt-sm">Our AI analyzes your skin from a photo. Fast, private, and accurate.</p>
            <div className="alert alert--info mt-lg" style={{ textAlign: 'left', display: 'inline-flex', alignItems: 'center' }}>
              <Lock size={14} style={{ marginRight: 6, flexShrink: 0 }} /> Your photo is analyzed in real time and <strong style={{ marginLeft: 4 }}>never stored</strong> on our servers.
            </div>
          </div>

          {/* Mode selection — no photo yet */}
          {!preview && mode !== 'camera' && (
            <div className="animate-in">
              <div className="flex flex-col gap-md" style={{ maxWidth: 480, margin: '0 auto' }}>
                {/* Live camera option */}
                <div
                  className="card"
                  style={{ cursor: 'pointer', display: 'flex', gap: 'var(--sp-lg)', alignItems: 'center', padding: 'var(--sp-xl)' }}
                  onClick={startCamera}
                >
                  <div style={{ color: 'var(--clr-primary)' }}><Camera size={40} strokeWidth={1.5} /></div>
                  <div>
                    <h3 className="mb-sm">Take a Live Photo</h3>
                    <p className="text-muted text-sm">Use your webcam — we'll capture your face with a 3-second countdown.</p>
                  </div>
                </div>

                {/* Upload option */}
                <div
                  className="card"
                  style={{ cursor: 'pointer', display: 'flex', gap: 'var(--sp-lg)', alignItems: 'center', padding: 'var(--sp-xl)' }}
                  onClick={() => fileRef.current.click()}
                >
                  <div style={{ color: 'var(--clr-primary)' }}><Upload size={40} strokeWidth={1.5} /></div>
                  <div>
                    <h3 className="mb-sm">Upload a Photo</h3>
                    <p className="text-muted text-sm">Choose a photo from your device — good lighting, no heavy makeup.</p>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
              </div>
            </div>
          )}

          {/* Live camera view */}
          {mode === 'camera' && !preview && (
            <div className="animate-in">
              {cameraError ? (
                <div className="card text-center" style={{ maxWidth: 480, margin: '0 auto', padding: 'var(--sp-xl)' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-lg)', color: '#f87171' }}><Ban size={48} strokeWidth={1.5} /></div>
                  <p className="text-muted mb-lg">{cameraError}</p>
                  <div className="flex gap-md justify-center">
                    <button className="btn btn-outline" onClick={() => fileRef.current.click()}>
                      Upload Photo Instead
                    </button>
                    <button className="btn btn-ghost" onClick={resetAll}>← Back</button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                </div>
              ) : (
                <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative' }}>
                  <div style={{ position: 'relative', borderRadius: 'var(--r-xl)', overflow: 'hidden', border: '2px solid var(--clr-border-glow)', background: '#000' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', display: 'block', transform: 'scaleX(-1)' }}
                    />
                    {/* Countdown overlay */}
                    {countdown !== null && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                      }}>
                        <span style={{ fontSize: '6rem', fontWeight: 700, color: '#fff', textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
                          {countdown}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-md justify-center mt-lg">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={capturePhoto}
                      disabled={!cameraReady || countdown !== null}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {!cameraReady ? 'Starting camera…' : countdown !== null ? `${countdown}…` : <><Camera size={18} /> Capture Photo</>}
                    </button>
                    <button className="btn btn-ghost" onClick={resetAll}>Cancel</button>
                  </div>

                  <p className="text-center text-muted text-xs mt-md">
                    Look directly at the camera, good lighting, no heavy makeup.
                  </p>
                </div>
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          {/* Preview + Analyze */}
          {preview && (
            <div className="animate-in">
              <div style={{ position: 'relative', maxWidth: 360, margin: '0 auto', marginBottom: 'var(--sp-xl)' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: 'var(--r-xl)', border: '2px solid var(--clr-border-glow)' }} />
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--r-full)', color: '#fff' }}
                  onClick={resetAll}
                >
                  ✕ Retake
                </button>
              </div>

              {!result && (
                <div className="text-center">
                  <button className="btn btn-primary btn-lg" onClick={handleAnalyze} disabled={loading}>
                    {loading ? <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Analyzing…</> : 'Analyze My Skin →'}
                  </button>
                </div>
              )}

              {error && <div className="alert alert--danger mt-lg">{error}</div>}

              {result && (
                <div className="card animate-in mt-xl">
                  {result.note && <div className="alert alert--warning mb-lg">{result.note}</div>}

                  <div className="text-center mb-xl">
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-md)', color: 'var(--clr-primary)' }}>
                      {(() => {
                        const IconComponent = SKIN_TYPE_INFO[result.skin_type]?.icon || Sparkles;
                        return <IconComponent size={64} strokeWidth={1.5} />;
                      })()}
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-serif)' }}>
                      {SKIN_TYPE_INFO[result.skin_type]?.label} Skin
                    </h2>
                    <p className="text-muted mt-sm">Confidence: <strong style={{ color: result.confidence >= 0.65 ? 'var(--clr-highly)' : 'var(--clr-caution)' }}>{result.confidence_label}</strong></p>

                    {/* Confidence bar */}
                    <div style={{ maxWidth: 300, margin: '16px auto 0' }}>
                      <div style={{ height: 6, background: 'rgba(219,39,119,0.1)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${result.confidence * 100}%`, background: result.confidence >= 0.65 ? 'var(--grad-primary)' : 'var(--clr-caution)', borderRadius: 'var(--r-full)', transition: 'width 1s ease' }} />
                      </div>
                    </div>
                  </div>

                  {result.suggest_quiz_fallback && (
                    <div className="alert alert--warning mb-lg" style={{ display: 'flex', alignItems: 'center' }}>
                      <AlertTriangle size={16} style={{ marginRight: 8, flexShrink: 0 }} />
                      <span>Confidence is low. We recommend <strong>confirming with the quiz</strong> for a more accurate result.</span>
                    </div>
                  )}

                  <p className="text-xs text-muted text-center mb-xl">{result.privacy_note}</p>

                  <div className="flex gap-md justify-center">
                    {result.suggest_quiz_fallback && (
                      <button className="btn btn-outline" onClick={() => navigate('/quiz')}>Take the Quiz</button>
                    )}
                    <button className="btn btn-primary" onClick={() => navigate('/routine')}>
                      Build My Routine →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-xl">
            <button className="btn btn-ghost" onClick={() => navigate('/skin-type')}>← Back to detection options</button>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
