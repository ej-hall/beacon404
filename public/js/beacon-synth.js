(function () {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];

  const state = {
    context: null,
    master: null,
    musicBus: null,
    delay: null,
    delayFeedback: null,
    compressor: null,
    schedulerId: null,
    staticSource: null,
    staticGain: null,
    droneNodes: [],
    nextNoteTime: 0,
    step: 0,
    playing: false,
    muted: false,
    volume: 0.28,
    previousVolume: 0.28,
    track: null,
    status: 'OFF',
    lastError: ''
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function midiToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function noteNameFromMidi(note) {
    return NOTE_NAMES[((note % 12) + 12) % 12];
  }

  function createTrack() {
    const root = pick([33, 35, 36, 38, 40, 41, 43, 45]);
    const bpm = Math.floor(70 + Math.random() * 41);
    const modes = ['minor salvage', 'dorian fault', 'aeolian carrier', 'phrygian drift'];
    const patternSeed = Array.from({ length: 16 }, () => pick(MINOR_SCALE));
    const bassPattern = [0, 0, 7, 0, 3, 0, 10, 7, 0, 0, 5, 0, 3, 10, 7, 0];
    const name = window.RobotDJ ? window.RobotDJ.trackName() : 'NULL ORBIT';

    return {
      name,
      bpm,
      mode: pick(modes),
      root,
      rootName: noteNameFromMidi(root),
      secondsPerStep: 60 / bpm / 4,
      patternSeed,
      bassPattern,
      filterBase: 420 + Math.random() * 360,
      filterLift: 500 + Math.random() * 780,
      detune: -7 + Math.random() * 14
    };
  }

  function emitUpdate() {
    document.dispatchEvent(new CustomEvent('beaconSynth:update', {
      detail: window.BeaconSynth.getNowPlaying()
    }));
  }

  function createNoiseBuffer(context, seconds) {
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function ensureContext() {
    if (!AudioContextClass) {
      state.lastError = 'AUDIO CONTEXT UNAVAILABLE';
      return false;
    }

    if (state.context) {
      return true;
    }

    const context = new AudioContextClass();
    const compressor = context.createDynamicsCompressor();
    const master = context.createGain();
    const musicBus = context.createGain();
    const delay = context.createDelay(1.2);
    const delayFeedback = context.createGain();

    compressor.threshold.value = -24;
    compressor.knee.value = 24;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.18;

    master.gain.value = state.volume;
    musicBus.gain.value = 0.72;
    delay.delayTime.value = 0.27;
    delayFeedback.gain.value = 0.24;

    musicBus.connect(compressor);
    musicBus.connect(delay);
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);
    delay.connect(compressor);
    compressor.connect(master);
    master.connect(context.destination);

    state.context = context;
    state.master = master;
    state.musicBus = musicBus;
    state.delay = delay;
    state.delayFeedback = delayFeedback;
    state.compressor = compressor;
    return true;
  }

  function applyVolume() {
    if (!state.master || !state.context) {
      return;
    }

    const target = state.muted ? 0 : state.volume;
    state.master.gain.setTargetAtTime(target, state.context.currentTime, 0.025);
    emitUpdate();
  }

  function envelopeGain(context, destination, time, peak, attack, decay) {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
    gain.connect(destination);
    return gain;
  }

  function playKick(time) {
    const context = state.context;
    const osc = context.createOscillator();
    const gain = envelopeGain(context, state.musicBus, time, 0.32, 0.008, 0.22);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.16);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.28);
  }

  function playBass(time, step) {
    const context = state.context;
    const note = state.track.root + state.track.bassPattern[step % state.track.bassPattern.length];
    const osc = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = envelopeGain(context, filter, time, 0.19, 0.018, 0.22);

    osc.type = 'sawtooth';
    osc.detune.value = state.track.detune;
    osc.frequency.setValueAtTime(midiToFrequency(note), time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(state.track.filterBase, time);
    filter.frequency.linearRampToValueAtTime(state.track.filterBase + 260, time + 0.08);
    filter.frequency.exponentialRampToValueAtTime(Math.max(90, state.track.filterBase * 0.55), time + 0.25);
    filter.Q.value = 9;
    filter.connect(state.musicBus);
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.32);
  }

  function playLead(time, step) {
    if (step % 2 !== 0 && Math.random() > 0.18) {
      return;
    }

    const context = state.context;
    const degree = state.track.patternSeed[step % state.track.patternSeed.length];
    const octave = step % 8 === 6 ? 36 : 24;
    const note = state.track.root + octave + degree;
    const osc = context.createOscillator();
    const osc2 = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = envelopeGain(context, filter, time, 0.075, 0.01, 0.16);

    osc.type = 'square';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(midiToFrequency(note), time);
    osc2.frequency.setValueAtTime(midiToFrequency(note + 12), time);
    osc.detune.value = -6;
    osc2.detune.value = 8;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900 + (step % 8) * 90, time);
    filter.Q.value = 5;
    filter.connect(state.musicBus);
    osc.connect(gain);
    osc2.connect(gain);
    osc.start(time);
    osc2.start(time);
    osc.stop(time + 0.18);
    osc2.stop(time + 0.18);
  }

  function playHat(time, step) {
    const context = state.context;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = envelopeGain(context, filter, time, step % 4 === 2 ? 0.052 : 0.035, 0.004, 0.045);

    source.buffer = createNoiseBuffer(context, 0.08);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5200 + Math.random() * 1700, time);
    filter.Q.value = 0.7;
    filter.connect(state.musicBus);
    source.connect(gain);
    source.start(time);
    source.stop(time + 0.08);
  }

  function playGlitch(time) {
    if (Math.random() > 0.07) {
      return;
    }

    const context = state.context;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = envelopeGain(context, filter, time, 0.045, 0.002, 0.035);

    source.buffer = createNoiseBuffer(context, 0.05);
    source.playbackRate.value = 0.4 + Math.random() * 2.2;
    filter.type = 'bandpass';
    filter.frequency.value = 500 + Math.random() * 3200;
    filter.Q.value = 12;
    filter.connect(state.musicBus);
    source.connect(gain);
    source.start(time);
    source.stop(time + 0.05);
  }

  function stopDroneNodes() {
    state.droneNodes.forEach((node) => {
      try {
        if (node.sweepId) {
          window.clearInterval(node.sweepId);
        }
        if (node.gain) {
          node.gain.gain.setTargetAtTime(0.0001, state.context.currentTime, 0.08);
        }
        if (node.osc) {
          node.osc.stop(state.context.currentTime + 0.28);
        }
      } catch (error) {
        // Nodes may already be stopped when mobile browsers suspend aggressively.
      }
    });
    state.droneNodes = [];
  }

  function startDrone() {
    const context = state.context;
    const filter = context.createBiquadFilter();
    const droneGain = context.createGain();
    const rootFreq = midiToFrequency(state.track.root - 12);
    const notes = [rootFreq, rootFreq * 1.5, rootFreq * 2.01];

    filter.type = 'lowpass';
    filter.frequency.value = state.track.filterBase;
    filter.Q.value = 2.4;
    droneGain.gain.setValueAtTime(0.0001, context.currentTime);
    droneGain.gain.setTargetAtTime(0.062, context.currentTime + 0.1, 0.8);
    droneGain.connect(filter);
    filter.connect(state.musicBus);

    state.droneNodes.push({ gain: droneGain });
    notes.forEach((frequency, index) => {
      const osc = context.createOscillator();
      osc.type = index === 1 ? 'triangle' : 'sawtooth';
      osc.frequency.value = frequency;
      osc.detune.value = index * 5 - 4;
      osc.connect(droneGain);
      osc.start();
      state.droneNodes.push({ osc, gain: droneGain });
    });

    const sweepId = window.setInterval(() => {
      if (!state.playing || !state.context) {
        window.clearInterval(sweepId);
        return;
      }
      const now = context.currentTime;
      const target = state.track.filterBase + Math.random() * state.track.filterLift;
      filter.frequency.setTargetAtTime(target, now, 1.8);
    }, 1800);
    state.droneNodes.push({ sweepId });
  }

  function startStaticTexture() {
    const context = state.context;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    source.buffer = createNoiseBuffer(context, 2);
    source.loop = true;
    filter.type = 'highpass';
    filter.frequency.value = 4800;
    gain.gain.value = 0.012;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(state.musicBus);
    source.start();

    state.staticSource = source;
    state.staticGain = gain;
  }

  function stopStaticTexture() {
    if (!state.staticSource) {
      return;
    }

    try {
      if (state.staticGain) {
        state.staticGain.gain.setTargetAtTime(0.0001, state.context.currentTime, 0.08);
      }
      state.staticSource.stop(state.context.currentTime + 0.25);
    } catch (error) {
      // Already stopped or suspended.
    }

    state.staticSource = null;
    state.staticGain = null;
  }

  function scheduleStep(time) {
    const step = state.step % 16;

    if (step % 4 === 0) {
      playKick(time);
    }

    if (step % 2 === 0 || Math.random() > 0.55) {
      playBass(time, step);
    }

    playLead(time, step);
    playHat(time, step);
    playGlitch(time);
  }

  function scheduler() {
    if (!state.playing || !state.context || !state.track) {
      return;
    }

    const lookahead = 0.12;
    while (state.nextNoteTime < state.context.currentTime + lookahead) {
      scheduleStep(state.nextNoteTime);
      state.nextNoteTime += state.track.secondsPerStep;
      state.step += 1;
    }
  }

  function beginScheduler() {
    window.clearInterval(state.schedulerId);
    state.nextNoteTime = state.context.currentTime + 0.08;
    state.step = 0;
    state.schedulerId = window.setInterval(scheduler, 25);
  }

  async function start() {
    if (!ensureContext()) {
      state.status = 'UNAVAILABLE';
      emitUpdate();
      return { ok: false, error: state.lastError || 'AUDIO CONTEXT UNAVAILABLE' };
    }

    if (state.context.state === 'suspended') {
      await state.context.resume();
    }

    if (state.playing) {
      emitUpdate();
      return { ok: true, alreadyPlaying: true, track: state.track };
    }

    state.track = state.track || createTrack();
    state.playing = true;
    state.status = 'ONLINE';
    applyVolume();
    startDrone();
    startStaticTexture();
    beginScheduler();
    emitUpdate();

    return { ok: true, track: state.track };
  }

  async function stop() {
    window.clearInterval(state.schedulerId);
    state.schedulerId = null;
    state.playing = false;
    state.status = 'OFF';
    stopStaticTexture();
    stopDroneNodes();

    if (state.context && state.context.state !== 'closed') {
      await state.context.suspend();
    }

    emitUpdate();
    return { ok: true };
  }

  async function next() {
    if (!ensureContext()) {
      state.status = 'UNAVAILABLE';
      emitUpdate();
      return { ok: false, error: state.lastError || 'AUDIO CONTEXT UNAVAILABLE' };
    }

    const wasPlaying = state.playing;
    stopStaticTexture();
    stopDroneNodes();
    state.track = createTrack();
    state.step = 0;

    if (wasPlaying) {
      if (state.context.state === 'suspended') {
        await state.context.resume();
      }
      startDrone();
      startStaticTexture();
      beginScheduler();
    }

    emitUpdate();
    return { ok: true, track: state.track, wasPlaying };
  }

  window.BeaconSynth = {
    async start() {
      return start();
    },

    async stop() {
      return stop();
    },

    mute() {
      state.muted = true;
      applyVolume();
      return this.getNowPlaying();
    },

    unmute() {
      state.muted = false;
      applyVolume();
      return this.getNowPlaying();
    },

    setVolume(value) {
      state.volume = clamp(Number(value) || 0, 0, 0.7);
      state.previousVolume = state.volume;
      if (state.volume > 0) {
        state.muted = false;
      }
      applyVolume();
      return this.getNowPlaying();
    },

    volumeUp() {
      return this.setVolume(state.volume + 0.05);
    },

    volumeDown() {
      return this.setVolume(state.volume - 0.05);
    },

    async next() {
      return next();
    },

    getNowPlaying() {
      const track = state.track || createTrack();
      state.track = track;

      return {
        available: Boolean(AudioContextClass),
        status: state.status,
        playing: state.playing,
        muted: state.muted,
        volume: state.volume,
        volumePercent: Math.round(state.volume * 100),
        trackName: track.name,
        bpm: track.bpm,
        mode: track.mode,
        root: track.rootName,
        robotDjStatus: state.playing ? 'TRANSMITTING' : 'IDLE',
        error: state.lastError
      };
    },

    djLine() {
      return window.RobotDJ ? window.RobotDJ.djLine() : 'ROBOT DJ: the signal has learned to hum.';
    }
  };

  emitUpdate();
})();
