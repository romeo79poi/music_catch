// Worker version of fast audio module
// Same implementation as main module but optimized for Web Worker context

// Import the main module
importScripts("./fast_audio.js");

// Re-export for worker context
self.FastAudioModule = self.FastAudioModule || window.FastAudioModule;

// Worker-specific optimizations
class WorkerAudioProcessor extends self.FastAudioModule.AudioProcessor {
  constructor() {
    super();
    this.isWorkerContext = true;
    this.bufferSize = 4096; // Larger buffer for worker processing
  }

  // Optimized batch processing for worker context
  processBatch(inputBuffers, outputBuffers) {
    const startTime = performance.now();
    let totalSamples = 0;

    for (let i = 0; i < inputBuffers.length; i++) {
      const inputVector = new self.FastAudioModule.VectorFloat(inputBuffers[i]);
      const outputVector = new self.FastAudioModule.VectorFloat();

      this.processAudioChunk(inputVector, outputVector);

      // Copy to output buffer
      const outputSize = outputVector.size();
      if (!outputBuffers[i]) {
        outputBuffers[i] = new Float32Array(outputSize);
      }

      for (let j = 0; j < outputSize; j++) {
        outputBuffers[i][j] = outputVector.get(j);
      }

      totalSamples += outputSize;

      // Cleanup
      inputVector.delete();
      outputVector.delete();
    }

    const processingTime = performance.now() - startTime;
    return {
      samplesProcessed: totalSamples,
      processingTime,
      efficiency: (totalSamples / 48000 / (processingTime / 1000)) * 100,
    };
  }
}

// Replace the standard AudioProcessor with worker-optimized version
self.FastAudioModule.AudioProcessor = WorkerAudioProcessor;

// Export for worker module system
self.default = function () {
  return Promise.resolve(self.FastAudioModule);
};
