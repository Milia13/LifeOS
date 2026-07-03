const Music = {
  ctx: null, nodes: {}, playing: false, current: 0, vol: 0.4,

  tracks: [
    { name: '☁️ Lofi Chill', key: 'lofi' },
    { name: '🌧️ Rain Beats', key: 'rain' },
    { name: '🌙 Night Study', key: 'night' },
    { name: '🍵 Cafe Jazz', key: 'jazz' },
    { name: '🌿 Nature Flow', key: 'nature' },
  ],

  init() {
    const el = document.getElementById('musicTracks');
    el.innerHTML = this.tracks.map((t,i) =>
      `<button class="music-track" onclick="Music.play(${i})">${t.name}</button>`
    ).join('');
  },

  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  // Genera un oscilador con frecuencia, tipo y ganancia
  osc(freq, type, gain, ctx, dest) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(dest);
    o.start();
    return { osc: o, gain: g };
  },

  // Reverb simple con ConvolverNode
  makeReverb(ctx) {
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/len, 2);
    }
    conv.buffer = buf;
    return conv;
  },

  // Genera ruido filtrado (lluvia, naturaleza)
  makeNoise(ctx, dest, filterFreq, gain) {
    const buf = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = filterFreq; f.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(dest);
    src.start();
    return { src, filter: f, gain: g };
  },

  // Secuenciador de notas lo-fi
  startSequencer(ctx, masterGain, notes, bpm, waveform) {
    const interval = (60/bpm) * 1000;
    let step = 0;
    const id = setInterval(() => {
      if (!this.playing) return;
      const freq = notes[step % notes.length];
      if (freq) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = waveform;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        o.connect(g); g.connect(masterGain);
        o.start(); o.stop(ctx.currentTime + 0.45);
      }
      step++;
    }, interval);
    return id;
  },

  stopAll() {
    if (this.nodes.seqId) clearInterval(this.nodes.seqId);
    if (this.nodes.seqId2) clearInterval(this.nodes.seqId2);
    if (this.nodes.oscs) this.nodes.oscs.forEach(n => { try { n.osc.stop(); } catch(e){} });
    if (this.nodes.noises) this.nodes.noises.forEach(n => { try { n.src.stop(); } catch(e){} });
    this.nodes = {};
  },

  play(idx) {
    this.stopAll();
    this.current = idx;
    this.playing = true;
    document.getElementById('musicPlayBtn').textContent = '⏸';
    document.getElementById('musicNow').textContent = this.tracks[idx].name;
    document.querySelectorAll('.music-track').forEach((b,i) => b.classList.toggle('active', i===idx));

    const ctx = this.getCtx();
    const master = ctx.createGain();
    master.gain.value = this.vol;
    const reverb = this.makeReverb(ctx);
    reverb.connect(master);
    master.connect(ctx.destination);
    this.nodes.master = master;
    this.nodes.reverb = reverb;
    this.nodes.oscs = [];
    this.nodes.noises = [];

    const key = this.tracks[idx].key;

    if (key === 'lofi') {
      // Acorde pad + melodía suave
      [130.8, 164.8, 196, 261.6].forEach(f => {
        this.nodes.oscs.push(this.osc(f, 'sine', 0.06, ctx, reverb));
      });
      // Sub bass pulsante
      const bass = [65.4, 65.4, 73.4, 65.4, 58.3, 65.4, 73.4, 82.4];
      this.nodes.seqId = this.startSequencer(ctx, reverb, bass, 75, 'triangle');
      // Melodía
      const mel = [523, 0, 587, 659, 0, 523, 0, 494];
      this.nodes.seqId2 = this.startSequencer(ctx, reverb, mel, 150, 'sine');
    }

    else if (key === 'rain') {
      // Lluvia = ruido filtrado en varias frecuencias
      this.nodes.noises.push(this.makeNoise(ctx, master, 800, 0.08));
      this.nodes.noises.push(this.makeNoise(ctx, master, 2000, 0.04));
      this.nodes.noises.push(this.makeNoise(ctx, master, 400, 0.06));
      // Melodía triste sobre la lluvia
      const mel = [392, 0, 349, 0, 330, 0, 294, 0];
      this.nodes.seqId = this.startSequencer(ctx, reverb, mel, 60, 'sine');
    }

    else if (key === 'night') {
      // Pad oscuro
      [110, 138.6, 164.8].forEach(f => {
        this.nodes.oscs.push(this.osc(f, 'sine', 0.07, ctx, reverb));
      });
      // Arpeggio nocturno
      const arp = [220, 277.2, 329.6, 415.3, 329.6, 277.2, 220, 0];
      this.nodes.seqId = this.startSequencer(ctx, reverb, arp, 100, 'triangle');
    }

    else if (key === 'jazz') {
      // Acordes de jazz (7ma)
      [261.6, 329.6, 392, 466.2].forEach(f => {
        this.nodes.oscs.push(this.osc(f, 'triangle', 0.05, ctx, reverb));
      });
      // Walking bass
      const bass = [130.8, 146.8, 164.8, 146.8, 130.8, 123.5, 110, 123.5];
      this.nodes.seqId = this.startSequencer(ctx, reverb, bass, 120, 'triangle');
      // Melodía jazzy
      const mel = [523, 0, 493.9, 440, 0, 466.2, 0, 523];
      this.nodes.seqId2 = this.startSequencer(ctx, reverb, mel, 120, 'sine');
    }

    else if (key === 'nature') {
      // Pájaros = ruido filtrado agudo intermitente
      this.nodes.noises.push(this.makeNoise(ctx, master, 3000, 0.03));
      this.nodes.noises.push(this.makeNoise(ctx, master, 600, 0.05));
      // Melodía relajante pentatónica
      const penta = [261.6, 293.7, 329.6, 392, 440, 392, 329.6, 293.7];
      this.nodes.seqId = this.startSequencer(ctx, reverb, penta, 80, 'sine');
    }
  },

  toggle() {
    if (!this.playing && this.nodes.master === undefined) {
      this.play(this.current);
      return;
    }
    if (this.playing) {
      this.playing = false;
      this.stopAll();
      document.getElementById('musicPlayBtn').textContent = '▶';
    } else {
      this.play(this.current);
    }
  },

  next() { this.play((this.current+1) % this.tracks.length); },
  prev() { this.play((this.current-1+this.tracks.length) % this.tracks.length); },

  setVol(v) {
    this.vol = parseFloat(v);
    if (this.nodes.master) this.nodes.master.gain.value = this.vol;
  }
};
