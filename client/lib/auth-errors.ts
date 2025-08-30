export interface AuthError {
  code: string;
  message: string;
  field?: string;
  action?: string;
}

export const AUTH_ERROR_CODES = {
  // Network & API Errors
  NETWORK_ERROR: "network-error",
  SERVER_ERROR: "server-error",
  RATE_LIMITED: "rate-limited",

  // Authentication Errors
  INVALID_CREDENTIALS: "invalid-credentials",
  USER_NOT_FOUND: "user-not-found",
  USER_ALREADY_EXISTS: "user-already-exists",

  // Email Errors
  INVALID_EMAIL: "invalid-email",
  EMAIL_IN_USE: "email-in-use",
  EMAIL_NOT_VERIFIED: "email-not-verified",
  INVALID_OTP: "invalid-otp",
  OTP_EXPIRED: "otp-expired",

  // Phone Errors
  INVALID_PHONE: "invalid-phone",
  PHONE_IN_USE: "phone-in-use",
  SMS_FAILED: "sms-failed",

  // Password Errors
  WEAK_PASSWORD: "weak-password",
  PASSWORD_MISMATCH: "password-mismatch",

  // Profile Errors
  USERNAME_IN_USE: "username-in-use",
  INVALID_USERNAME: "invalid-username",
  MISSING_PROFILE_INFO: "missing-profile-info",

  // Firebase Errors
  POPUP_CLOSED: "popup-closed",
  POPUP_BLOCKED: "popup-blocked",
  RECAPTCHA_FAILED: "recaptcha-failed",
} as const;

export const getErrorMessage = (error: any): AuthError => {
  // Handle Firebase errors
  if (error?.code?.startsWith("auth/")) {
    return handleFirebaseError(error);
  }

  // Handle API response errors
  if (error?.response?.data) {
    return handleAPIError(error.response.data);
  }

  // Handle fetch errors
  if (error?.message) {
    return handleGenericError(error);
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      code: AUTH_ERROR_CODES.SERVER_ERROR,
      message: error,
    };
  }

  // Default error
  return {
    code: AUTH_ERROR_CODES.SERVER_ERROR,
    message: "An unexpected error occurred. Please try again.",
  };
};

const handleFirebaseError = (error: any): AuthError => {
  const errorCode = error.code;

  switch (errorCode) {
    case "auth/email-already-in-use":
      return {
        code: AUTH_ERROR_CODES.EMAIL_IN_USE,
        message: "This email is already registered. Please sign in instead.",
        field: "email",
        action: "Use a different email or sign in",
      };

    case "auth/invalid-email":
      return {
        code: AUTH_ERROR_CODES.INVALID_EMAIL,
        message: "Please enter a valid email address.",
        field: "email",
      };

    case "auth/weak-password":
      return {
        code: AUTH_ERROR_CODES.WEAK_PASSWORD,
        message: "Password is too weak. Please choose a stronger password.",
        field: "password",
      };

    case "auth/invalid-phone-number":
      return {
        code: AUTH_ERROR_CODES.INVALID_PHONE,
        message: "Please enter a valid phone number.",
        field: "phone",
      };

    case "auth/popup-closed-by-user":
      return {
        code: AUTH_ERROR_CODES.POPUP_CLOSED,
        message: "Sign-in was cancelled. Please try again.",
        action: "Try signing in again",
      };

    case "auth/popup-blocked":
      return {
        code: AUTH_ERROR_CODES.POPUP_BLOCKED,
        message:
          "Pop-up was blocked by your browser. Please allow pop-ups and try again.",
        action: "Allow pop-ups and retry",
      };

    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
      return {
        code: AUTH_ERROR_CODES.RECAPTCHA_FAILED,
        message: "Security verification failed. Please try again.",
        action: "Refresh and try again",
      };

    case "auth/too-many-requests":
      return {
        code: AUTH_ERROR_CODES.RATE_LIMITED,
        message: "Too many attempts. Please wait a moment before trying again.",
        action: "Wait and try again",
      };

    case "auth/network-request-failed":
      return {
        code: AUTH_ERROR_CODES.NETWORK_ERROR,
        message: "Network error. Please check your connection and try again.",
        action: "Check connection and retry",
      };

    default:
      return {
        code: AUTH_ERROR_CODES.SERVER_ERROR,
        message: error.message || "Authentication failed. Please try again.",
      };
  }
};

