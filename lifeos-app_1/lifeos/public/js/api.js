const API = {
  base: '/api',
  token: () => localStorage.getItem('token'),
  headers() { return { 'Content-Type':'application/json', 'Authorization':'Bearer '+this.token() }; },
  async get(path) {
    const r = await fetch(this.base+path, { headers: this.headers() });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async post(path, body) {
    const r = await fetch(this.base+path, { method:'POST', headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async put(path, body) {
    const r = await fetch(this.base+path, { method:'PUT', headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async del(path) {
    const r = await fetch(this.base+path, { method:'DELETE', headers: this.headers() });
    if (!r.ok) throw await r.json();
    return r.json();
  },
  async authPost(path, body) {
    const r = await fetch('/api/auth'+path, { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await r.json();
    if (!r.ok) throw data;
    return data;
  }
};
