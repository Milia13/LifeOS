const Tasks = {
  data: [],
  async load() {
    this.data = await API.get('/tasks');
    this.render(); this.renderDash();
  },
  async add() {
    const text = document.getElementById('taskTextInput').value.trim();
    const tag = document.getElementById('taskTagInput').value;
    if (!text) return;
    const t = await API.post('/tasks', { text, tag });
    this.data.unshift(t);
    document.getElementById('taskTextInput').value = '';
    this.render(); this.renderDash(); App.updateDashStats();
  },
  async quickAdd() {
    const el = document.getElementById('dashTaskInput');
    const text = el.value.trim();
    if (!text) return;
    const t = await API.post('/tasks', { text, tag:'general' });
    this.data.unshift(t);
    el.value = '';
    this.render(); this.renderDash(); App.updateDashStats();
  },
  async toggle(id) {
    const t = this.data.find(x=>x.id===id);
    if (!t) return;
    t.done = !t.done;
    await API.put('/tasks/'+id, { done: t.done });
    this.render(); this.renderDash(); App.updateDashStats();
  },
  async del(id) {
    await API.del('/tasks/'+id);
    this.data = this.data.filter(x=>x.id!==id);
    this.render(); this.renderDash(); App.updateDashStats();
  },
  async clearDone() {
    await API.del('/tasks');
    this.data = this.data.filter(x=>!x.done);
    this.render(); this.renderDash(); App.updateDashStats();
  },
  render() {
    const filter = document.getElementById('taskFilter')?.value||'all';
    const tagFilter = document.getElementById('taskTagFilter')?.value||'all';
    let list = [...this.data];
    if (filter==='pending') list = list.filter(t=>!t.done);
    if (filter==='done') list = list.filter(t=>t.done);
    if (tagFilter!=='all') list = list.filter(t=>t.tag===tagFilter);
    const el = document.getElementById('taskListFull');
    if (!el) return;
    el.innerHTML = list.length ? list.map(t=>this.taskHTML(t)).join('') : '<div class="empty-state">No hay tareas</div>';
  },
  renderDash() {
    const el = document.getElementById('dashTasks');
    if (!el) return;
    const top = this.data.filter(t=>!t.done).slice(0,4);
    el.innerHTML = top.length ? top.map(t=>this.taskHTML(t, true)).join('') : '<div class="empty-state">¡Todo al día! 🎉</div>';
  },
  taskHTML(t, mini=false) {
    return `<div class="task-item">
      <div class="task-cb ${t.done?'done':''}" onclick="Tasks.toggle('${t.id}')"></div>
      <div class="task-body">
        <div class="task-text-el ${t.done?'done':''}">${t.text}</div>
        ${!mini?`<span class="task-tag-el tag-${t.tag}">${t.tag}</span>`:''}
      </div>
      <button class="task-del" onclick="Tasks.del('${t.id}')">×</button>
    </div>`;
  }
};
