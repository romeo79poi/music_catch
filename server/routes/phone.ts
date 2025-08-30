import express from "express";

const router = express.Router();

// Mock OTP storage (in production, use Redis or database)
const otpStorage = new Map<
  string,
  {
    otp: string;
    timestamp: number;
    attempts: number;
    verified: boolean;
  }
>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number to consistent format
function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // Add country code if not present
  if (digits.length === 10) {
    return "+1" + digits; // US default
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return "+" + digits;
  }

  return "+" + digits;
}

// Send OTP to phone number
router.post("/send-otp", async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Validate phone number format
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // Check if phone already verified recently
    const existingEntry = otpStorage.get(formattedPhone);
    if (
      existingEntry &&
      existingEntry.verified &&
      Date.now() - existingEntry.timestamp < 300000
    ) {
      // 5 minutes
      return res.status(400).json({
        success: false,
        message: "Phone number already verified recently",
      });
    }

    // Check rate limiting (max 3 attempts per 15 minutes)
    if (
      existingEntry &&
      existingEntry.attempts >= 3 &&
      Date.now() - existingEntry.timestamp < 900000
    ) {
      // 15 minutes
      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please try again later.",
      });
    }

    const otp = generateOTP();

    // Store OTP
    otpStorage.set(formattedPhone, {
      otp,
      timestamp: Date.now(),
      attempts: existingEntry ? existingEntry.attempts + 1 : 1,
      verified: false,
    });

    // In production, integrate with SMS service like Twilio
    console.log(`📱 SMS OTP for ${formattedPhone}: ${otp}`);

    // Simulate SMS delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: "OTP sent successfully",
      phoneNumber: formattedPhone,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const storedData = otpStorage.get(formattedPhone);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No OTP found for this phone number",
      });
    }

    // Check if OTP expired (5 minutes)
    if (Date.now() - storedData.timestamp > 300000) {
      otpStorage.delete(formattedPhone);
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Mark as verified
    otpStorage.set(formattedPhone, {
      ...storedData,
      verified: true,
    });

    res.json({
      success: true,
      message: "Phone number verified successfully",
      phoneNumber: formattedPhone,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
});

// Check if phone number is available
router.get("/check-availability", async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const formattedPhone = formatPhoneNumber(phone as string);

    // In production, check against user database
    // For demo, simulate checking
    const isAvailable = !formattedPhone.includes("555"); // Mock taken numbers

    res.json({
      success: true,
      phoneAvailable: isAvailable,
      phoneNumber: formattedPhone,
    });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check availability",
    });
  }
});

// Login with phone number
router.post("/login", async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Verify OTP first
    const storedData = otpStorage.get(formattedPhone);

    if (!storedData || storedData.otp !== otp || !storedData.verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid or unverified OTP",
      });
    }

    // Check if OTP expired
    if (Date.now() - storedData.timestamp > 300000) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // In production, find user by phone number in database
    // For demo, create mock user data
    const user = {
      id: `phone_${Date.now()}`,
      phoneNumber: formattedPhone,
      name: `User ${formattedPhone.slice(-4)}`,
      provider: "phone",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    // Clear OTP after successful login
    otpStorage.delete(formattedPhone);

    res.json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    console.error("Phone login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// Register with phone number
router.post("/register", async (req, res) => {
  try {
    const { phoneNumber, name, username } = req.body;

    if (!phoneNumber || !name) {
      return res.status(400).json({
        success: false,
        message: "Phone number and name are required",
      });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Check if phone is verified
    const storedData = otpStorage.get(formattedPhone);
    if (!storedData || !storedData.verified) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be verified first",
      });
    }

    // In production, save to database
    const user = {
      id: `phone_${Date.now()}`,
      phoneNumber: formattedPhone,
      name: name.trim(),
      username: username || `user_${Date.now()}`,
      provider: "phone",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    // Clear OTP after successful registration
    otpStorage.delete(formattedPhone);

    res.json({
      success: true,
      message: "Registration successful",
      user,
    });
  } catch (error) {
    console.error("Phone registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

export default router;
