// Generate calming background music tones using Web Audio API
export const generateBackgroundMusic = async (
  durationSeconds: number,
  type: 'none' | 'gentle-waves' | 'soft-hum' | 'peaceful-chimes'
): Promise<Blob | null> => {
  if (type === 'none') return null;

  const sampleRate = 44100;
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  const buffer = audioContext.createBuffer(2, sampleRate * durationSeconds, sampleRate);

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    
    switch (type) {
      case 'gentle-waves': {
        // Gentle waves with slow oscillation
        for (let i = 0; i < channelData.length; i++) {
          const t = i / sampleRate;
          const wave1 = Math.sin(2 * Math.PI * 220 * t) * 0.05; // A3
          const wave2 = Math.sin(2 * Math.PI * 330 * t) * 0.03; // E4
          const lfo = Math.sin(2 * Math.PI * 0.2 * t) * 0.5 + 0.5; // Slow modulation
          channelData[i] = (wave1 + wave2) * lfo;
        }
        break;
      }
      case 'soft-hum': {
        // Soft humming drone
        for (let i = 0; i < channelData.length; i++) {
          const t = i / sampleRate;
          const hum1 = Math.sin(2 * Math.PI * 174 * t) * 0.04; // F3
          const hum2 = Math.sin(2 * Math.PI * 261.63 * t) * 0.03; // C4
          const fade = Math.min(1, t / 2); // Fade in over 2 seconds
          channelData[i] = (hum1 + hum2) * fade;
        }
        break;
      }
      case 'peaceful-chimes': {
        // Peaceful chimes with gentle reverb simulation
        for (let i = 0; i < channelData.length; i++) {
          const t = i / sampleRate;
          let sample = 0;
          
          // Create chime hits at intervals
          const chimeInterval = 3; // seconds
          const numChimes = Math.floor(durationSeconds / chimeInterval);
          
          for (let c = 0; c < numChimes; c++) {
            const chimeTime = c * chimeInterval;
            if (t >= chimeTime) {
              const timeSinceChime = t - chimeTime;
              const envelope = Math.exp(-timeSinceChime * 0.8); // Decay
              sample += Math.sin(2 * Math.PI * 523.25 * timeSinceChime) * envelope * 0.03; // C5
              sample += Math.sin(2 * Math.PI * 659.25 * timeSinceChime) * envelope * 0.02; // E5
            }
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
  backgroundVolume: number = 0.3
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
