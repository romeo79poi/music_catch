// Audio Worklet Processor for high-performance background audio processing
// Runs in a separate thread for maximum performance

class FastAudioProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();

    this.wasmModule = null;
    this.audioProcessor = null;
    this.initialized = false;
    this.bufferSize = 1024;
    this.sampleRate = globalThis.sampleRate || 48000;

    // Performance tracking
    this.processedSamples = 0;
    this.startTime = Date.now();

    // Initialize WASM module
    this.initializeWASM(options.processorOptions.wasmModulePath);

    // Listen for control messages from main thread
    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  async initializeWASM(wasmPath) {
    try {
      // Import and initialize WASM module in worker context
      const wasmModule = await import(wasmPath);
      this.wasmModule = await wasmModule.default();
      this.audioProcessor = new this.wasmModule.AudioProcessor();
      this.initialized = true;

      // Notify main thread that we're ready
      this.port.postMessage({
        type: "initialized",
        sampleRate: this.sampleRate,
      });
    } catch (error) {
      console.error("Failed to initialize WASM in worklet:", error);
      this.port.postMessage({
        type: "error",
        message: error.toString(),
      });
    }
  }

  handleMessage(data) {
    if (!this.initialized || !this.audioProcessor) return;

    switch (data.type) {
      case "setVolume":
        this.audioProcessor.setVolume(data.value);
        break;
      case "setSpeed":
        this.audioProcessor.setSpeed(data.value);
        break;
      case "setMuted":
        this.audioProcessor.setMuted(data.value);
        break;
      case "setEqualizer":
        this.audioProcessor.setEqualizerBand(data.band, data.gain);
        break;
      case "getPerformance":
        this.sendPerformanceMetrics();
        break;
    }
  }

  sendPerformanceMetrics() {
    if (!this.audioProcessor) return;

    const now = Date.now();
    const elapsedMs = now - this.startTime;
    const wasmMetrics = this.audioProcessor.getPerformanceMetrics();

    this.port.postMessage({
      type: "performance",
      data: {
        samplesPerSecond: wasmMetrics,
        totalSamples: this.processedSamples,
        elapsedTime: elapsedMs,
        efficiency:
          (this.processedSamples / this.sampleRate / (elapsedMs / 1000)) * 100,
      },
    });
  }

  process(inputs, outputs, parameters) {
    // Skip processing if WASM not initialized
    if (!this.initialized || !this.audioProcessor || !this.wasmModule) {
      return true;
    }

    const input = inputs[0];
    const output = outputs[0];

    if (input.length === 0 || output.length === 0) {
      return true;
    }

    try {
      // Process each channel
      for (
        let channel = 0;
        channel < Math.min(input.length, output.length);
        channel++
      ) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];

        if (inputChannel.length !== outputChannel.length) {
          continue;
        }

        // Convert to WASM vectors for C++ processing
        const inputVector = new this.wasmModule.VectorFloat(
          Array.from(inputChannel),
        );
        const outputVector = new this.wasmModule.VectorFloat([]);

        // Ultra-fast C++ processing
        this.audioProcessor.processAudioChunk(inputVector, outputVector);

        // Copy processed data back to output
        const outputSize = Math.min(outputVector.size(), outputChannel.length);
        for (let i = 0; i < outputSize; i++) {
          outputChannel[i] = outputVector.get(i);
        }

        // Clean up WASM memory
        inputVector.delete();
        outputVector.delete();

        this.processedSamples += inputChannel.length;
      }

      // Send periodic performance updates
      if (this.processedSamples % (this.sampleRate * 2) === 0) {
        // Every 2 seconds
        this.sendPerformanceMetrics();
      }
    } catch (error) {
      console.error("Audio processing error in worklet:", error);

      // Fallback: copy input to output
      for (
        let channel = 0;
        channel < Math.min(input.length, output.length);
        channel++
      ) {
        output[channel].set(input[channel]);
      }
    }

    return true; // Keep the processor alive
  }
}

// Register the processor
registerProcessor("fast-audio-processor", FastAudioProcessor);
