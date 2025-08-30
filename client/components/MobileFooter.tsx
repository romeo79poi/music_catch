import React from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Search,
  Upload,
  Library,
  BarChart3,
  Clock,
  User,
  Plus,
  Mic,
} from "lucide-react";

interface FooterProps {
  className?: string;
}

export default function MobileFooter({ className = "" }: FooterProps) {
  const location = useLocation();

  const navItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      path: "/home",
    },
    {
      id: "search",
      label: "Search",
      icon: Search,
      path: "/search",
    },
    {
      id: "reels",
      label: "Reels",
      icon: Plus,
      path: "/reels",
      isSpecial: true,
    },
    {
      id: "library",
      label: "Library",
      icon: Library,
      path: "/library",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      path: "/profile",
    },
  ];

  // Special handling for alternative paths
  const getActiveItem = () => {
    const currentPath = location.pathname;

    // Handle exact matches first
    const exactMatch = navItems.find((item) => item.path === currentPath);
    if (exactMatch) return exactMatch;

    // Handle special cases
    if (currentPath === "/" || currentPath === "/index") {
      return navItems.find((item) => item.id === "home");
    }

    // History page should show Library as active since it's part of library functionality
    if (currentPath === "/history") {
      return navItems.find((item) => item.id === "library");
    }

    // Reels page
    if (currentPath === "/reels") {
      return navItems.find((item) => item.id === "reels");
    }

    return null;
  };

  const activeItem = getActiveItem();

  return (
    <motion.footer
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
      className={`fixed bottom-0 left-0 right-0 bg-black/95 dark:bg-black/95 light:bg-white/98 light:claude-shadow backdrop-blur-xl border-t border-purple-primary/20 dark:border-purple-primary/20 light:border-gray-200 z-50 theme-transition ${className}`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-purple-primary/5 via-purple-secondary/2 to-transparent dark:from-purple-primary/5 dark:via-purple-secondary/2 dark:to-transparent light:from-transparent light:to-transparent theme-transition"></div>

      {/* Instagram-style Mobile Navigation */}
      <div
        className="relative z-10 px-4 py-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = activeItem?.id === item.id;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                to={item.path}
                className="flex flex-col items-center py-2 px-3 min-w-0 flex-1"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center transition-all duration-200 group"
                >
                  {/* Icon Container - Instagram Style */}
                  <motion.div
                    animate={
                      isActive
                        ? {
                            boxShadow: [
                              "0 0 0px rgba(34, 197, 94, 0.4)",
                              "0 0 15px rgba(34, 197, 94, 0.6)",
                              "0 0 0px rgba(34, 197, 94, 0.4)",
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`relative p-2 transition-all duration-300 ${
                      item.isSpecial ? "rounded-xl" : "rounded-full"
                    }`}
                  >
                    {/* Special Reels button styling */}
                    {item.isSpecial ? (
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-r dark:from-purple-primary dark:to-purple-secondary light:bg-black flex items-center justify-center ${
                          isActive ? "scale-110" : ""
                        }`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <>
                        {/* Active state background circle */}
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 bg-gradient-to-r dark:from-neon-green/20 dark:to-purple-secondary/20 light:bg-black/10 rounded-full border dark:border-neon-green/30 light:border-black/30"
                          />
                        )}

                        <Icon
                          className={`w-6 h-6 relative z-10 transition-all duration-300 ${
                            isActive
                              ? "text-neon-green dark:text-neon-green light:text-black scale-110"
                              : "text-gray-400 dark:text-gray-400 light:text-gray-600 group-hover:text-purple-primary dark:group-hover:text-purple-primary light:group-hover:text-black"
                          }`}
                        />
                      </>
                    )}

                    {/* Active indicator dot */}
                    {isActive && !item.isSpecial && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-neon-green dark:bg-neon-green light:bg-black rounded-full"
                      />
                    )}

                    {/* Notification badge for profile */}
                    {item.id === "profile" && (
                      <motion.span
                        animate={{
                          scale: [1, 1.1, 1],
                          transition: { duration: 2, repeat: Infinity },
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white"
                      >
                        3
                      </motion.span>
                    )}
                  </motion.div>

                  {/* Label - Only show for active item to save space */}
                  <motion.span
                    animate={{
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : 5,
                    }}
                    transition={{ duration: 0.2 }}
                    className={`text-[10px] mt-1 font-medium transition-all duration-300 ${
                      isActive
                        ? "text-neon-green dark:text-neon-green light:text-black"
                        : "text-transparent"
                    }`}
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.footer>
  );
}
