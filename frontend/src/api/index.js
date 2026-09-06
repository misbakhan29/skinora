import api from './client';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

export const getQuizQuestions = () => api.get('/quiz/questions');
export const submitQuiz = (answers) => api.post('/quiz/submit', { answers });

export const getRoutineSteps = (skinType, time = 'am') =>
  api.get(`/routine/steps?skin_type=${skinType}&time=${time}`);
export const saveRoutine = (data) => api.post('/routine/save', data);
export const getSavedRoutines = () => api.get('/routine/saved');
export const setSkinTypeManually = (skinType) =>
  api.post('/routine/set-skin-type', { skin_type: skinType });
export const setConcerns = (concerns) =>
  api.post('/routine/set-concerns', { concerns });
export const checkOwnProduct = (data) => api.post('/routine/check-own-product', data);

export const getProducts = (params = {}) => api.get('/products', { params });
export const getRecommendedProducts = (params = {}) => api.get('/products/recommended', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const compareProductPrices = (id) => api.get(`/products/${id}/compare`);

export const getIngredients = (params = {}) => api.get('/ingredients', { params });
export const checkIngredientConflicts = (ingredients, skinType) =>
  api.post('/ingredients/check-conflict', { ingredients, skin_type: skinType });

export const analyzePhoto = (formData) =>
  api.post('/camera/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
