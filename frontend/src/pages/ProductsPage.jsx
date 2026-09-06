import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, getProduct, getRecommendedProducts } from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search as SearchIcon, X, ShoppingBag, ExternalLink, ShieldCheck } from 'lucide-react';

const STEPS = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen'];
const SKIN_TYPES = ['normal', 'oily', 'dry', 'combination', 'sensitive', 'acne_prone'];

function StarRating({ rating }) {
  const full = Math.round(rating);
  return <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)} <span className="text-muted text-xs">{rating}</span></span>;
}

const PLATFORM_COLORS = {
  amazon: '#ff9900', nykaa: '#e84d60', purplle: '#6818e4', myntra: '#ff3d7f',
};

export default function ProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const skinType = user?.skin_profile?.skin_type;
  const userConcerns = user?.skin_profile?.concerns || [];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [filters, setFilters] = useState({
    skin_type: skinType || '',
    step: '',
    sort: 'rating',
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchProducts = async (f = filters) => {
    setLoading(true);
    try {
      const params = {};
      if (f.skin_type) params.skin_type = f.skin_type;
      if (f.step) params.step = f.step;
      if (f.sort) params.sort = f.sort;
      const res = await getProducts(params);
      setProducts(res.data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    if (skinType && userConcerns.length > 0) {
      setRecLoading(true);
      getRecommendedProducts({ skin_type: skinType, concerns: userConcerns.join(',') })
        .then(res => setRecommendedProducts(res.data.products || []))
        .catch(console.error)
        .finally(() => setRecLoading(false));
    }
  }, [skinType, userConcerns.join(',')]);

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchProducts(newFilters);
  };

  const handleProductClick = async (product) => {
    setDetailLoading(true);
    setSelectedProduct(null);
    try {
      const res = await getProduct(product.id);
      setSelectedProduct(res.data.product);
    } catch (e) {
      console.error('Failed to load product details', e);
      setSelectedProduct(product);
    } finally {
      setDetailLoading(false);
    }
  };

  // Client-side instant search filtering
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(query);
      const matchBrand = p.brand.toLowerCase().includes(query);
      const matchCategory = p.step_category.toLowerCase().includes(query);
      const matchIngredients = p.key_ingredients?.some(ing => ing.toLowerCase().replace(/_/g, ' ').includes(query));
      
      return matchName || matchBrand || matchCategory || matchIngredients;
    });
  }, [products, searchQuery]);

  return (
    <div className="page-container page-top">
      <Navbar />

      {/* Header */}
      <section className="section-sm" style={{ borderBottom: '1px solid var(--clr-border)', background: 'rgba(255, 255, 255, 0.5)' }}>
        <div className="container">
          <h1 style={{ fontFamily: 'var(--font-serif)' }}>
            Product <span className="text-gradient">Browser</span>
          </h1>
          <p className="text-muted mt-sm">Curated products matched to your skin type, with real price comparison across Indian platforms.</p>
        </div>
      </section>

      <section className="section-sm">
        <div className="container">
          
          {/* Search Bar */}
          <div className="mb-lg">
            <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-faint)' }}>
                <SearchIcon size={20} />
              </div>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search products, brands, or ingredients (e.g. CeraVe, Niacinamide)..." 
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val && (filters.skin_type || filters.step)) {
                    setFilters({ ...filters, skin_type: '', step: '' });
                    fetchProducts({ ...filters, skin_type: '', step: '' });
                  }
                }}
                style={{ paddingLeft: '48px', paddingRight: '48px', borderRadius: '99px', background: 'var(--clr-card)', border: '1px solid var(--clr-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-faint)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Recommended Section */}
          {skinType && userConcerns.length > 0 && !searchQuery && !filters.step && (
            <div className="mb-2xl" style={{ background: 'var(--grad-card)', padding: 'var(--sp-xl)', borderRadius: 'var(--r-lg)', border: '1px solid var(--clr-border)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', marginBottom: 'var(--sp-xs)', fontSize: '1.6rem', color: 'var(--clr-primary)' }}>✨ Recommended for You</h2>
              <p className="text-muted mb-lg" style={{ fontSize: '0.9rem' }}>Based on your {skinType.replace('_', ' ')} skin and concerns: {userConcerns.join(', ')}.</p>
              
              {recLoading ? (
                <div className="flex justify-center" style={{ padding: 'var(--sp-xl)' }}>
                  <div className="spinner" />
                </div>
              ) : recommendedProducts.length > 0 ? (
                <div className="grid-3 stagger">
                  {recommendedProducts.map((product) => (
                    <div key={product.id + '-rec'} className="product-card animate-in" onClick={() => handleProductClick(product)} style={{ cursor: 'pointer', border: '1px solid rgba(244, 114, 182, 0.2)' }}>
                      <div className="product-card__img-placeholder" style={{ background: 'white' }}>
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="product-card__img"
                          style={{ display: 'block', objectFit: 'contain', padding: '16px' }}
                          onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E"; e.target.style.padding = '32px'; }}
                        />
                      </div>
                      <div className="product-card__body">
                        <span className="product-card__brand" style={{ fontWeight: 600 }}>{product.brand}</span>
                        <h4 className="product-card__name" style={{ marginBottom: '8px' }}>{product.name}</h4>
                        {product.recommendation_reason && (
                          <div style={{ background: 'rgba(244, 114, 182, 0.08)', padding: '8px', borderRadius: '4px', marginBottom: '8px', fontSize: '0.75rem', color: 'var(--clr-text)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--clr-primary)' }}>Why:</span> {product.recommendation_reason}
                          </div>
                        )}
                        <div className="flex items-center gap-sm">
                          <StarRating rating={product.avg_rating} />
                        </div>
                        <div className="flex items-center justify-between mt-sm">
                          <span className="product-card__price">₹{product.best_price}</span>
                          <span className="product-card__platforms text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShoppingBag size={12}/> {product.platform_count} platforms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No specific recommendations found.</p>
              )}
            </div>
          )}

          {/* All Products Header */}
          <div className="flex items-center justify-between mb-lg">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>All Products</h2>
          </div>

          {/* Filters */}
          <div className="card mb-xl" style={{ padding: 'var(--sp-lg)', display: 'flex', gap: 'var(--sp-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="form-group" style={{ flex: '1 1 180px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14}/> Skin Type</label>
              <select className="form-input" value={filters.skin_type} onChange={(e) => updateFilter('skin_type', e.target.value)}>
                <option value="">All Skin Types</option>
                {SKIN_TYPES.map((st) => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ flex: '1 1 180px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Routine Step</label>
              <select className="form-input" value={filters.step} onChange={(e) => updateFilter('step', e.target.value)}>
                <option value="">All Steps</option>
                {STEPS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ flex: '1 1 180px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Sort By</label>
              <select className="form-input" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}>
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Price</option>
                <option value="price_desc">Highest Price</option>
              </select>
            </div>

            <div style={{ alignSelf: 'flex-end', marginLeft: 'auto' }}>
              <span className="text-muted text-sm font-weight-600">{filteredProducts.length} products</span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center" style={{ padding: 'var(--sp-3xl)' }}>
              <div className="spinner" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center" style={{ padding: 'var(--sp-3xl) 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-md)', color: 'var(--clr-text-faint)' }}>
                <SearchIcon size={48} />
              </div>
              <h3>No products found</h3>
              <p className="text-muted">
                We couldn't find any products matching "{searchQuery}"
                {(filters.skin_type || filters.step) ? ' with your current filters.' : '.'}
              </p>
              <button className="btn btn-outline mt-lg" onClick={() => {
                setSearchQuery('');
                if (filters.skin_type || filters.step) {
                  const nf = { ...filters, skin_type: '', step: '' };
                  setFilters(nf);
                  fetchProducts(nf);
                }
              }}>Clear Search & Filters</button>
            </div>
          ) : (
            <div className="grid-4 stagger">
              {filteredProducts.map((product) => (
                <div key={product.id + '-' + filters.sort} className="product-card animate-in" onClick={() => handleProductClick(product)} style={{ cursor: 'pointer' }}>
                  <div className="product-card__img-placeholder" style={{ background: 'white' }}>
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="product-card__img"
                      style={{ display: 'block', objectFit: 'contain', padding: '16px' }}
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                        e.target.style.objectFit = 'contain';
                        e.target.style.padding = '32px';
                      }}
                    />
                  </div>
                  <div className="product-card__body">
                    <span className="product-card__brand" style={{ fontWeight: 600 }}>{product.brand}</span>
                    <h4 className="product-card__name" style={{ marginBottom: '8px' }}>{product.name}</h4>
                    <div className="flex items-center gap-sm">
                      <StarRating rating={product.avg_rating} />
                    </div>
                    <div className="flex items-center justify-between mt-sm">
                      <span className="product-card__price">₹{product.best_price}</span>
                      <span className="product-card__platforms text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ShoppingBag size={12}/> {product.platform_count} platforms</span>
                    </div>
                    <div className="mt-md">
                      <span className={`skin-badge skin-badge--${filters.skin_type || 'normal'}`} style={{ fontSize: '0.65rem', padding: '3px 10px' }}>
                        {product.step_category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Loading overlay for product detail */}
      {detailLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-lg)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedProduct(null); }}
        >
          <div className="card animate-in" style={{ maxWidth: 600, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: 'var(--sp-xl)', position: 'relative' }}>
            <button 
              className="btn btn-ghost" 
              onClick={() => setSelectedProduct(null)} 
              style={{ position: 'absolute', right: '16px', top: '16px', padding: '8px' }}
            >
              <X size={20} />
            </button>
            
            <div className="mb-lg" style={{ paddingRight: '32px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--clr-primary)' }}>{selectedProduct.brand}</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', marginTop: '4px' }}>{selectedProduct.name}</h2>
            </div>

            {/* Product image */}
            {selectedProduct.image_url && (
              <div style={{ marginBottom: 'var(--sp-xl)', borderRadius: 'var(--r-md)', overflow: 'hidden', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid var(--clr-border)' }}>
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }}
                  onError={(e) => { e.target.src = '/images/product_placeholder.jpg'; }}
                />
              </div>
            )}

            <p className="text-muted text-sm mb-lg" style={{ lineHeight: 1.6 }}>{selectedProduct.description}</p>
            
            {selectedProduct.recommendation_reason && (
              <div style={{ background: 'rgba(244, 114, 182, 0.08)', padding: '16px', borderRadius: 'var(--r-sm)', marginBottom: 'var(--sp-xl)', borderLeft: '3px solid var(--clr-primary)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text)', margin: 0 }}>
                  <span style={{ fontWeight: 700, color: 'var(--clr-primary)' }}>Why we recommend this: </span> 
                  {selectedProduct.recommendation_reason}
                </p>
              </div>
            )}

            {/* Key ingredients */}
            {selectedProduct.key_ingredients && selectedProduct.key_ingredients.length > 0 && (
              <div className="mb-xl">
                <h4 className="mb-md" style={{ color: 'var(--clr-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Key Ingredients</h4>
                <div className="flex" style={{ flexWrap: 'wrap', gap: 'var(--sp-sm)' }}>
                  {selectedProduct.key_ingredients.map((ing) => (
                    <span key={ing} className="pill pill--recommended" style={{ background: 'rgba(219,39,119,0.05)', border: '1px solid rgba(219,39,119,0.1)' }}>
                      {ing.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price comparison */}
            {selectedProduct.platform_listings && selectedProduct.platform_listings.length > 0 && (
              <div>
                <h4 className="mb-md" style={{ color: 'var(--clr-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  💰 Available On
                </h4>
                {[...selectedProduct.platform_listings]
                  .sort((a, b) => Number(a.price) - Number(b.price))
                  .map((listing, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: i === 0 ? 'rgba(219, 39, 119, 0.04)' : 'var(--clr-card)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-sm)', border: i === 0 ? '1px solid rgba(219, 39, 119, 0.2)' : '1px solid var(--clr-border)' }}>
                      <div className="flex items-center gap-md">
                        <span
                          className="platform-badge"
                          style={{ borderColor: `${PLATFORM_COLORS[listing.platform.toLowerCase()]}40`, color: PLATFORM_COLORS[listing.platform.toLowerCase()] || 'var(--clr-text)', background: 'white' }}
                        >
                          {listing.platform}
                        </span>
                        <div>
                          <StarRating rating={listing.rating} />
                          <p className="text-xs text-muted" style={{ marginTop: '2px' }}>{listing.review_count?.toLocaleString()} reviews</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-md">
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: i === 0 ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                            ₹{listing.price}
                          </span>
                          {i === 0 && <div style={{ fontSize: '0.65rem', color: 'var(--clr-primary)', fontWeight: 600 }}>Best Price</div>}
                        </div>
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {listing.platform.toLowerCase() === 'amazon' ? 'Buy on Amazon' : `Search on ${listing.platform}`} <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
