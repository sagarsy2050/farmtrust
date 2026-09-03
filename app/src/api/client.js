// Frontend API client for the local Node/Express server. Every page calls
// api.entities.X / api.auth.X / api.functions.invoke / api.integrations.Core.*
// against our own backend — no third-party platform involved.
import { appParams } from '@/lib/app-params';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
const TOKEN_KEY = 'farmtrust_access_token'; // same key app-params.js already reads/writes

let tokenCache = appParams.token || localStorage.getItem(TOKEN_KEY) || null;

function getToken() { return tokenCache; }
function setToken(t) {
  tokenCache = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, serviceRole = false, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (serviceRole) headers['X-Service-Role'] = 'true';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch { /* no body */ }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function qs(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) if (v !== undefined && v !== null) p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
}

function makeEntity(name, { serviceRole = false } = {}) {
  const base = `/entities/${name}`;
  return {
    list: (sort, limit) => request(`${base}${qs({ sort, limit })}`, { serviceRole }),
    filter: (query = {}, sort, limit) => request(`${base}${qs({ ...query, sort, limit })}`, { serviceRole }),
    get: (id) => request(`${base}/${id}`, { serviceRole }),
    create: (data) => request(base, { method: 'POST', body: data, serviceRole }),
    update: (id, data) => request(`${base}/${id}`, { method: 'PATCH', body: data, serviceRole }),
    delete: (id) => request(`${base}/${id}`, { method: 'DELETE', serviceRole }),
  };
}

const ENTITY_NAMES = ['Document', 'Farm', 'Order', 'Product', 'Review', 'User', 'VerificationCheck'];
const TABLE_MAP = {
  Document: 'documents', Farm: 'farms', Order: 'orders', Product: 'products',
  Review: 'reviews', User: 'users', VerificationCheck: 'verification_checks',
};

function buildEntities(serviceRole) {
  const out = {};
  for (const name of ENTITY_NAMES) out[name] = makeEntity(TABLE_MAP[name], { serviceRole });
  return out;
}

const auth = {
  async me() {
    return request('/auth/me');
  },
  async loginViaEmailPassword(email, password) {
    const data = await request('/auth/login', { method: 'POST', body: { email, password } });
    setToken(data.access_token);
    return data.user;
  },
  async register({ email, password }) {
    return request('/auth/register', { method: 'POST', body: { email, password } });
  },
  async verifyOtp({ email, otpCode }) {
    const data = await request('/auth/verify-otp', { method: 'POST', body: { email, otpCode } });
    if (data.access_token) setToken(data.access_token);
    return data;
  },
  async resendOtp(email) {
    return request('/auth/resend-otp', { method: 'POST', body: { email } });
  },
  async resetPasswordRequest(email) {
    return request('/auth/forgot-password', { method: 'POST', body: { email } });
  },
  async resetPassword({ resetToken, newPassword }) {
    return request('/auth/reset-password', { method: 'POST', body: { resetToken, newPassword } });
  },
  async config() {
    return request('/auth/config');
  },
  setToken(t) { setToken(t); },
  loginWithProvider(provider, returnTo = '/') {
    if (provider !== 'google') throw new Error(`Unsupported provider: ${provider}`);
    window.location.href = `${API_BASE}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  },
  redirectToLogin(returnTo = '/') {
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  },
  logout(redirectTo) {
    setToken(null);
    if (redirectTo) window.location.href = redirectTo;
  },
};

export const api = {
  auth,
  entities: buildEntities(false),
  asServiceRole: {
    entities: buildEntities(true),
    integrations: {
      Core: {
        async CreateFileSignedUrl({ file_uri }) {
          return request('/upload/signed-url', { method: 'POST', body: { file_uri }, serviceRole: true });
        },
      },
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const form = new FormData();
        form.append('file', file);
        const data = await request('/upload', { method: 'POST', body: form, isForm: true });
        return data; // { file_url, file_name, ocr }
      },
      async CreateFileSignedUrl({ file_uri }) {
        return request('/upload/signed-url', { method: 'POST', body: { file_uri } });
      },
    },
  },
  functions: {
    async invoke(name, payload) {
      return request(`/functions/${name}`, { method: 'POST', body: payload });
    },
  },
  marketPrices: {
    async list(filters = {}) {
      return request(`/market-prices${qs(filters)}`);
    },
    async meta() {
      return request('/market-prices/meta');
    },
    async history({ commodity, city_region, market, days } = {}) {
      return request(`/market-prices/history${qs({ commodity, city_region, market, days })}`);
    },
    async adminStatus() {
      return request('/market-prices/admin/status');
    },
    async adminSync() {
      return request('/market-prices/admin/sync', { method: 'POST' });
    },
  },
  documentExtractions: {
    async save({ document_id, extraction }) {
      return request('/document-extractions', { method: 'POST', body: { document_id, extraction } });
    },
    async get(documentId) {
      return request(`/document-extractions/${documentId}`);
    },
  },
};
