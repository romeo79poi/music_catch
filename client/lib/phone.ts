// Phone number utilities for validation and formatting

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  error?: string;
}

// Format phone number for display
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length > 11) {
    const countryCode = digits.slice(0, digits.length - 10);
    const number = digits.slice(-10);
    return `+${countryCode} (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }

  return phone;
}

// Format phone number for API calls
export function formatPhoneForAPI(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return "+1" + digits;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return "+" + digits;
  }

  return "+" + digits;
}

// Validate phone number
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone) {
    return {
      isValid: false,
      formatted: "",
      error: "Phone number is required",
    };
  }

  const digits = phone.replace(/\D/g, "");

  // Check minimum length
  if (digits.length < 10) {
    return {
      isValid: false,
      formatted: "",
      error: "Phone number must be at least 10 digits",
    };
  }

  // Check maximum length
  if (digits.length > 15) {
    return {
      isValid: false,
      formatted: "",
      error: "Phone number cannot exceed 15 digits",
    };
  }

  // Format the number
  const formatted = formatPhoneForAPI(phone);

  // Basic format validation
  const phoneRegex = /^\+\d{10,15}$/;
  if (!phoneRegex.test(formatted)) {
    return {
      isValid: false,
      formatted: "",
      error: "Invalid phone number format",
    };
  }

  return {
    isValid: true,
    formatted,
  };
}

// Format input as user types
export function formatPhoneInput(
  value: string,
  previousValue: string = "",
): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "");

  // Handle deletion
  if (digits.length < previousValue.replace(/\D/g, "").length) {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  // Handle input
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // For numbers longer than 10 digits, show with country code
  return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
}

// Extract country code from phone number
export function getCountryCode(phone: string): string {
  const formatted = formatPhoneForAPI(phone);
  const digits = formatted.slice(1); // Remove +

  if (digits.length === 10) return "1"; // US
  if (digits.length === 11 && digits.startsWith("1")) return "1"; // US/Canada

  // For other countries, extract based on common patterns
  if (digits.startsWith("44")) return "44"; // UK
  if (digits.startsWith("33")) return "33"; // France
  if (digits.startsWith("49")) return "49"; // Germany
  if (digits.startsWith("81")) return "81"; // Japan
  if (digits.startsWith("86")) return "86"; // China
  if (digits.startsWith("91")) return "91"; // India

  // Default to first 1-3 digits
  if (digits.length > 10) {
    return digits.slice(0, digits.length - 10);
  }

  return "1"; // Default US
}

// Check if phone number is mobile (basic heuristic)
export function isMobileNumber(phone: string): boolean {
  const formatted = formatPhoneForAPI(phone);
  const digits = formatted.slice(1);

  // US mobile patterns (simplified)
  if (digits.length === 11 && digits.startsWith("1")) {
    const areaCode = digits.slice(1, 4);
    // Common mobile area codes (this is a simplified check)
    const mobileAreaCodes = ["310", "323", "424", "213", "818", "747", "661"];
    return mobileAreaCodes.includes(areaCode);
  }

  // For other countries, assume mobile by default
  return true;
}

// Phone number API functions
export const phoneAPI = {
  // Send OTP to phone number
  async sendOTP(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    phoneNumber?: string;
    debugOtp?: string;
  }> {
    const response = await fetch("/api/phone/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });

    return response.json();
  },

  // Verify OTP
  async verifyOTP(
    phoneNumber: string,
    otp: string,
  ): Promise<{
    success: boolean;
    message: string;
    phoneNumber?: string;
  }> {
    const response = await fetch("/api/phone/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });

    return response.json();
  },

  // Check phone availability
  async checkAvailability(phoneNumber: string): Promise<{
    success: boolean;
    phoneAvailable: boolean;
    phoneNumber?: string;
    message?: string;
  }> {
    const response = await fetch(
      `/api/phone/check-availability?phone=${encodeURIComponent(phoneNumber)}`,
    );

    return response.json();
  },

  // Login with phone
  async loginWithPhone(
    phoneNumber: string,
    otp: string,
  ): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    const response = await fetch("/api/phone/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });

    return response.json();
  },

  // Register with phone
  async registerWithPhone(
    phoneNumber: string,
    name: string,
    username?: string,
  ): Promise<{
    success: boolean;
    message: string;
    user?: any;
  }> {
    const response = await fetch("/api/phone/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber, name, username }),
    });

    return response.json();
  },
};
