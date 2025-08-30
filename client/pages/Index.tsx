import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");
  // Fetch users on component mount
  useEffect(() => {
    fetchDemo();
  }, []);

  // Example of how to fetch data from the server (if needed)
  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = (await response.json()) as DemoResponse;
      setExampleFromServer(data.message);
    } catch (error) {
      console.error("Error fetching hello:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-darker via-background to-purple-dark">
      <div className="text-center relative">
        {/* Background glow effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-primary/10 via-purple-secondary/5 to-purple-accent/10 rounded-3xl blur-xl"></div>

        <div className="relative bg-purple-dark/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-primary/20 shadow-2xl shadow-purple-primary/10">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3 mb-4">
            <svg
              className="animate-spin h-8 w-8 text-purple-primary"
              viewBox="0 0 50 50"
            >
              <circle
                className="opacity-30"
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
              />
              <circle
                className="text-purple-primary"
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset="75"
              />
            </svg>
            <span className="purple-gradient-text">Catch</span> is loading...
          </h1>
          <p className="mt-4 text-gray-300 max-w-md mx-auto">
            Your premium music streaming experience is starting up
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-1">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="w-2 h-2 bg-gradient-to-r from-purple-primary to-purple-secondary rounded-full animate-pulse"
                  style={{ animationDelay: `${index * 0.2}s` }}
                />
              ))}
            </div>
          </div>
          <p className="mt-4 hidden max-w-md">{exampleFromServer}</p>
        </div>
      </div>
    </div>
  );
}
