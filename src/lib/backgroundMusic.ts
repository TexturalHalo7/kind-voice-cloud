// Ambient background sound generator using Web Audio API

export type BackgroundSoundType =
  | 'none'
  | 'custom'
  | 'soft-rain'
  | 'ocean-waves'
  | 'forest-birds'
  | 'thunder-rain'
  | 'brown-noise'
  | 'night-crickets';

export const SOUND_LABELS: Record<BackgroundSoundType, string> = {
  'custom': 'My Own Sound',
  'none': 'None',
  'soft-rain': 'Soft Rain',
  'ocean-waves': 'Gentle Ocean Waves',
  'forest-birds': 'Forest / Birds Chirping',
  'thunder-rain': 'Distant Thunder with Rain',
  
  'brown-noise': 'Brown Noise',
  'night-crickets': 'Night Ambience / Crickets',
};

// Deterministic pseudo-random number generator
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export const generateBackgroundMusic = async (
  durationSeconds: number,
  type: BackgroundSoundType
): Promise<Blob | null> => {
  if (type === 'none') return null;

  const sampleRate = 44100;
  const length = Math.floor(sampleRate * durationSeconds);
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  const buffer = audioContext.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    const rng = createRng(42 + ch);

    switch (type) {
      case 'soft-rain': {
        let lp = 0;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const raw = rng() * 2 - 1;
          lp += 0.02 * (raw - lp);
          const mod = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.15 * t);
          data[i] = lp * mod * 0.55;
        }
        break;
      }
      case 'ocean-waves': {
        let lp = 0;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const raw = rng() * 2 - 1;
          lp += 0.008 * (raw - lp);
          const wave = Math.pow(Math.max(0, Math.sin(2 * Math.PI * (1 / 8) * t)), 2);
          const secondWave = Math.pow(Math.max(0, Math.sin(2 * Math.PI * (1 / 13) * t + 1)), 2) * 0.6;
          data[i] = lp * (wave + secondWave) * 0.6;
        }
        break;
      }
      case 'forest-birds': {
        let lp = 0;
        const chirpRng = createRng(77 + ch);
        const chirps: { time: number; freq: number; dur: number }[] = [];
        let ct = 1 + chirpRng() * 2;
        while (ct < durationSeconds) {
          const notes = 2 + Math.floor(chirpRng() * 4);
          for (let n = 0; n < notes; n++) {
            chirps.push({
              time: ct + n * 0.08,
              freq: 2000 + chirpRng() * 2500,
              dur: 0.03 + chirpRng() * 0.06,
            });
          }
          ct += 2 + chirpRng() * 5;
        }
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const raw = rng() * 2 - 1;
          lp += 0.004 * (raw - lp);
          let sample = lp * 0.2;
          for (const c of chirps) {
            if (t >= c.time && t <= c.time + c.dur) {
              const dt = t - c.time;
              const env = Math.sin((dt / c.dur) * Math.PI);
              sample += Math.sin(2 * Math.PI * (c.freq + dt * 6000) * dt) * env * 0.08;
            }
          }
          data[i] = sample;
        }
        break;
      }
      case 'thunder-rain': {
        let lp = 0;
        const thunderRng = createRng(200 + ch);
        const thunders: { time: number; dur: number }[] = [];
        let tt = 4 + thunderRng() * 6;
        while (tt < durationSeconds) {
          thunders.push({ time: tt, dur: 2 + thunderRng() * 3 });
          tt += 8 + thunderRng() * 12;
        }
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const raw = rng() * 2 - 1;
          lp += 0.02 * (raw - lp);
          let sample = lp * 0.45;
          for (const th of thunders) {
            if (t >= th.time && t <= th.time + th.dur) {
              const dt = t - th.time;
              const env = Math.sin((dt / th.dur) * Math.PI) * Math.exp(-dt * 0.5);
              sample += Math.sin(2 * Math.PI * (40 + dt * 10) * dt) * env * 0.25;
              sample += (rng() * 2 - 1) * env * 0.12;
            }
          }
          data[i] = sample;
        }
        break;
      }
      case 'brown-noise': {
        let val = 0;
        for (let i = 0; i < length; i++) {
          val += (rng() * 2 - 1) * 0.02;
          val *= 0.998;
          data[i] = val * 0.35;
        }
        break;
      }
      case 'night-crickets': {
        let lp = 0;
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const raw = rng() * 2 - 1;
          lp += 0.002 * (raw - lp);
          let sample = lp * 0.15;
          const pulse = Math.sin(2 * Math.PI * 14 * t);
          if (pulse > 0.2) {
            sample += Math.sin(2 * Math.PI * 4800 * t) * (pulse - 0.2) * 0.06;
          }
          const pulse2 = Math.sin(2 * Math.PI * 11 * t + 2);
          if (pulse2 > 0.3) {
            sample += Math.sin(2 * Math.PI * 5200 * t) * (pulse2 - 0.3) * 0.04;
          }
          data[i] = sample;
        }
        break;
      }
    }
  }

  // Render buffer to blob
  const offlineContext = new OfflineAudioContext(2, buffer.length, sampleRate);
  const source = offlineContext.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineContext.destination);
  source.start();
  const renderedBuffer = await offlineContext.startRendering();
  return bufferToWave(renderedBuffer, renderedBuffer.length);
};

// Mix two audio files together
export const mixAudioFiles = async (
  voiceBlob: Blob,
  backgroundBlob: Blob | null,
  voiceVolume: number = 1.0,
  backgroundVolume: number = 0.5
): Promise<Blob> => {
  if (!backgroundBlob) return voiceBlob;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const [voiceBuffer, bgBuffer] = await Promise.all([
    audioContext.decodeAudioData(await voiceBlob.arrayBuffer()),
    audioContext.decodeAudioData(await backgroundBlob.arrayBuffer()),
  ]);

  const duration = voiceBuffer.duration;
  const sampleRate = voiceBuffer.sampleRate;
  const len = Math.floor(sampleRate * duration);
  const offlineContext = new OfflineAudioContext(2, len, sampleRate);

  const voiceSource = offlineContext.createBufferSource();
  voiceSource.buffer = voiceBuffer;
  const voiceGain = offlineContext.createGain();
  voiceGain.gain.value = voiceVolume;
  voiceSource.connect(voiceGain);
  voiceGain.connect(offlineContext.destination);

  const bgSource = offlineContext.createBufferSource();
  bgSource.buffer = bgBuffer;
  bgSource.loop = true;
  const bgGain = offlineContext.createGain();
  bgGain.gain.value = backgroundVolume;
  bgSource.connect(bgGain);
  bgGain.connect(offlineContext.destination);

  voiceSource.start(0);
  bgSource.start(0);

  const mixedBuffer = await offlineContext.startRendering();
  return bufferToWave(mixedBuffer, mixedBuffer.length);
};

// Convert AudioBuffer to WAV Blob
function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
