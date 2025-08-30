import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-darker via-background to-purple-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-primary/8 via-purple-secondary/4 to-purple-accent/6"></div>
      <div className="relative z-10 text-center bg-purple-dark/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-primary/20 shadow-2xl shadow-purple-primary/10">
        <h1 className="text-6xl font-bold mb-4 purple-gradient-text">404</h1>
        <p className="text-xl text-gray-300 mb-6">Oops! Page not found</p>
        <a href="/" className="inline-block bg-gradient-to-r from-purple-primary to-purple-secondary text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-secondary hover:to-purple-accent transition-all duration-200 shadow-lg shadow-purple-primary/30 hover:scale-105">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
