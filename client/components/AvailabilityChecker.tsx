import React, { useState, useEffect } from "react";
import { Check, X, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

interface AvailabilityCheckerProps {
  value: string;
  field: "email" | "username" | "phone";
  onCheck: (field: string, value: string) => Promise<boolean>;
  className?: string;
  debounceMs?: number;
  minLength?: number;
}

type CheckStatus = "idle" | "checking" | "available" | "unavailable" | "error";

export const AvailabilityChecker: React.FC<AvailabilityCheckerProps> = ({
  value,
  field,
  onCheck,
  className,
  debounceMs = 800,
  minLength = 2,
}) => {
  const [status, setStatus] = useState<CheckStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log(
      `🔄 AvailabilityChecker useEffect - field: ${field}, value: "${value}", minLength: ${minLength}`,
    );

    if (!value || value.length < minLength) {
      console.log(`⏸️ Skipping check - value too short or empty`);
      setStatus("idle");
      setMessage("");
      return;
    }

    console.log(`⏳ Starting availability check for ${field}: "${value}"`);
    setStatus("checking");
    setMessage("");

    const timeoutId = setTimeout(async () => {
      try {
        console.log(`🔍 Checking ${field} availability for: "${value}"`);
        const isAvailable = await onCheck(field, value);
        console.log(`✅ ${field} availability result:`, isAvailable);

        if (isAvailable) {
          setStatus("available");
          setMessage(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is available`,
          );
        } else {
          setStatus("unavailable");
          setMessage(
            `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`,
          );
        }
      } catch (error) {
        setStatus("error");
        // Show the specific error message if it's a validation error
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unable to check availability";
        setMessage(errorMessage);
        console.error(
          `❌ Error checking ${field} availability for "${value}":`,
          error,
        );
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, field, onCheck, debounceMs, minLength]);

  if (status === "idle") return null;

  const getStatusConfig = () => {
    switch (status) {
      case "checking":
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
          borderColor: "border-blue-400/20",
        };
      case "available":
        return {
          icon: <Check className="w-4 h-4" />,
          color: "text-neon-green",
          bgColor: "bg-neon-green/10",
          borderColor: "border-neon-green/20",
        };
      case "unavailable":
        return {
          icon: <X className="w-4 h-4" />,
          color: "text-red-400",
          bgColor: "bg-red-400/10",
          borderColor: "border-red-400/20",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: "text-yellow-400",
          bgColor: "bg-yellow-400/10",
          borderColor: "border-yellow-400/20",
        };
      default:
        return {
          icon: null,
          color: "",
          bgColor: "",
          borderColor: "",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center space-x-2 p-2 rounded-lg border transition-all duration-300",
          config.bgColor,
          config.borderColor,
          className,
        )}
      >
        <div className={config.color}>{config.icon}</div>
        <span className={cn("text-sm font-medium", config.color)}>
          {message}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvailabilityChecker;
