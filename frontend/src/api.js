import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

/* Attach JWT token from localStorage to every request */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lv_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Auth ──────────────────────────────────────────────────── */
export async function registerUser(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data;
}

export async function loginUser(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

/* ── Upload (text or file) ─────────────────────────────────── */
export async function createUpload(formData) {
  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/* ── Get metadata (public, no password) ────────────────────── */
export async function getMeta(slug) {
  const { data } = await api.get(`/${slug}/meta`);
  return data;
}

/* ── View / download (may need password) ───────────────────── */
export async function viewContent(slug, password = null) {
  const { data } = await api.post(`/${slug}/view`, { password });
  return data;
}

/* ── Manual delete ─────────────────────────────────────────── */
export async function deleteUpload(slug) {
  const { data } = await api.delete(`/${slug}`);
  return data;
}

/* ── My uploads (requires auth) ────────────────────────────── */
export async function getMyUploads() {
  const { data } = await api.get("/my-uploads");
  return data;
}
