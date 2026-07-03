const App = {
  user: null,
  settings: {},

  async init() {
    this.startClock();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        this.user = await API.get('/me');
        this.settings = await API.get('/settings');
        await this.startApp();
      } catch { this.showAuth(); }
    } else { this.showAuth(); }
  },

  async login() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    errEl.textContent = ''; btn.disabled = true; btn.textContent = 'Ingresando...';
    try {
      const data = await API.authPost('/login', { email, password: pass });
      localStorage.setItem('token', data.token);
      this.user = data.user;
      this.settings = await API.get('/settings');
      await this.startApp();
    } catch(e) { errEl.textContent = e.error || 'Error al ingresar'; }
    btn.disabled = false; btn.textContent = 'Ingresar';
  },

  async register() {
    const displayName = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value;
    const errEl = document.getElementById('regError');
    const btn = document.getElementById('regBtn');
    errEl.textContent = ''; btn.disabled = true; btn.textContent = 'Creando...';
    try {
      const data = await API.authPost('/register', { displayName, username, email, password });
      localStorage.setItem('token', data.token);
      this.user = data.user;
      this.settings = await API.get('/settings');
      await this.startApp();
    } catch(e) { errEl.textContent = e.error || 'Error al registrar'; }
    btn.disabled = false; btn.textContent = 'Crear cuenta';
  },

  async startApp() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    this.applyUserTheme();
    this.updateUserUI();
    Pomo.init();
    Music.init();
    await Promise.all([Tasks.load(), Habits.load(), Notes.load(), Cal.load()]);
    this.updateDashStats();
    Settings.load();
  },

  applyUserTheme() {
    if (this.user.accentColor) {
      document.documentElement.style.setProperty('--accent', this.user.accentColor);
      document.documentElement.style.setProperty('--accent-rgb', hexToRgb(this.user.accentColor));
    }
    if (this.user.theme === 'light') document.documentElement.dataset.theme = 'light';
  },

  updateUserUI() {
    const name = this.user.displayName || this.user.username || 'Usuario';
    const initial = name[0].toUpperCase();
    document.getElementById('avatarBtn').textContent = initial;
    document.getElementById('menuName').textContent = name;
    document.getElementById('menuEmail').textContent = this.user.email;
    document.getElementById('greetingName').textContent = name + '.';
    document.getElementById('greetingSub').textContent = this.getMotivation();
  },

  updateDashStats() {
    const done = Tasks.data.filter(t=>t.done).length;
    const total = Tasks.data.length || 1;
    const todayHabits = Habits.data.filter(h=>h.checks&&h.checks[6]).length;
    const habitRate = Habits.data.length ? Math.round(todayHabits/Habits.data.length*100) : 0;
    const focusMins = Math.round(Pomo.focusMins);
    document.getElementById('miniStats').innerHTML = `
      <div class="mini-stat"><div class="mini-stat-num">${done}/${Tasks.data.length}</div><div class="mini-stat-label">Tareas</div></div>
      <div class="mini-stat"><div class="mini-stat-num" style="color:var(--good)">${habitRate}%</div><div class="mini-stat-label">Hábitos</div></div>
      <div class="mini-stat"><div class="mini-stat-num" style="color:var(--accent2)">${focusMins}m</div><div class="mini-stat-label">Foco</div></div>`;
    const h = new Date().getHours();
    document.getElementById('greetingText').innerHTML = `${h<12?'Buenos días':h<18?'Buenas tardes':'Buenas noches'},<br><span class="accent-text" id="greetingName">${this.user.displayName||this.user.username}.</span>`;
  },

  getMotivation() {
    const msgs = ['¿Qué vas a conquistar hoy?','Cada día cuenta. ¡Vamos!','Un hábito a la vez.','El foco es tu superpoder.','Hoy es un buen día para crecer.'];
    return msgs[Math.floor(Math.random()*msgs.length)];
  },

  switchPanel(name, btn) {
    document.querySelectorAll('.panel-section').forEach(p=>p.classList.remove('active'));
    const target = document.getElementById('panel-'+name);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (name==='settings-profile') Settings.load();
    if (name==='habits') Habits.render();
    if (name==='notes') Notes.render();
    if (name==='calendar') Cal.renderGrid();
    // close menus
    document.getElementById('userMenu').style.display='none';
  },

  toggleSettings() {
    const d = document.getElementById('settingsDrawer');
    d.style.display = d.style.display==='none' ? 'block' : 'none';
    Settings.renderSwatches('drawerSwatches', this.user?.accentColor);
  },

  toggleMusic() {
    const p = document.getElementById('musicPlayer');
    const isOpen = p.style.display !== 'none';
    p.style.display = isOpen ? 'none' : 'block';
    document.getElementById('musicBtn').classList.toggle('active', !isOpen);
  },

  toggleUserMenu() {
    const m = document.getElementById('userMenu');
    m.style.display = m.style.display==='none' ? 'block' : 'none';
  },

  logout() {
    localStorage.removeItem('token');
    this.user = null;
    document.getElementById('appScreen').style.display='none';
    document.getElementById('authScreen').style.display='flex';
    document.getElementById('loginEmail').value='';
    document.getElementById('loginPass').value='';
    document.getElementById('loginError').textContent='';
    this.showLogin();
  },

  showLogin() {
    document.getElementById('loginForm').style.display='block';
    document.getElementById('registerForm').style.display='none';
  },
  showRegister() {
    document.getElementById('loginForm').style.display='none';
    document.getElementById('registerForm').style.display='block';
  },

  startClock() {
    const tick = () => {
      const n = new Date();
      const h=String(n.getHours()).padStart(2,'0'), m=String(n.getMinutes()).padStart(2,'0'), s=String(n.getSeconds()).padStart(2,'0');
      const clockEl = document.getElementById('topClock');
      if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;
      const days=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
      const months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const dateEl = document.getElementById('topDate');
      if (dateEl) dateEl.textContent = `${days[n.getDay()]} ${n.getDate()} ${months[n.getMonth()]}`;
    };
    tick(); setInterval(tick, 1000);
  },

  showAuth() {
    document.getElementById('authScreen').style.display='flex';
    document.getElementById('appScreen').style.display='none';
  }
};

// Enter key on login/register
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginPass')?.addEventListener('keydown', e=>{ if(e.key==='Enter') App.login(); });
  document.getElementById('regPass')?.addEventListener('keydown', e=>{ if(e.key==='Enter') App.register(); });
  App.init();
});

// Close menus clicking outside
document.addEventListener('click', e=>{
  if (!e.target.closest('#userMenu') && !e.target.closest('#avatarBtn'))
    document.getElementById('userMenu').style.display='none';
  if (!e.target.closest('#settingsDrawer') && !e.target.closest('#musicBtn') && !e.target.closest('.icon-btn'))
    if (e.target.id!=='settingsDrawer') {}
});
