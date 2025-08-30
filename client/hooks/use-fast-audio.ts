import { useEffect, useRef, useState, useCallback } from "react";
import { fastAudioEngine } from "../lib/fast-audio-engine";

interface AudioPerformanceMetrics {
  samplesPerSecond: number;
  averageProcessingTime: number;
  efficiency: number;
  bufferUnderruns: number;
}

interface FastAudioControls {
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  setMuted: (muted: boolean) => void;
  setEqualizerBand: (band: number, gain: number) => void;
  processAudioBuffer: (buffer: Float32Array) => Float32Array;
  crossfadeTracks: (
    track1: Float32Array,
    track2: Float32Array,
    fadeRatio: number,
  ) => Float32Array;
  getSpectrumData: (buffer: Float32Array, fftSize?: number) => Float32Array;
  getPerformanceMetrics: () => AudioPerformanceMetrics;
  isEngineReady: boolean;
}

export function useFastAudio(): FastAudioControls {
  const [isEngineReady, setIsEngineReady] = useState(false);
  const initializationAttempted = useRef(false);

  useEffect(() => {
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;

      fastAudioEngine
        .initialize()
        .then(() => {
          setIsEngineReady(true);
          console.log(
            "🚀 Fast C++ Audio Engine ready for high-performance processing",
          );
        })
        .catch((error) => {
          console.warn(
            "⚠️ Fast audio engine initialization failed, using JavaScript fallback:",
            error,
          );
          setIsEngineReady(true); // Still ready, just using fallback
        });
    }

    return () => {
      // Cleanup is handled by the engine itself
    };
  }, []);

  const setVolume = useCallback(
    (volume: number) => {
      if (isEngineReady) {
        fastAudioEngine.setVolume(volume);
      }
    },
    [isEngineReady],
  );

  const setSpeed = useCallback(
    (speed: number) => {
      if (isEngineReady) {
        fastAudioEngine.setSpeed(speed);
      }
    },
    [isEngineReady],
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      if (isEngineReady) {
        fastAudioEngine.setMuted(muted);
      }
    },
    [isEngineReady],
  );

  const setEqualizerBand = useCallback(
    (band: number, gain: number) => {
      if (isEngineReady) {
        fastAudioEngine.setEqualizerBand(band, gain);
      }
    },
    [isEngineReady],
  );

  const processAudioBuffer = useCallback(
    (buffer: Float32Array): Float32Array => {
      if (isEngineReady) {
        return fastAudioEngine.processAudioBuffer(buffer);
      }
      return buffer;
    },
    [isEngineReady],
  );

  const crossfadeTracks = useCallback(
    (
      track1: Float32Array,
      track2: Float32Array,
      fadeRatio: number,
    ): Float32Array => {
      if (isEngineReady) {
        return fastAudioEngine.crossfadeTracks(track1, track2, fadeRatio);
      }

      // JavaScript fallback
      const length = Math.min(track1.length, track2.length);
      const result = new Float32Array(length);
      const fade1 = 1 - fadeRatio;
      const fade2 = fadeRatio;

      for (let i = 0; i < length; i++) {
        result[i] = track1[i] * fade1 + track2[i] * fade2;
      }

      return result;
    },
    [isEngineReady],
  );

  const getSpectrumData = useCallback(
    (buffer: Float32Array, fftSize: number = 512): Float32Array => {
      if (isEngineReady) {
        return fastAudioEngine.getSpectrumData(buffer, fftSize);
      }

      // Simple fallback spectrum analysis
      const spectrum = new Float32Array(fftSize / 2);
      const hop = Math.floor(buffer.length / spectrum.length);

      for (let i = 0; i < spectrum.length; i++) {
        let magnitude = 0;
        const start = i * hop;
        const end = Math.min(start + hop, buffer.length);

        for (let j = start; j < end; j++) {
          magnitude += Math.abs(buffer[j]);
        }

        spectrum[i] = magnitude / (end - start);
      }

      return spectrum;
    },
    [isEngineReady],
  );

  const getPerformanceMetrics = useCallback((): AudioPerformanceMetrics => {
    if (isEngineReady) {
      return fastAudioEngine.getPerformanceMetrics();
    }

    return {
      samplesPerSecond: 0,
      averageProcessingTime: 0,
      efficiency: 100,
      bufferUnderruns: 0,
    };
  }, [isEngineReady]);

  return {
    setVolume,
    setSpeed,
    setMuted,
    setEqualizerBand,
    processAudioBuffer,
    crossfadeTracks,
    getSpectrumData,
    getPerformanceMetrics,
    isEngineReady,
  };
}

// Hook for real-time spectrum visualization
export function useAudioSpectrum(
  audioElement: HTMLAudioElement | null,
  fftSize: number = 512,
) {
  const [spectrum, setSpectrum] = useState<Float32Array>(
    new Float32Array(fftSize / 2),
  );
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();
  const fastAudio = useFastAudio();

  useEffect(() => {
    if (!audioElement || !fastAudio.isEngineReady) return;

    try {
      // Create Web Audio API context for spectrum analysis
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioElement);

      analyzer.fftSize = fftSize;
      analyzer.smoothingTimeConstant = 0.8;

      source.connect(analyzer);
      analyzer.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      sourceRef.current = source;

      const updateSpectrum = () => {
        if (analyzerRef.current) {
          const bufferLength = analyzerRef.current.frequencyBinCount;
          const dataArray = new Float32Array(bufferLength);
          analyzerRef.current.getFloatFrequencyData(dataArray);

          // Use fast C++ engine for enhanced spectrum processing
          const enhancedSpectrum = fastAudio.getSpectrumData(
            dataArray,
            fftSize,
          );
          setSpectrum(enhancedSpectrum);
        }

        animationFrameRef.current = requestAnimationFrame(updateSpectrum);
      };

      updateSpectrum();
    } catch (error) {
      console.warn("Failed to initialize spectrum analyzer:", error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioElement, fftSize, fastAudio.isEngineReady]);

  return spectrum;
}

// Hook for monitoring audio performance
export function useAudioPerformanceMonitor() {
  const [metrics, setMetrics] = useState<AudioPerformanceMetrics>({
    samplesPerSecond: 0,
    averageProcessingTime: 0,
    efficiency: 100,
    bufferUnderruns: 0,
  });

  const fastAudio = useFastAudio();

  useEffect(() => {
    if (!fastAudio.isEngineReady) return;

    const interval = setInterval(() => {
      const currentMetrics = fastAudio.getPerformanceMetrics();
      setMetrics(currentMetrics);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [fastAudio.isEngineReady]);

  return metrics;
}
