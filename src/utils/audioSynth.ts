/**
 * Web Audio Synthesizer and WAV Encoder
 * Generates rich musical audio waveforms for instant preview, offline playback,
 * and seamless fallback when Lyria free-tier quotas are limited.
 */

// Simple WAV file header writer
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16); // subChunk1Size
  setUint16(1); // PCM format
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byteRate
  setUint16(numOfChan * 2); // blockAlign
  setUint16(16); // bitsPerSample
  writeString('data');
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Frequency helper for musical notes
const NOTE_FREQS: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
};

export async function synthesizeMusicTrack(options: {
  genre?: string;
  tempo?: number;
  duration?: number;
  mood?: string;
}): Promise<string> {
  const duration = Math.min(options.duration || 15, 30);
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  const bpm = options.tempo || 120;
  const beatDuration = 60 / bpm;

  // Master Gain & Limiter
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);

  // Compressor to glue the track
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-14, 0);
  compressor.knee.setValueAtTime(40, 0);
  compressor.ratio.setValueAtTime(10, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.25, 0);

  masterGain.connect(compressor);
  compressor.connect(ctx.destination);

  // Chord progression (e.g., Am - F - C - G or Dm - Bb - F - C)
  const progressions = [
    [
      ['A3', 'C4', 'E4'],
      ['F3', 'A3', 'C4'],
      ['C4', 'E4', 'G4'],
      ['G3', 'B3', 'D4'],
    ],
    [
      ['D3', 'F3', 'A3'],
      ['B3', 'D4', 'G4'],
      ['C4', 'E4', 'G4'],
      ['A3', 'C4', 'E4'],
    ],
  ];

  const chordSet = options.genre?.toLowerCase().includes('lo-fi') ? progressions[0] : progressions[1];
  const barDuration = beatDuration * 4;
  const totalBars = Math.ceil(duration / barDuration);

  // 1. Synthesize Chords / Ambient Pads
  for (let bar = 0; bar < totalBars; bar++) {
    const chord = chordSet[bar % chordSet.length];
    const startTime = bar * barDuration;

    chord.forEach((note) => {
      const freq = NOTE_FREQS[note] || 261.63;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = options.genre?.toLowerCase().includes('synth') ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, startTime);
      filter.frequency.exponentialRampToValueAtTime(600, startTime + barDuration);

      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.linearRampToValueAtTime(0.12, startTime + 0.3);
      noteGain.gain.exponentialRampToValueAtTime(0.001, Math.min(startTime + barDuration, duration));

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(startTime);
      osc.stop(Math.min(startTime + barDuration, duration));
    });
  }

  // 2. Synthesize Bassline (808 / Sub Bass)
  const bassNotes = ['A3', 'F3', 'C3', 'G3'];
  for (let bar = 0; bar < totalBars; bar++) {
    const rootNote = bassNotes[bar % bassNotes.length];
    const freq = (NOTE_FREQS[rootNote] || 130.81) / 2;
    const startTime = bar * barDuration;

    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();

    bassOsc.type = 'triangle';
    bassOsc.frequency.setValueAtTime(freq, startTime);

    bassGain.gain.setValueAtTime(0.01, startTime);
    bassGain.gain.linearRampToValueAtTime(0.35, startTime + 0.05);
    bassGain.gain.exponentialRampToValueAtTime(0.01, Math.min(startTime + barDuration, duration));

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start(startTime);
    bassOsc.stop(Math.min(startTime + barDuration, duration));
  }

  // 3. Synthesize Beat & Drums (Kick, Hi-Hat, Snare)
  const totalBeats = Math.floor(duration / beatDuration);
  for (let b = 0; b < totalBeats; b++) {
    const beatTime = b * beatDuration;

    // Kick on beat 0 and 2 (or 0 and 2.5)
    if (b % 4 === 0 || b % 4 === 2) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();

      kickOsc.frequency.setValueAtTime(150, beatTime);
      kickOsc.frequency.exponentialRampToValueAtTime(40, beatTime + 0.15);

      kickGain.gain.setValueAtTime(0.4, beatTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.25);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);

      kickOsc.start(beatTime);
      kickOsc.stop(beatTime + 0.25);
    }

    // Snare / Clap on beat 1 and 3
    if (b % 4 === 1 || b % 4 === 3) {
      // Noise burst for snare
      const bufferSize = Math.floor(sampleRate * 0.15);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const snareFilter = ctx.createBiquadFilter();
      snareFilter.type = 'highpass';
      snareFilter.frequency.setValueAtTime(800, beatTime);

      const snareGain = ctx.createGain();
      snareGain.gain.setValueAtTime(0.18, beatTime);
      snareGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.15);

      noise.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(masterGain);

      noise.start(beatTime);
      noise.stop(beatTime + 0.15);
    }

    // Hi-hat on every 8th note
    for (let sub = 0; sub < 2; sub++) {
      const hatTime = beatTime + sub * (beatDuration / 2);
      if (hatTime >= duration) break;

      const hatSize = Math.floor(sampleRate * 0.04);
      const hatBuffer = ctx.createBuffer(1, hatSize, sampleRate);
      const hatData = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatSize; i++) {
        hatData[i] = Math.random() * 2 - 1;
      }

      const hatNoise = ctx.createBufferSource();
      hatNoise.buffer = hatBuffer;

      const hatFilter = ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(7000, hatTime);

      const hatGain = ctx.createGain();
      hatGain.gain.setValueAtTime(0.06, hatTime);
      hatGain.gain.exponentialRampToValueAtTime(0.001, hatTime + 0.035);

      hatNoise.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(masterGain);

      hatNoise.start(hatTime);
      hatNoise.stop(hatTime + 0.04);
    }
  }

  // 4. Melodic Arp Lead
  const melodyNotes = ['C4', 'E4', 'G4', 'B4', 'C5', 'G4', 'E4', 'D4'];
  const arpStep = beatDuration / 2;
  const totalArpSteps = Math.floor(duration / arpStep);

  for (let i = 0; i < totalArpSteps; i++) {
    // Only play melody in alternating bars for musicality
    const currentBar = Math.floor((i * arpStep) / barDuration);
    if (currentBar % 2 === 1) {
      const arpTime = i * arpStep;
      const note = melodyNotes[i % melodyNotes.length];
      const freq = NOTE_FREQS[note] || 440;

      const arpOsc = ctx.createOscillator();
      const arpGain = ctx.createGain();
      arpOsc.type = 'sine';
      arpOsc.frequency.setValueAtTime(freq, arpTime);

      arpGain.gain.setValueAtTime(0.07, arpTime);
      arpGain.gain.exponentialRampToValueAtTime(0.001, arpTime + 0.2);

      arpOsc.connect(arpGain);
      arpGain.connect(masterGain);

      arpOsc.start(arpTime);
      arpOsc.stop(arpTime + 0.25);
    }
  }

  // Render audio to buffer
  const renderedBuffer = await ctx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);

  return URL.createObjectURL(wavBlob);
}
