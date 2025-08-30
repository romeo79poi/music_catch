// High-performance JavaScript fallback for C++ audio processing
// Optimized for speed when WebAssembly is not available

class VectorFloat {
  constructor(data = []) {
    this.data = new Float32Array(data);
  }

  size() {
    return this.data.length;
  }

  get(index) {
    return this.data[index] || 0;
  }

  set(index, value) {
    if (index < this.data.length) {
      this.data[index] = value;
    }
  }

  push_back(value) {
    const newData = new Float32Array(this.data.length + 1);
    newData.set(this.data);
    newData[this.data.length] = value;
    this.data = newData;
  }

  resize(size) {
    const newData = new Float32Array(size);
    newData.set(this.data.slice(0, Math.min(size, this.data.length)));
    this.data = newData;
  }

  delete() {
    // No-op in JavaScript
  }
}

class VectorUint8 {
  constructor(data = []) {
    this.data = new Uint8Array(data);
  }

  size() {
    return this.data.length;
  }

  get(index) {
    return this.data[index] || 0;
  }

  set(index, value) {
    if (index < this.data.length) {
      this.data[index] = value;
    }
  }

  push_back(value) {
    const newData = new Uint8Array(this.data.length + 1);
    newData.set(this.data);
    newData[this.data.length] = value;
    this.data = newData;
  }

  resize(size) {
    const newData = new Uint8Array(size);
    newData.set(this.data.slice(0, Math.min(size, this.data.length)));
    this.data = newData;
  }

  delete() {
    // No-op in JavaScript
  }
}

class AudioProcessor {
  constructor() {
    this.volume = 1.0;
    this.speed = 1.0;
    this.muted = false;
    this.equalizerBands = new Float32Array([
      1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    ]);
    this.samplesProcessed = 0;
    this.lastPerformanceCheck = performance.now();
  }

  processAudioChunk(inputVector, outputVector) {
    const inputData = inputVector.data;
    const outputSize = inputData.length;
    outputVector.resize(outputSize);

    if (this.muted) {
      for (let i = 0; i < outputSize; i++) {
        outputVector.set(i, 0);
      }
      return;
    }

    // Optimized processing with manual loop unrolling for performance
    const vol = this.volume;
    const eqBands = this.equalizerBands;

    for (let i = 0; i < outputSize; i += 4) {
      // Process 4 samples at once for better performance
      const remaining = Math.min(4, outputSize - i);

      for (let j = 0; j < remaining; j++) {
        const idx = i + j;
        let sample = inputData[idx];

        // Apply volume
        sample *= vol;

        // Apply equalizer (simple 8-band)
        const band = (idx >> 6) & 7; // Fast modulo 8
        sample *= eqBands[band];

        // Clamp to prevent distortion
        sample = Math.max(-1.0, Math.min(1.0, sample));

        outputVector.set(idx, sample);
      }
    }

    this.samplesProcessed += outputSize;
  }

  crossfadeTracks(track1Vector, track2Vector, outputVector, fadeRatio) {
    const track1Data = track1Vector.data;
    const track2Data = track2Vector.data;
    const length = Math.min(track1Data.length, track2Data.length);

    outputVector.resize(length);

    const fade1 = 1.0 - fadeRatio;
    const fade2 = fadeRatio;

    // Optimized crossfade
    for (let i = 0; i < length; i += 4) {
      const remaining = Math.min(4, length - i);

      for (let j = 0; j < remaining; j++) {
        const idx = i + j;
        const sample = track1Data[idx] * fade1 + track2Data[idx] * fade2;
        outputVector.set(idx, sample);
      }
    }
  }

