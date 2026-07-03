const Pomo = {
  total: 25*60, remaining: 25*60, running: false, interval: null,
  sessions: 0, focusMins: 0, mode: 'focus',
  circ: 2*Math.PI*80,
  init() {
    document.getElementById('ringFg').style.strokeDasharray = this.circ;
    this.render();
  },
  setMode(mode, btn) {
    const mins = { focus: App.settings.pomodoroFocus||25, short: App.settings.pomodoroShort||5, long: App.settings.pomodoroLong||15 }[mode];
    clearInterval(this.interval); this.running = false;
    document.getElementById('pomoStartBtn').textContent = '▶ Start';
    this.mode = mode; this.total = mins*60; this.remaining = mins*60;
    const colors = { focus:'var(--accent)', short:'var(--good)', long:'var(--accent2)' };
    document.getElementById('ringFg').style.stroke = colors[mode];
    document.getElementById('timerLabel').textContent = mode === 'focus' ? 'FOCUS' : mode === 'short' ? 'SHORT BREAK' : 'LONG BREAK';
    document.querySelectorAll('.pomo-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.render();
  },
  toggle() {
    if (this.running) {
      clearInterval(this.interval); this.running = false;
      document.getElementById('pomoStartBtn').textContent = '▶ Start';
    } else {
      this.running = true;
      document.getElementById('pomoStartBtn').textContent = '⏸ Pausa';
      this.interval = setInterval(() => {
        this.remaining--;
        if (this.mode === 'focus') this.focusMins += 1/60;
        this.render();
        App.updateDashStats();
        if (this.remaining <= 0) {
          clearInterval(this.interval); this.running = false;
          document.getElementById('pomoStartBtn').textContent = '▶ Start';
          if (this.mode === 'focus') { this.sessions = Math.min(this.sessions+1,4); this.renderDots(); }
          this.remaining = this.total; this.render();
        }
      }, 1000);
    }
  },
  reset() {
    clearInterval(this.interval); this.running = false;
    this.remaining = this.total;
    document.getElementById('pomoStartBtn').textContent = '▶ Start';
    this.render();
  },
  render() {
    const m = Math.floor(this.remaining/60), s = this.remaining%60;
    document.getElementById('timerDisplay').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    const offset = this.circ * (1 - this.remaining/this.total);
    document.getElementById('ringFg').style.strokeDashoffset = offset;
  },
  renderDots() {
    const c = document.getElementById('pomoDots');
    c.innerHTML = '';
    for(let i=0;i<4;i++) { const d=document.createElement('div'); d.className='pomo-dot'+(i<this.sessions?' done':''); c.appendChild(d); }
    document.getElementById('pomoSessionCount').textContent = this.sessions;
  }
};
