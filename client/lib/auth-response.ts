import { getErrorMessage, AuthError } from "./auth-errors";

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
  message?: string;
  token?: string;
  user?: any;
}

export interface AuthOptions {
  showToast?: boolean;
  redirectOnSuccess?: string;
  onSuccess?: (response: AuthResponse) => void;
  onError?: (error: AuthError) => void;
}

export const handleAuthResponse = async <T>(
  promise: Promise<any>,
  options: AuthOptions = {},
): Promise<AuthResponse<T>> => {
  const { showToast = true, redirectOnSuccess, onSuccess, onError } = options;

  try {
    const result = await promise;

    // Handle different response types
    let response: AuthResponse<T>;

    if (result?.success !== undefined) {
      // API response format
      response = {
        success: result.success,
        data: result.data,
        message: result.message,
        token: result.token,
        user: result.user,
      };

      if (!result.success) {
        response.error = getErrorMessage(result);
      }
    } else if (result?.user) {
      // Firebase response format
      response = {
        success: true,
        data: result,
        user: result.user,
        message: "Authentication successful",
      };
    } else if (result?.error || result?.code?.startsWith("auth/")) {
      // Error response
      response = {
        success: false,
        error: getErrorMessage(result),
      };
    } else {
      // Generic success
      response = {
        success: true,
        data: result,
        message: "Operation completed successfully",
      };
    }

    // Handle success
    if (response.success) {
      if (showToast && window.toast) {
        window.toast({
          title: "Success!",
          description: response.message || "Operation completed successfully",
        });
      }

      if (onSuccess) {
        onSuccess(response);
      }

      if (redirectOnSuccess) {
        window.location.href = redirectOnSuccess;
      }

      return response;
    } else {
      // Handle error
      const error = response.error!;

      if (showToast && window.toast) {
        window.toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }

      if (onError) {
        onError(error);
      }

      return response;
    }
  } catch (err) {
    const error = getErrorMessage(err);

    const response: AuthResponse<T> = {
      success: false,
      error,
    };

    if (showToast && window.toast) {
      window.toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }

    if (onError) {
      onError(error);
    }

    return response;
  }
};

export const createAuthRequest = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw {
      status: response.status,
      code: data.code,
      message: data.message || `HTTP ${response.status}`,
      ...data,
    };
  }

  return data;
};

export const saveAuthData = (response: AuthResponse) => {
  if (response.success && response.token) {
    localStorage.setItem("token", response.token);
  }

  if (response.success && response.user) {
    localStorage.setItem("user", JSON.stringify(response.user));
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getStoredAuth = () => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  return { token, user };
};

// Add toast function to window for global access
declare global {
  interface Window {
    toast?: (options: {
      title: string;
      description: string;
      variant?: "default" | "destructive";
    }) => void;
  }
}
