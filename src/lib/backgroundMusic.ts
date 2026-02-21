// Generate calming background music tones using Web Audio API
export const generateBackgroundMusic = async (
  durationSeconds: number,
  type: 'none' | 'peaceful-chimes' | 'nature-sounds'
): Promise<Blob | null> => {
  if (type === 'none') return null;

  const sampleRate = 44100;
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  const buffer = audioContext.createBuffer(2, sampleRate * durationSeconds, sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    
    switch (type) {
      case 'peaceful-chimes': {
        // Wind chimes: metallic tones with inharmonic partials and long decay
        const chimeNotes = [
          { freq: 523.25, decay: 1.2 },  // C5
          { freq: 587.33, decay: 1.0 },  // D5
          { freq: 659.25, decay: 1.3 },  // E5
          { freq: 783.99, decay: 0.9 },  // G5
          { freq: 880.00, decay: 1.1 },  // A5
          { freq: 1046.50, decay: 0.8 }, // C6
          { freq: 1174.66, decay: 0.7 }, // D6
        ];

        // Pre-compute chime hit times using deterministic pattern
        const hits: { time: number; noteIdx: number }[] = [];
        let hitTime = 0.5 + channel * 0.15;
        let seedVal = 42 + channel;
        const nextSeed = () => {
          seedVal = (seedVal * 1103515245 + 12345) & 0x7fffffff;
          return seedVal / 0x7fffffff;
        };
        while (hitTime < durationSeconds) {
          hits.push({ time: hitTime, noteIdx: Math.floor(nextSeed() * chimeNotes.length) });
          hitTime += 1.5 + nextSeed() * 3.5; // 1.5–5s apart
        }

        for (let i = 0; i < channelData.length; i++) {
          const t = i / sampleRate;
          let sample = 0;

          for (const hit of hits) {
            if (t < hit.time) continue;
            const dt = t - hit.time;
            if (dt > 6) continue; // skip expired chimes
            const note = chimeNotes[hit.noteIdx];
            const env = Math.exp(-dt * note.decay);
            if (env < 0.001) continue;
            // Metallic: fundamental + slightly inharmonic partials
            sample += Math.sin(2 * Math.PI * note.freq * dt) * env * 0.06;
            sample += Math.sin(2 * Math.PI * note.freq * 2.76 * dt) * env * 0.02;
            sample += Math.sin(2 * Math.PI * note.freq * 5.4 * dt) * env * 0.008;
          }

          channelData[i] = sample;
        }
        break;
      }
      case 'nature-sounds': {
        // Nature: layered wind noise + bird chirps + gentle crickets
        let noiseState = 0.3 + channel * 0.2;
        const pseudoRand = () => {
          noiseState = (noiseState * 16807 + 0.5) % 1;
          return noiseState * 2 - 1;
        };
        let lpWind = 0;

        // Pre-compute bird chirp times
        const chirps: { time: number; freqBase: number; duration: number }[] = [];
        let chirpSeed = 77 + channel;
        const nextChirpSeed = () => {
          chirpSeed = (chirpSeed * 1103515245 + 12345) & 0x7fffffff;
          return chirpSeed / 0x7fffffff;
        };
        let ct = 2 + nextChirpSeed() * 3;
        while (ct < durationSeconds) {
          const numNotes = 2 + Math.floor(nextChirpSeed() * 4); // 2-5 note chirp
          for (let n = 0; n < numNotes; n++) {
            chirps.push({
              time: ct + n * 0.08,
              freqBase: 2500 + nextChirpSeed() * 2000,
              duration: 0.04 + nextChirpSeed() * 0.06,
            });
          }
          ct += 3 + nextChirpSeed() * 6;
        }

        for (let i = 0; i < channelData.length; i++) {
          const t = i / sampleRate;
          let sample = 0;

          // Wind: filtered noise with slow modulation
          const raw = pseudoRand();
          const windCutoff = 0.003 + Math.sin(2 * Math.PI * 0.08 * t) * 0.001;
          lpWind += windCutoff * (raw - lpWind);
          const windVol = 0.2 + Math.sin(2 * Math.PI * 0.05 * t) * 0.1;
          sample += lpWind * windVol;

          // Bird chirps
          for (const chirp of chirps) {
            if (t < chirp.time || t > chirp.time + chirp.duration) continue;
            const dt = t - chirp.time;
            const env = Math.sin((dt / chirp.duration) * Math.PI); // bell envelope
            const sweep = chirp.freqBase + dt * 8000; // upward sweep
            sample += Math.sin(2 * Math.PI * sweep * dt) * env * 0.06;
          }

          // Crickets: high-freq pulsing in background
          const cricketRate = 12; // pulses per second
          const cricketEnv = Math.sin(2 * Math.PI * cricketRate * t);
          if (cricketEnv > 0.3) {
            sample += Math.sin(2 * Math.PI * 4500 * t) * (cricketEnv - 0.3) * 0.015;
          }

          channelData[i] = sample;
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
  
  // Convert to WAV
  const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
  return wavBlob;
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

  // Decode both audio files
  const [voiceBuffer, bgBuffer] = await Promise.all([
    audioContext.decodeAudioData(await voiceBlob.arrayBuffer()),
    audioContext.decodeAudioData(await backgroundBlob.arrayBuffer()),
  ]);

  // Use the voice duration
  const duration = voiceBuffer.duration;
  const sampleRate = voiceBuffer.sampleRate;
  const length = Math.floor(sampleRate * duration);

  // Create offline context for mixing
  const offlineContext = new OfflineAudioContext(2, length, sampleRate);

  // Voice source
  const voiceSource = offlineContext.createBufferSource();
  voiceSource.buffer = voiceBuffer;
  const voiceGain = offlineContext.createGain();
  voiceGain.gain.value = voiceVolume;
  voiceSource.connect(voiceGain);
  voiceGain.connect(offlineContext.destination);

  // Background source (loop if shorter)
  const bgSource = offlineContext.createBufferSource();
  bgSource.buffer = bgBuffer;
  bgSource.loop = true;
  const bgGain = offlineContext.createGain();
  bgGain.gain.value = backgroundVolume;
  bgSource.connect(bgGain);
  bgGain.connect(offlineContext.destination);

  // Start both
  voiceSource.start(0);
  bgSource.start(0);

  // Render
  const mixedBuffer = await offlineContext.startRendering();

  // Convert to blob
  const wavBlob = bufferToWave(mixedBuffer, mixedBuffer.length);
  return wavBlob;
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

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // Write interleaved data
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
