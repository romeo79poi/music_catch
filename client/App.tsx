import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MusicProvider } from "./context/MusicContextSupabase";
import { EnhancedMusicProvider } from "./context/EnhancedMusicContext";
import { ProfileProvider } from "./context/ProfileContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
// import { SocketProvider } from "./context/SocketContext";
import AuthRouter from "./components/AuthRouter";
import MiniPlayer from "./components/MiniPlayer";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Player from "./pages/Player";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import EditAccount from "./pages/EditAccount";
import LikedSongs from "./pages/LikedSongs";
import Library from "./pages/Library";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Upload from "./pages/Upload";
import Rewards from "./pages/Rewards";
import Reels from "./pages/Reels";
import Messages from "./pages/Messages";
import Discover from "./pages/Discover";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import CodeGenerator from "./pages/CodeGenerator";
import AuthTest from "./pages/AuthTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Backend authentication integrated
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <MusicProvider>
                  <EnhancedMusicProvider>
                    <ProfileProvider>
                      <Toaster />
                      <Sonner />
                      <BrowserRouter>
                        <Routes>
                          <Route path="/" element={<AuthRouter />} />
                          <Route path="/splash" element={<Splash />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/signup" element={<Signup />} />
                          <Route path="/home" element={<Home />} />
                          <Route path="/search" element={<Search />} />
                          <Route path="/player" element={<Player />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route
                            path="/edit-profile"
                            element={<EditProfile />}
                          />
                          <Route
                            path="/edit-account"
                            element={<EditAccount />}
                          />
                          <Route path="/liked-songs" element={<LikedSongs />} />
                          <Route path="/library" element={<Library />} />
                          <Route path="/history" element={<History />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route
                            path="/notifications"
                            element={<Notifications />}
                          />
                          <Route path="/upload" element={<Upload />} />
                          <Route path="/rewards" element={<Rewards />} />
                          <Route path="/reels" element={<Reels />} />
                          <Route path="/messages" element={<Messages />} />
                          <Route path="/discover" element={<Discover />} />
                          <Route
                            path="/verify-email"
                            element={<VerifyEmail />}
                          />
                          <Route
                            path="/reset-password"
                            element={<ResetPassword />}
                          />
                          <Route
                            path="/code-generator"
                            element={<CodeGenerator />}
                          />
                          <Route
                            path="/auth-test"
                            element={<AuthTest />}
                          />

                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<NotFound />} />
                        </Routes>

                        {/* Global Mini Player */}
                        <MiniPlayer />
                      </BrowserRouter>
                    </ProfileProvider>
                  </EnhancedMusicProvider>
            </MusicProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
