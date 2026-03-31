const BASE = "https://salonpro.pythonanywhere.com/api";

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem("access");
export const getRefreshToken = () => localStorage.getItem("refresh");
export const saveTokens      = (access, refresh) => {
  localStorage.setItem("access",  access);
  localStorage.setItem("refresh", refresh);
};
export const clearTokens = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
};
export const getUser  = () => {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
};
export const saveUser = (u) => localStorage.setItem("user", JSON.stringify(u));

// ─── LANGUAGE HEADER ──────────────────────────────────────────────────────────
const getLangHeader = () => ({ "Accept-Language": localStorage.getItem("lang") || "uz" });

// ─── BASE FETCH (with auto token refresh) ────────────────────────────────────
export async function apiFetch(url, options = {}) {
  const token = getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...getLangHeader(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let res = await fetch(url, { ...options, headers });

  // Try refresh once on 401
  if (res.status === 401) {
    const refresh = getRefreshToken();
    if (refresh) {
      const rRes = await fetch(`${BASE}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (rRes.ok) {
        const data = await rRes.json();
        saveTokens(data.access, refresh);
        headers.Authorization = `Bearer ${data.access}`;
        res = await fetch(url, { ...options, headers });
      } else {
        clearTokens();
        window.location.href = "/login";
        return null;
      }
    } else {
      clearTokens();
      window.location.href = "/login";
      return null;
    }
  }
  return res;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export async function login(username, password) {
  const res = await fetch(`${BASE}/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Username yoki parol noto'g'ri");
  }
  const { access, refresh } = await res.json();
  saveTokens(access, refresh);
  return { access, refresh };
}

export async function register(username, email, password) {
  const res = await fetch(`${BASE}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.username?.[0] || err.email?.[0] || err.password?.[0] || err.detail || "Xatolik yuz berdi";
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchMe() {
  const res = await apiFetch(`${BASE}/me/`);
  if (!res || !res.ok) throw new Error("Profil yuklanmadi");
  const user = await res.json();
  saveUser(user);
  return user;
}

export async function updateMe(profileData) {
  const res = await apiFetch(`${BASE}/me/`, {
    method: "PATCH",
    body: JSON.stringify({ profile: profileData }),
  });
  if (!res || !res.ok) throw new Error("Saqlashda xatolik");
  return res.json();
}

export function logout() {
  clearTokens();
  window.location.href = "/login";
}

// ─── CLIENTS ──────────────────────────────────────────────────────────────────
export async function fetchClients() {
  const res = await apiFetch(`${BASE}/clients/`);
  if (!res || !res.ok) throw new Error("Mijozlar yuklanmadi");
  return res.json();
}

export async function createClient(data) {
  const res = await apiFetch(`${BASE}/clients/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res || !res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

export async function updateClient(id, data) {
  const res = await apiFetch(`${BASE}/clients/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!res || !res.ok) throw new Error("Yangilashda xatolik");
  return res.json();
}

export async function deleteClient(id) {
  const res = await apiFetch(`${BASE}/clients/${id}/`, { method: "DELETE" });
  if (!res || (res.status !== 204 && !res.ok)) throw new Error("O'chirishda xatolik");
}

// ─── MASTERS (public) ─────────────────────────────────────────────────────────
export async function fetchMasters() {
  const res = await fetch(`${BASE}/masters/`, {
    headers: { ...getLangHeader() },
  });
  if (!res.ok) throw new Error("Masterlar yuklanmadi");
  return res.json();
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
export async function fetchAdminStats() {
  const res = await apiFetch(`${BASE}/admin/stats/`);
  if (!res || !res.ok) throw new Error("Statistika yuklanmadi");
  return res.json();
}

export async function fetchUsers() {
  const res = await apiFetch(`${BASE}/users/`);
  if (!res || !res.ok) throw new Error("Foydalanuvchilar yuklanmadi");
  return res.json();
}

export async function createUser(data) {
  const res = await apiFetch(`${BASE}/users/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res || !res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Yaratishda xatolik");
  }
  return res.json();
}

export async function deleteUser(id) {
  const res = await apiFetch(`${BASE}/users/${id}/`, { method: "DELETE" });
  if (!res || (res.status !== 204 && !res.ok)) throw new Error("O'chirishda xatolik");
}

export async function makeAdmin(id) {
  const res = await apiFetch(`${BASE}/users/${id}/make-admin/`, { method: "POST" });
  if (!res || !res.ok) throw new Error("Xatolik");
  return res.json();
}

export async function removeAdmin(id) {
  const res = await apiFetch(`${BASE}/users/${id}/remove-admin/`, { method: "POST" });
  if (!res || !res.ok) throw new Error("Xatolik");
  return res.json();
}



export async function makeMaster(id) {
  const res = await apiFetch(`${BASE}/users/${id}/make-master/`, { method: "POST" });
  if (!res || !res.ok) throw new Error("Xatolik");
  return res.json();
}

export async function removeUser(id) {
  const res = await apiFetch(`${BASE}/users/${id}/make-user/`, { method: "POST" });
  if (!res || !res.ok) throw new Error("Xatolik");
  return res.json();
}

export async function fetchUserClients(id) {
  const res = await apiFetch(`${BASE}/users/${id}/clients/`);
  if (!res || !res.ok) throw new Error("Mijozlar yuklanmadi");
  return res.json();
}


// ─── TELEGRAM ─────────────────────────────────────────────────────────────────
export async function getTelegramLinkToken() {
  const res = await apiFetch(`${BASE}/telegram/link-token/`);
  if (!res || !res.ok) throw new Error("Token olishda xatolik");
  return res.json();
}

export async function unlinkTelegram() {
  const res = await apiFetch(`${BASE}/telegram/unlink/`, { method: "POST" });
  if (!res || !res.ok) throw new Error("Uzishda xatolik");
  return res.json();
}