const handleAPIError = (data: any): AuthError => {
  const { error, message, code, field } = data;

  // Handle specific API error codes
  if (code) {
    switch (code) {
      case "EMAIL_EXISTS":
        return {
          code: AUTH_ERROR_CODES.EMAIL_IN_USE,
          message: "This email is already registered.",
          field: "email",
        };

      case "PHONE_EXISTS":
        return {
          code: AUTH_ERROR_CODES.PHONE_IN_USE,
          message: "This phone number is already registered.",
          field: "phone",
        };

      case "USERNAME_EXISTS":
        return {
          code: AUTH_ERROR_CODES.USERNAME_IN_USE,
          message: "This username is already taken.",
          field: "username",
        };

      case "INVALID_OTP":
        return {
          code: AUTH_ERROR_CODES.INVALID_OTP,
          message: "Invalid verification code. Please try again.",
          field: "otp",
        };

      case "OTP_EXPIRED":
        return {
          code: AUTH_ERROR_CODES.OTP_EXPIRED,
          message: "Verification code has expired. Please request a new one.",
          field: "otp",
          action: "Request new code",
        };

      case "RATE_LIMITED":
        return {
          code: AUTH_ERROR_CODES.RATE_LIMITED,
          message: "Too many requests. Please wait before trying again.",
          action: "Wait and try again",
        };

      default:
        break;
    }
  }

  return {
    code: AUTH_ERROR_CODES.SERVER_ERROR,
    message: message || error || "Server error. Please try again.",
    field,
  };
};

const handleGenericError = (error: any): AuthError => {
  const message = error.message.toLowerCase();

  if (message.includes("network") || message.includes("fetch")) {
    return {
      code: AUTH_ERROR_CODES.NETWORK_ERROR,
      message: "Network error. Please check your connection.",
      action: "Check connection and retry",
    };
  }

  if (message.includes("timeout")) {
    return {
      code: AUTH_ERROR_CODES.NETWORK_ERROR,
      message: "Request timed out. Please try again.",
      action: "Try again",
    };
  }

  return {
    code: AUTH_ERROR_CODES.SERVER_ERROR,
    message: "An unexpected error occurred. Please try again.",
  };
};

export const getErrorColor = (code: string): string => {
  switch (code) {
    case AUTH_ERROR_CODES.RATE_LIMITED:
    case AUTH_ERROR_CODES.OTP_EXPIRED:
      return "yellow";
    case AUTH_ERROR_CODES.NETWORK_ERROR:
      return "blue";
    default:
      return "red";
  }
};

export const shouldRetry = (code: string): boolean => {
  return [
    AUTH_ERROR_CODES.NETWORK_ERROR,
    AUTH_ERROR_CODES.SERVER_ERROR,
    AUTH_ERROR_CODES.SMS_FAILED,
  ].includes(code as any);
};

export const shouldShowField = (code: string): boolean => {
  return [
    AUTH_ERROR_CODES.INVALID_EMAIL,
    AUTH_ERROR_CODES.EMAIL_IN_USE,
    AUTH_ERROR_CODES.INVALID_PHONE,
    AUTH_ERROR_CODES.PHONE_IN_USE,
    AUTH_ERROR_CODES.USERNAME_IN_USE,
    AUTH_ERROR_CODES.WEAK_PASSWORD,
    AUTH_ERROR_CODES.INVALID_OTP,
  ].includes(code as any);
};
