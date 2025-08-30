import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Cpu,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Gauge,
} from "lucide-react";
import { useAudioPerformanceMonitor } from "../hooks/use-fast-audio";

interface AudioPerformanceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

export default function AudioPerformanceMonitor({
  className = "",
  showDetails = false,
}: AudioPerformanceMonitorProps) {
  const metrics = useAudioPerformanceMonitor();
  const [isExpanded, setIsExpanded] = useState(showDetails);
  const [previousMetrics, setPreviousMetrics] = useState(metrics);

  useEffect(() => {
    setPreviousMetrics(metrics);
  }, [metrics]);

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return "text-green-400";
    if (efficiency >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getEfficiencyBg = (efficiency: number) => {
    if (efficiency >= 90) return "bg-green-500/20";
    if (efficiency >= 70) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const formatNumber = (num: number, decimals: number = 1) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
    return num.toFixed(decimals);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-black/90 backdrop-blur-sm rounded-lg border border-gray-800 ${className}`}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ rotate: metrics.efficiency > 90 ? 360 : 0 }}
            transition={{
              duration: 2,
              repeat: metrics.efficiency > 90 ? Infinity : 0,
            }}
            className={`p-2 rounded-full ${getEfficiencyBg(metrics.efficiency)}`}
          >
            <Zap
              className={`w-4 h-4 ${getEfficiencyColor(metrics.efficiency)}`}
            />
          </motion.div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium text-sm">
                C++ Audio Engine
              </span>
              <motion.div
                className={`w-2 h-2 rounded-full ${metrics.samplesPerSecond > 0 ? "bg-green-400" : "bg-gray-400"}`}
                animate={{
                  scale: metrics.samplesPerSecond > 0 ? [1, 1.2, 1] : 1,
                  opacity: metrics.samplesPerSecond > 0 ? [1, 0.7, 1] : 0.5,
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span className={getEfficiencyColor(metrics.efficiency)}>
                {metrics.efficiency.toFixed(0)}% efficient
              </span>
              <span>{formatNumber(metrics.samplesPerSecond)} smp/s</span>
            </div>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </motion.div>

      {/* Detailed Metrics */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-800 p-3 space-y-3"
          >
            {/* Performance Bars */}
            <div className="space-y-2">
              {/* Efficiency Bar */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Gauge className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300">Efficiency</span>
                </div>
                <span className={getEfficiencyColor(metrics.efficiency)}>
                  {metrics.efficiency.toFixed(1)}%
                </span>
              </div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    metrics.efficiency >= 90
                      ? "bg-green-400"
                      : metrics.efficiency >= 70
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, metrics.efficiency)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Processing Time */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-300">Avg Processing</span>
                </div>
                <span className="text-blue-400">
                  {metrics.averageProcessingTime.toFixed(2)}ms
                </span>
              </div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, metrics.averageProcessingTime * 10)}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                className="bg-gray-800/50 rounded p-2"
                whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.7)" }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-gray-300">Samples/sec</span>
                </div>
                <motion.span
                  key={metrics.samplesPerSecond}
                  initial={{ scale: 1.1, color: "#8b5cf6" }}
                  animate={{ scale: 1, color: "#ffffff" }}
                  className="text-sm font-mono font-medium text-white"
                >
                  {formatNumber(metrics.samplesPerSecond)}
                </motion.span>
              </motion.div>

              <motion.div
                className="bg-gray-800/50 rounded p-2"
                whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.7)" }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-gray-300">Underruns</span>
                </div>
                <motion.span
                  key={metrics.bufferUnderruns}
                  initial={{
                    scale:
                      metrics.bufferUnderruns > previousMetrics.bufferUnderruns
                        ? 1.2
                        : 1,
                  }}
                  animate={{ scale: 1 }}
                  className={`text-sm font-mono font-medium ${
                    metrics.bufferUnderruns > 0
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {metrics.bufferUnderruns}
                </motion.span>
              </motion.div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center justify-center space-x-2 p-2 bg-gray-800/30 rounded">
              <motion.div
                className={`w-1 h-1 rounded-full ${
                  metrics.efficiency > 90
                    ? "bg-green-400"
                    : metrics.efficiency > 70
                      ? "bg-yellow-400"
                      : "bg-red-400"
                }`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs text-gray-400">
                {metrics.efficiency > 90
                  ? "Optimal Performance"
                  : metrics.efficiency > 70
                    ? "Good Performance"
                    : "Performance Issues"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Compact version for minimal UI space
export function CompactAudioPerformanceIndicator({
  className = "",
}: {
  className?: string;
}) {
  const metrics = useAudioPerformanceMonitor();

  return (
    <motion.div
      className={`flex items-center space-x-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${
          metrics.efficiency > 90
            ? "bg-green-400"
            : metrics.efficiency > 70
              ? "bg-yellow-400"
              : "bg-red-400"
        }`}
        animate={{
          scale: metrics.samplesPerSecond > 0 ? [1, 1.2, 1] : 1,
          opacity: [0.7, 1, 0.7],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="text-xs text-gray-400 font-mono">
        C++ {metrics.efficiency.toFixed(0)}%
      </span>
    </motion.div>
  );
}
