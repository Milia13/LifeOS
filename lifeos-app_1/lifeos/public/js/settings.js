const ACCENT_COLORS = ['#c8f135','#7c6af7','#5dd88a','#f17070','#f0a34a','#60b4f7','#f06aba','#ffffff'];

const Settings = {
  async load() {
    const user = App.user;
    document.getElementById('settingName').value = user.displayName || '';
    document.getElementById('settingEmail').value = user.email || '';
    const s = await API.get('/settings');
    document.getElementById('pomFocus').value = s.pomodoroFocus || 25;
    document.getElementById('pomShort').value = s.pomodoroShort || 5;
    document.getElementById('pomLong').value = s.pomodoroLong || 15;
    document.getElementById('pomFocusVal').textContent = s.pomodoroFocus || 25;
    document.getElementById('pomShortVal').textContent = s.pomodoroShort || 5;
    document.getElementById('pomLongVal').textContent = s.pomodoroLong || 15;
    this.renderSwatches('colorSwatches', user.accentColor);
    this.renderSwatches('drawerSwatches', user.accentColor);
    if (user.theme === 'light') { document.documentElement.dataset.theme='light'; document.getElementById('themeLight')?.classList.add('active'); document.getElementById('themeDark')?.classList.remove('active'); }
  },

  renderSwatches(containerId, active) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = ACCENT_COLORS.map(c=>`<div class="color-swatch ${c===active?'active':''}" style="background:${c}" data-color="${c}" onclick="Settings.applyAccent('${c}')"></div>`).join('');
  },

  applyAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-rgb', hexToRgb(color));
    document.querySelectorAll('.color-swatch').forEach(s=>s.classList.toggle('active', s.dataset.color===color));
    API.put('/me', { accentColor: color });
    App.user.accentColor = color;
  },

  setTheme(theme, btn) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('.theme-btn').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
    API.put('/me', { theme });
    App.user.theme = theme;
  },

  updatePomLabel(inputId, labelId) {
    document.getElementById(labelId).textContent = document.getElementById(inputId).value;
  },

  async saveProfile() {
    const displayName = document.getElementById('settingName').value.trim();
    if (!displayName) return;
    const user = await API.put('/me', { displayName });
    App.user = user;
    App.updateUserUI();
  },

  async savePomo() {
    const data = {
      pomodoroFocus: +document.getElementById('pomFocus').value,
      pomodoroShort: +document.getElementById('pomShort').value,
      pomodoroLong: +document.getElementById('pomLong').value,
    };
    await API.put('/settings', data);
    Object.assign(App.settings, data);
    Pomo.setMode('focus', document.querySelector('.pomo-tab.active'));
  },

  async changePassword() {
    const cur = document.getElementById('pwCurrent').value;
    const nw = document.getElementById('pwNew').value;
    const errEl = document.getElementById('pwError');
    errEl.textContent = '';
    try {
      await API.put('/me/password', { currentPassword: cur, newPassword: nw });
      errEl.style.color = 'var(--good)';
      errEl.textContent = '✓ Contraseña actualizada';
      document.getElementById('pwCurrent').value = '';
      document.getElementById('pwNew').value = '';
    } catch(e) { errEl.style.color='var(--danger)'; errEl.textContent = e.error || 'Error'; }
  }
};

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '200,241,53';
}
