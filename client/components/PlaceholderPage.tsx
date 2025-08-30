import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({
  title,
  description = "This page is coming soon. Continue prompting to add content here.",
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-green/5 via-transparent to-neon-blue/5"></div>

      <div className="relative z-10 text-center max-w-md">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-0 left-0"
        >
          <Link
            to="/home"
            className="flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Link>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-16"
        >
          <div className="w-24 h-24 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-green to-neon-blue rounded-lg"></div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            {description}
          </p>

          <Link
            to="/home"
            className="inline-flex items-center justify-center h-12 px-8 bg-gradient-to-r from-neon-green to-emerald-400 rounded-full text-slate-900 font-bold hover:from-emerald-400 hover:to-neon-green transition-all transform hover:scale-105"
          >
            Go Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
