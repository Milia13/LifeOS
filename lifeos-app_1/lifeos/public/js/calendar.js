const Cal = {
  data: [], year: new Date().getFullYear(), month: new Date().getMonth(),
  selected: new Date().toISOString().slice(0,10),
  editingId: null,
  colors: ['#7c6af7','#c8f135','#5dd88a','#f17070','#f0a34a','#60b4f7'],

  async load() {
    this.data = await API.get('/calendar');
    this.renderGrid(); this.renderList(); this.renderDash();
    this.initColorSwatches();
  },

  prevMonth() { if(this.month===0){this.month=11;this.year--;}else this.month--; this.renderGrid(); },
  nextMonth() { if(this.month===11){this.month=0;this.year++;}else this.month++; this.renderGrid(); },

  renderGrid() {
    const names=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
    document.getElementById('calMonthLabel').textContent = `${names[this.month]} ${this.year}`;
    const first = new Date(this.year, this.month, 1).getDay();
    const days = new Date(this.year, this.month+1, 0).getDate();
    const today = new Date().toISOString().slice(0,10);
    let html = ['LUN','MAR','MIÉ','JUE','VIE','SAB','DOM'].map(d=>`<div class="cal-day-header">${d}</div>`).join('');
    const startOffset = (first+6)%7;
    const prevDays = new Date(this.year, this.month, 0).getDate();
    for(let i=startOffset-1;i>=0;i--) {
      html += `<div class="cal-cell other-month"><div class="cal-day-num">${prevDays-i}</div></div>`;
    }
    for(let d=1;d<=days;d++) {
      const dateStr = `${this.year}-${String(this.month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isToday = dateStr===today, isSel = dateStr===this.selected;
      const evs = this.data.filter(e=>e.date===dateStr);
      const dots = evs.slice(0,3).map(e=>`<div class="cal-event-dot" style="background:${e.color}">${e.title}</div>`).join('');
      html += `<div class="cal-cell ${isToday?'today':''} ${isSel?'selected':''}" onclick="Cal.selectDate('${dateStr}')">
        <div class="cal-day-num">${d}</div>${dots}</div>`;
    }
    document.getElementById('calGrid').innerHTML = html;
  },

  selectDate(dateStr) {
    this.selected = dateStr;
    this.renderGrid(); this.renderList();
  },

  renderList() {
    const evs = this.data.filter(e=>e.date===this.selected);
    const d = new Date(this.selected+'T12:00:00');
    document.getElementById('calSelectedDate').textContent = d.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
    const el = document.getElementById('calEventsList');
    el.innerHTML = evs.length ? evs.map(e=>`
      <div class="cal-event-item">
        <div class="cal-event-dot-big" style="background:${e.color}"></div>
        <div>
          <div class="cal-event-name">${e.title}</div>
          ${e.time?`<div class="cal-event-time">${e.time}</div>`:''}
        </div>
        <button class="cal-event-del" onclick="Cal.del('${e.id}')">×</button>
      </div>`).join('') : '<div class="empty-state">Sin eventos</div>';
  },

  renderDash() {
    const el = document.getElementById('dashEvents');
    if (!el) return;
    const today = new Date().toISOString().slice(0,10);
    const upcoming = this.data.filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
    el.innerHTML = upcoming.length ? upcoming.map(e=>`
      <div class="dash-event-item">
        <div class="dash-event-dot" style="background:${e.color}"></div>
        <div>
          <div style="font-size:13px">${e.title}</div>
          <div style="font-size:11px;color:var(--muted)">${new Date(e.date+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'})} ${e.time||''}</div>
        </div>
      </div>`).join('') : '<div class="empty-state">Sin eventos próximos</div>';
  },

  openModal(dateStr) {
    this.editingId = null;
    document.getElementById('calEventTitle').value = '';
    document.getElementById('calEventDate').value = dateStr || this.selected;
    document.getElementById('calEventTime').value = '';
    document.getElementById('calEventDesc').value = '';
    document.getElementById('calEventId').value = '';
    document.getElementById('calModalTitle').textContent = 'Nuevo evento';
    document.getElementById('calError').textContent = '';
    document.getElementById('calModal').style.display = 'flex';
  },
  closeModal() { document.getElementById('calModal').style.display = 'none'; },

  async saveEvent() {
    const title = document.getElementById('calEventTitle').value.trim();
    const date = document.getElementById('calEventDate').value;
    const color = document.querySelector('#calColorSwatches .color-swatch.active')?.dataset.color || '#7c6af7';
    if (!title||!date) { document.getElementById('calError').textContent='Título y fecha requeridos'; return; }
    const payload = { title, date, time: document.getElementById('calEventTime').value, description: document.getElementById('calEventDesc').value, color };
    const id = document.getElementById('calEventId').value;
    if (id) {
      const updated = await API.put('/calendar/'+id, payload);
      const idx = this.data.findIndex(e=>e.id===id);
      if(idx>-1) this.data[idx]=updated;
    } else {
      const ev = await API.post('/calendar', payload);
      this.data.push(ev);
    }
    this.closeModal(); this.renderGrid(); this.renderList(); this.renderDash();
  },

  async del(id) {
    await API.del('/calendar/'+id);
    this.data = this.data.filter(e=>e.id!==id);
    this.renderGrid(); this.renderList(); this.renderDash();
  },

  initColorSwatches() {
    const el = document.getElementById('calColorSwatches');
    if (!el) return;
    el.innerHTML = this.colors.map((c,i)=>`<div class="color-swatch ${i===0?'active':''}" style="background:${c}" data-color="${c}" onclick="Cal.selectColor(this)"></div>`).join('');
  },
  selectColor(el) {
    document.querySelectorAll('#calColorSwatches .color-swatch').forEach(s=>s.classList.remove('active'));
    el.classList.add('active');
  }
};
