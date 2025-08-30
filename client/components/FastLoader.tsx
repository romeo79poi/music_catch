import React from "react";
import { motion } from "framer-motion";

interface FastLoaderProps {
  message?: string;
  timeout?: number;
  onTimeout?: () => void;
}

export const FastLoader: React.FC<FastLoaderProps> = ({
  message = "Loading...",
  timeout = 3000,
  onTimeout,
}) => {
  React.useEffect(() => {
    if (timeout && onTimeout) {
      const timer = setTimeout(onTimeout, timeout);
      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <motion.div
          className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground text-sm"
        >
          {message}
        </motion.p>
        {timeout && timeout > 2000 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-xs text-muted-foreground/60 mt-2"
          >
            Taking longer than usual...
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default FastLoader;
