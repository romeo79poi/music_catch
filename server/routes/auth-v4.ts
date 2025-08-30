import { Router } from "express";
import { sendVerificationEmail } from "../lib/email";
import { otpStore } from "./auth-hybrid-otp";

const router = Router();

// Helpers
const normalizeEmail = (e: string) =>
  String(e || "")
    .trim()
    .toLowerCase();
const normalizeCode = (c: string) => String(c || "").trim();
const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/v4/auth/verification/email/verify-token
// Note: Token-based verification not enabled; instruct to use code
router.post("/verification/email/verify-token", async (req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Verification link is invalid or expired. Please verify using the 6-digit code sent to your email.",
  });
});

// POST /api/v4/auth/verification/email/verify-code { email, code }
router.post("/verification/email/verify-code", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = normalizeCode(req.body?.code);

    if (!email || !code) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Email and verification code are required",
        });
    }

    const stored = otpStore.get(email);
    if (!stored) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "No verification code found for this email. Please request a new code.",
        });
    }

    if (new Date() > stored.expiresAt) {
      otpStore.delete(email);
      return res
        .status(400)
        .json({
          success: false,
          message: "Verification code has expired. Please request a new code.",
        });
    }

    if (stored.code !== code) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    otpStore.delete(email);
    return res.json({ success: true, message: "Email verified successfully" });
  } catch (err: any) {
    return res
      .status(500)
      .json({
        success: false,
        message: err?.message || "Internal server error",
      });
  }
});

// POST /api/v4/auth/verification/email/resend { email }
router.post("/verification/email/resend", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    otpStore.set(email, { code, email, expiresAt, userData: { email } });

    const sent = await sendVerificationEmail(email, code);
    if (!sent.success) {
      return res
        .status(500)
        .json({
          success: false,
          message: sent.error || "Failed to send verification email",
        });
    }

    return res.json({ success: true, message: "Verification email resent" });
  } catch (err: any) {
    return res
      .status(500)
      .json({
        success: false,
        message: err?.message || "Internal server error",
      });
  }
});

// Password reset endpoints are not enabled; respond with clear message
router.post("/password/validate-reset-token", async (_req, res) => {
  return res.status(400).json({
    success: false,
    message:
      "Password reset via token is not enabled. Please use login or contact support.",
  });
});

router.post("/password/reset-with-token", async (_req, res) => {
  return res.status(400).json({
    success: false,
    message: "Password reset via token is not enabled.",
  });
});

export default router;
