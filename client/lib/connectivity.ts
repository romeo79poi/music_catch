// Connectivity and network utility functions

export class ConnectivityChecker {
  private static isOnline: boolean = navigator.onLine;
  private static listeners: Array<(online: boolean) => void> = [];

  static {
    // Set up event listeners for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });
  }

  static getConnectionStatus(): boolean {
    return this.isOnline;
  }

  static addListener(callback: (online: boolean) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(online: boolean): void {
    this.listeners.forEach((callback) => callback(online));
  }

  static async checkInternetConnection(): Promise<boolean> {
    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch("/api/ping", {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      try {
        // Fallback: try a different endpoint
        const response = await fetch("/", {
          method: "HEAD",
          cache: "no-cache",
          signal: AbortSignal.timeout(3000), // 3 second timeout
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  }

  static async checkFirebaseConnectivity(): Promise<boolean> {
    try {
      // Try to reach Firebase Auth service
      const response = await fetch(
        "https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectInfo",
        {
          method: "HEAD",
          cache: "no-cache",
          signal: AbortSignal.timeout(5000),
        },
      );
      return response.status !== 0; // Any response means we can reach Firebase
    } catch {
      return false;
    }
  }

  static getConnectionType(): string {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (!connection) {
      return "unknown";
    }

    return connection.effectiveType || connection.type || "unknown";
  }

  static isSlowConnection(): boolean {
    const connectionType = this.getConnectionType();
    return ["slow-2g", "2g"].includes(connectionType);
  }

  static async waitForConnection(timeout: number = 10000): Promise<boolean> {
    if (this.isOnline) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.addListener((online) => {
        if (online) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }
}

export const getNetworkErrorMessage = (error: any): string => {
  if (!ConnectivityChecker.getConnectionStatus()) {
    return "You're offline. Please check your internet connection and try again.";
  }

  if (ConnectivityChecker.isSlowConnection()) {
    return "Your connection seems slow. Please wait a moment and try again.";
  }

  if (
    error?.code === "auth/network-request-failed" ||
    error?.message?.includes("network")
  ) {
    return "Network connection failed. Please check your internet connection and try again.";
  }

  if (error?.code === "auth/timeout" || error?.message?.includes("timeout")) {
    return "The request timed out. Please check your connection and try again.";
  }

  return "Connection error. Please check your internet connection and try again.";
};

export default ConnectivityChecker;