  pitchShift(inputVector, outputVector, pitchFactor) {
    const inputData = inputVector.data;
    const inputSize = inputData.length;
    const outputSize = Math.floor(inputSize / pitchFactor);

    outputVector.resize(outputSize);

    for (let i = 0; i < outputSize; i++) {
      const srcPos = i * pitchFactor;
      const srcIdx = Math.floor(srcPos);
      const frac = srcPos - srcIdx;

      if (srcIdx + 1 < inputSize) {
        // Linear interpolation
        const sample =
          inputData[srcIdx] * (1.0 - frac) + inputData[srcIdx + 1] * frac;
        outputVector.set(i, sample);
      } else if (srcIdx < inputSize) {
        outputVector.set(i, inputData[srcIdx]);
      }
    }
  }

  getSpectrumData(samplesVector, fftSize = 512) {
    const samples = samplesVector.data;
    const spectrum = new VectorFloat();
    const spectrumSize = Math.floor(fftSize / 2);
    spectrum.resize(spectrumSize);

    const hop = Math.floor(samples.length / spectrumSize);

    for (let i = 0; i < spectrumSize; i++) {
      let magnitude = 0.0;
      const start = i * hop;
      const end = Math.min(start + hop, samples.length);

      for (let j = start; j < end; j++) {
        magnitude += Math.abs(samples[j]);
      }

      spectrum.set(i, magnitude / (end - start));
    }

    return spectrum;
  }

  getPerformanceMetrics() {
    const now = performance.now();
    const duration = now - this.lastPerformanceCheck;

    if (duration > 0) {
      const samplesPerSecond = (this.samplesProcessed * 1000) / duration;
      this.lastPerformanceCheck = now;
      this.samplesProcessed = 0;
      return samplesPerSecond;
    }

    return 0.0;
  }

  setVolume(vol) {
    this.volume = Math.max(0.0, Math.min(2.0, vol));
  }

  setSpeed(spd) {
    this.speed = Math.max(0.25, Math.min(4.0, spd));
  }

  setMuted(mute) {
    this.muted = mute;
  }

  setEqualizerBand(band, gain) {
    if (band >= 0 && band < this.equalizerBands.length) {
      this.equalizerBands[band] = Math.max(0.0, Math.min(3.0, gain));
    }
  }

  getVolume() {
    return this.volume;
  }

  getSpeed() {
    return this.speed;
  }

  isMuted() {
    return this.muted;
  }

  getEqualizerSettings() {
    return new VectorFloat(Array.from(this.equalizerBands));
  }
}

class StreamOptimizer {
  constructor() {
    this.compressionBuffer = new Uint8Array(0);
  }

  compressAudioChunk(samplesVector) {
    const samples = samplesVector.data;
    const compressed = new VectorUint8();
    compressed.resize(samples.length * 2);

    let prevSample = 0;
    let writeIndex = 0;

    for (let i = 0; i < samples.length; i++) {
      // Convert to 16-bit integer
      const intSample = Math.floor(samples[i] * 32767);

      // Delta encoding
      const delta = intSample - prevSample;
      prevSample = intSample;

      // Store as bytes
      compressed.set(writeIndex++, delta & 0xff);
      compressed.set(writeIndex++, (delta >> 8) & 0xff);
    }

    compressed.resize(writeIndex);
    return compressed;
  }

  decompressAudioChunk(compressedVector) {
    const compressed = compressedVector.data;
    const samples = new VectorFloat();
    samples.resize(Math.floor(compressed.length / 2));

    let currentSample = 0;
    let readIndex = 0;
    let writeIndex = 0;

    while (readIndex < compressed.length - 1) {
      // Reconstruct delta
      const delta = compressed[readIndex] | (compressed[readIndex + 1] << 8);
      readIndex += 2;

      currentSample += delta;

      // Convert back to float
      const floatSample = currentSample / 32767.0;
      samples.set(writeIndex++, floatSample);
    }

    samples.resize(writeIndex);
    return samples;
  }
}

// Module interface
const FastAudioModule = {
  AudioProcessor,
  StreamOptimizer,
  VectorFloat,
  VectorUint8,
};

// Export for different module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = FastAudioModule;
}

if (typeof window !== "undefined") {
  window.FastAudioModule = FastAudioModule;
}

// ES6 module default export
export default function () {
  return Promise.resolve(FastAudioModule);
}
