import React from "react";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
  weight: number;
}

const passwordRules: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
    weight: 100,
  },
];

export const PasswordStrengthIndicator: React.FC<
  PasswordStrengthIndicatorProps
> = ({ password, className }) => {
  if (!password) return null;

  const passedRules = passwordRules.filter((rule) => rule.test(password));
  const strength = passedRules.reduce((total, rule) => total + rule.weight, 0);

  const getStrengthColor = (strength: number) => {
    if (strength < 100) return "from-red-500 to-red-600";
    return "from-neon-green to-neon-blue";
  };

  const getStrengthLabel = (strength: number) => {
    if (strength < 100) return { label: "Too Short", color: "text-red-400" };
    return { label: "Strong", color: "text-neon-green" };
  };

  const strengthInfo = getStrengthLabel(strength);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("space-y-3", className)}
    >
      <div className="space-y-2">
        <div className="relative mt-2"></div>
      </div>
    </motion.div>
  );
};

export default PasswordStrengthIndicator;
