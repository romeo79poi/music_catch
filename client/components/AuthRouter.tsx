import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useFirebase } from "../context/FirebaseContext";
import Splash from "../pages/Splash";
import Home from "../pages/Home";
import Signup from "../pages/Signup";

export default function AuthRouter() {
  const { user, firebaseUser, loading: authLoading, isAuthenticated } = useAuth();
  const { loading: firebaseLoading, initialized } = useFirebase();
  const [showSplash, setShowSplash] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    // Show splash for at least 2 seconds or until Firebase is initialized
    const timer = setTimeout(() => {
      if (initialized && !firebaseLoading && !authLoading) {
        setSplashComplete(true);
        setShowSplash(false);
      }
    }, 2000);

    // Also check if Firebase initialization is complete
    if (initialized && !firebaseLoading && !authLoading) {
      // Add small delay for smooth transition
      setTimeout(() => {
        setSplashComplete(true);
        setShowSplash(false);
      }, 500);
    }

    return () => clearTimeout(timer);
  }, [initialized, firebaseLoading, authLoading]);

  // Show splash while loading or not yet complete
  if (!splashComplete || firebaseLoading || authLoading || !initialized) {
    return <Splash />;
  }

  // After splash is complete and Firebase is loaded
  // If user is authenticated with Firebase, show Home
  if (isAuthenticated && firebaseUser) {
    console.log("🔥 AuthRouter: User authenticated, showing Home");
    return <Home />;
  }

  // If user is not authenticated, show Signup
  console.log("🔥 AuthRouter: User not authenticated, showing Signup");
  return <Signup />;
}
