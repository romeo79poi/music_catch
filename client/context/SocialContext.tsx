// Stub file - Firebase Firestore social features removed
import { createContext, useContext, ReactNode } from "react";

interface SocialContextType {
  // Placeholder for removed social functionality
}

const SocialContext = createContext<SocialContextType>({});

export function SocialProvider({ children }: { children: ReactNode }) {
  return (
    <SocialContext.Provider value={{}}>
      {children}
    </SocialContext.Provider>
  );
}

export function useSocial() {
  return useContext(SocialContext);
}
