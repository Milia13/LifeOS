const Notes = {
  data: [],
  editing: null,
  async load() {
    this.data = await API.get('/notes');
    this.render();
  },
  async create() {
    const note = await API.post('/notes', { title:'Nueva nota', content:'' });
    this.data.unshift(note);
    this.render();
    this.openEditor(note.id);
  },
  async save() {
    if (!this.editing) return;
    const title = document.getElementById('noteEditorTitle').value;
    const content = document.getElementById('noteEditorBody').value;
    const updated = await API.put('/notes/'+this.editing, { title, content });
    const idx = this.data.findIndex(n=>n.id===this.editing);
    if (idx>-1) this.data[idx] = updated;
    this.closeEditor();
    this.render();
  },
  async del(id, e) {
    e.stopPropagation();
    await API.del('/notes/'+id);
    this.data = this.data.filter(n=>n.id!==id);
    this.render();
  },
  openEditor(id) {
    const note = this.data.find(n=>n.id===id);
    if (!note) return;
    this.editing = id;
    const overlay = document.createElement('div');
    overlay.className = 'note-edit-overlay';
    overlay.id = 'noteOverlay';
    overlay.innerHTML = `
      <div class="note-editor">
        <input class="note-editor-title" id="noteEditorTitle" value="${note.title}" placeholder="Título">
        <textarea class="note-editor-body" id="noteEditorBody" placeholder="Escribí aquí...">${note.content}</textarea>
        <div style="display:flex;gap:8px">
          <button class="btn-accent" onclick="Notes.save()">Guardar</button>
          <button class="btn-ghost" onclick="Notes.closeEditor()">Cerrar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('noteEditorBody').focus();
  },
  closeEditor() {
    this.editing = null;
    const o = document.getElementById('noteOverlay');
    if (o) o.remove();
  },
  render() {
    const el = document.getElementById('notesGrid');
    if (!el) return;
    el.innerHTML = this.data.length ? this.data.map(n=>`
      <div class="note-card" style="background:${n.color||'var(--surface)'}" onclick="Notes.openEditor('${n.id}')">
        <button class="note-del-btn" onclick="Notes.del('${n.id}',event)">×</button>
        <div class="note-card-title">${n.title}</div>
        <div class="note-card-body">${n.content||'<em>Vacía</em>'}</div>
        <div class="note-card-date">${new Date(n.updatedAt||n.createdAt).toLocaleDateString('es-AR')}</div>
      </div>`).join('') : '<div class="empty-state" style="grid-column:1/-1">No hay notas. ¡Creá una!</div>';
  }
};
