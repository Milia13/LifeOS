const Habits = {
  data: [],
  async load() {
    this.data = await API.get('/habits');
    this.render(); this.renderDash();
  },
  async add() {
    const name = document.getElementById('habitNameInput').value.trim();
    const icon = document.getElementById('habitIconInput').value.trim() || '⭐';
    if (!name) return;
    const h = await API.post('/habits', { name, icon });
    this.data.push(h);
    document.getElementById('habitNameInput').value = '';
    document.getElementById('habitIconInput').value = '';
    this.render(); this.renderDash();
  },
  async toggleDay(id, dayIdx) {
    const h = this.data.find(x=>x.id===id);
    if (!h) return;
    h.checks[dayIdx] = !h.checks[dayIdx];
    await API.put('/habits/'+id, { checks: h.checks });
    this.render(); this.renderDash(); App.updateDashStats();
  },
  async del(id) {
    await API.del('/habits/'+id);
    this.data = this.data.filter(x=>x.id!==id);
    this.render(); this.renderDash(); App.updateDashStats();
  },
  streak(checks) {
    let s=0;
    for(let i=checks.length-1;i>=0;i--) { if(checks[i])s++; else break; }
    return s;
  },
  render() {
    const el = document.getElementById('habitListFull');
    if (!el) return;
    el.innerHTML = this.data.length ? this.data.map(h=>this.habitHTML(h)).join('') : '<div class="empty-state">Agregá tu primer hábito</div>';
  },
  renderDash() {
    const el = document.getElementById('dashHabits');
    if (!el) return;
    if (!this.data.length) { el.innerHTML='<div class="empty-state">Sin hábitos todavía</div>'; return; }
    el.innerHTML = this.data.map(h=>`
      <div class="habit-row" style="padding:6px 0">
        <div class="habit-icon-el">${h.icon}</div>
        <div class="habit-name-el">${h.name}</div>
        <div class="day-box today ${h.checks[6]?'done':''}" onclick="Habits.toggleDay('${h.id}',6)">${h.checks[6]?'✓':''}</div>
      </div>`).join('');
  },
  habitHTML(h) {
    const s = this.streak(h.checks);
    const checks = h.checks.map((c,i)=>`<div class="day-box ${c?'done':''} ${i===6?'today':''}" onclick="Habits.toggleDay('${h.id}',${i})">${c?'✓':''}</div>`).join('');
    return `<div class="habit-row">
      <div class="habit-icon-el">${h.icon}</div>
      <div class="habit-name-el">${h.name}</div>
      <div class="habit-checks-el">${checks}</div>
      <div class="habit-streak-el">🔥 ${s}</div>
      <button class="habit-del" onclick="Habits.del('${h.id}')">×</button>
    </div>`;
  }
};
