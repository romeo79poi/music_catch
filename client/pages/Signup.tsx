import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  User,
  Lock,
  Phone,
  RefreshCw,
} from "lucide-react";
import { MusicCatchLogo } from "../components/MusicCatchLogo";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";
import AvailabilityChecker from "../components/AvailabilityChecker";
import { useToast } from "../hooks/use-toast";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  validatePhoneNumber,
  formatPhoneInput,
  formatPhoneDisplay,
  phoneAPI,
} from "../lib/phone";
// Removed Firebase imports - using backend auth now

type SignupStep =
  | "method"
  | "email"
  | "email-verify"
  | "phone"
  | "phone-verify"
  | "profile"
  | "verification"
  | "password"
  | "dob"
  | "profileImage"
  | "gender"
  | "bio";
type SignupMethod = "email" | "phone";

interface FormData {
  email: string;
  phone: string;
  username: string;
  name: string;
  password: string;
  confirmPassword: string;
  otp: string;
  dateOfBirth: string;
  profileImage: File | null;
  profileImageURL: string;
  gender: string;
  bio: string;
}

interface ValidationErrors {
  email?: string;
  phone?: string;
  username?: string;
  name?: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
  dateOfBirth?: string;
  profileImage?: string;
  gender?: string;
  bio?: string;
}

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<SignupStep>("method");
  const [signupMethod, setSignupMethod] = useState<SignupMethod>("email");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    phone: "",
    username: "",
    name: "",
    password: "",
    confirmPassword: "",
    otp: "",
    dateOfBirth: "",
    profileImage: null,
    profileImageURL: "",
    gender: "",
    bio: "",
  });

  // Pre-fill email if redirected from login
  useEffect(() => {
    const state = location.state as { email?: string };
    if (state?.email) {
      setFormData((prev) => ({ ...prev, email: state.email }));
      setSignupMethod("email");
      setCurrentStep("email");
      toast({
        title: "Account not found",
        description: `Please sign up with ${state.email}`,
        variant: "default",
      });
    }
  }, [location.state, toast]);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [availability, setAvailability] = useState<{
    email?: boolean;
    phone?: boolean;
    username?: boolean;
  }>({});
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [useFirebaseAuth, setUseFirebaseAuth] = useState(true); // Use Firebase
  const [verificationUser, setVerificationUser] = useState<any>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [isSocialSignup, setIsSocialSignup] = useState(false);
  const [tempEmailUser, setTempEmailUser] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false); // Start as false
  const requireEmailVerification = true; // Always require verification for email signups

  // Only skip email-verify step for social signups or when explicitly verified
  useEffect(() => {
    if (isSocialSignup && emailVerified && currentStep === "email-verify") {
      setCurrentStep("profile");
    }
  }, [emailVerified, currentStep, isSocialSignup]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return false;
    }

    // Check for @ symbol
    if (!email.includes("@")) {
      setErrors((prev) => ({ ...prev, email: "Email must contain @" }));
      return false;
    }

    // Check for .com
    if (!email.includes(".com")) {
      setErrors((prev) => ({ ...prev, email: "Email must contain .com" }));
      return false;
    }

    // Full email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.com$/;
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({
        ...prev,
        email: "Invalid email format (must end with .com)",
      }));
      return false;
    }

    setErrors((prev) => ({ ...prev, email: undefined }));
    return true;
  };

  const validatePhone = (phone: string): boolean => {
    const result = validatePhoneNumber(phone);
    if (!result.isValid) {
      setErrors((prev) => ({ ...prev, phone: result.error }));
      return false;
    }
    setErrors((prev) => ({ ...prev, phone: undefined }));
    return true;
  };

  const validateOTP = (otp: string): boolean => {
    if (!otp) {
      setErrors((prev) => ({ ...prev, otp: "Verification code is required" }));
      return false;
    }
    if (otp.length !== 6) {
      setErrors((prev) => ({
        ...prev,
        otp: "Verification code must be 6 digits",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, otp: undefined }));
    return true;
  };

  const validateProfile = (): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain lowercase letters, numbers, and underscores";
      isValid = false;
    }

    if (availability.username === false) {
      newErrors.username = "Username is already taken";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validatePassword = (): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors = {};

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 12) {
      newErrors.password =
        "Password must be at least 12 characters for stronger security";
      isValid = false;
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
      isValid = false;
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
      isValid = false;
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
      isValid = false;
    } else if (
      !/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)
    ) {
      newErrors.password =
        "Password must contain at least one special character (!@#$%^&*...)";
      isValid = false;
    } else if (/(.)\1{2,}/.test(formData.password)) {
      newErrors.password =
        "Password cannot contain three or more consecutive identical characters";
      isValid = false;
    } else if (/password|123456|qwerty|admin|user/i.test(formData.password)) {
      newErrors.password =
        "Password cannot contain common words like 'password', '123456', etc.";
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateDateOfBirth = (): boolean => {
    if (!formData.dateOfBirth) {
      setErrors((prev) => ({
        ...prev,
        dateOfBirth: "Date of birth is required",
      }));
      return false;
    }

    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // More precise age calculation
    let actualAge = age;
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      actualAge--;
    }

    if (actualAge < 18) {
      setErrors((prev) => ({
        ...prev,
        dateOfBirth: "You must be at least 18 years old to register",
      }));
      return false;
    }

    if (actualAge > 120) {
      setErrors((prev) => ({
        ...prev,
        dateOfBirth: "Please enter a valid date of birth",
      }));
      return false;
    }

    setErrors((prev) => ({ ...prev, dateOfBirth: undefined }));
    return true;
  };

  const validateGender = (): boolean => {
    if (!formData.gender) {
      setErrors((prev) => ({ ...prev, gender: "Please select your gender" }));
      return false;
    }
    setErrors((prev) => ({ ...prev, gender: undefined }));
    return true;
  };

  const validateBio = (): boolean => {
    if (formData.bio.length > 500) {
      setErrors((prev) => ({
        ...prev,
        bio: "Bio must be less than 500 characters",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, bio: undefined }));
    return true;
  };

  // Check availability using the backend API
  const checkAvailability = async (email?: string, username?: string) => {
    try {
      const result = await authCheckAvailability(email, username);

      if (email) {
        setAvailability((prev) => ({
          ...prev,
          email: result.available,
        }));
      }

      if (username) {
        setAvailability((prev) => ({
          ...prev,
          username: result.available,
        }));
      }

      return result;
    } catch (error: any) {
      console.error("Availability check failed:", error);
      return { available: false, message: "Unable to check availability" };
    }
  };

  // Send OTP to phone
  const sendOTP = async () => {
    if (!validatePhone(formData.phone)) return;

    setIsLoading(true);
    try {
      if (useFirebaseAuth) {
        // Initialize reCAPTCHA if not already done
        const recaptchaResult = await initializeRecaptcha(
          "recaptcha-container",
        );
        if (!recaptchaResult.success) {
          toast({
            title: "Setup error",
            description: "Please refresh the page and try again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Format phone number for Firebase (must include country code)
        let formattedPhone = formData.phone.replace(/\D/g, "");
        if (!formattedPhone.startsWith("1") && formattedPhone.length === 10) {
          formattedPhone = "+1" + formattedPhone;
        } else if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+" + formattedPhone;
        }

        // Send Firebase OTP
        const result = await sendPhoneOTP(formattedPhone);

        if (result.success && result.confirmationResult) {
          setConfirmationResult(result.confirmationResult);
          setOtpSent(true);
          setPhoneVerificationSent(true);
          setResendTimer(60);
          toast({
            title: "Verification code sent!",
            description: `We sent a 6-digit code to ${formatPhoneDisplay(formData.phone)}`,
          });
        } else {
          toast({
            title: "Failed to send code",
            description: result.error || "Please try again",
            variant: "destructive",
          });
        }
      } else {
        // Use backend OTP
        const result = await phoneAPI.sendOTP(formData.phone);

        if (result.success) {
          setOtpSent(true);
          setResendTimer(60);
          toast({
            title: "Verification code sent!",
            description: `We sent a 6-digit code to ${formatPhoneDisplay(formData.phone)}`,
          });
        } else {
          toast({
            title: "Failed to send code",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      toast({
        title: "Failed to send code",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP with enhanced error handling
  const verifyOTP = async () => {
    if (!validateOTP(formData.otp)) return;

    setIsLoading(true);
    try {
      if (useFirebaseAuth && confirmationResult) {
        // Use Firebase verification
        const result = await verifyPhoneOTP(confirmationResult, formData.otp);

        if (result.success) {
          setPhoneVerified(true);
          setPhoneVerificationSent(false); // Reset verification sent status

          toast({
            title: "Phone verified successfully! ✅",
            description: "Your phone number has been verified.",
          });

          if (signupMethod === "phone") {
            // For phone signup with Firebase, the user is already created
            // Store the verified user
            if (result.user) {
              setVerificationUser(result.user);
            }

            toast({
              title: "Account created successfully! 🎉",
              description: "Welcome to Music Catch!",
            });

            setTimeout(() => {
              navigate("/home");
            }, 2000);
          } else {
            // For email signup, proceed to next step
            setCurrentStep("profile");
          }
        } else {
          setErrors((prev) => ({
            ...prev,
            otp: result.error || "Invalid verification code. Please try again.",
          }));

          toast({
            title: "Verification failed",
            description: result.error || "Invalid verification code",
            variant: "destructive",
          });
        }
      } else {
        // Use backend verification
        const result = await phoneAPI.verifyOTP(formData.phone, formData.otp);

        if (result.success) {
          setPhoneVerified(true);
          toast({
            title: "Phone verified!",
            description: "Your phone number has been successfully verified.",
          });

          if (signupMethod === "phone") {
            setCurrentStep("profile");
          }
        } else {
          setErrors((prev) => ({ ...prev, otp: result.message }));
        }
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setErrors((prev) => ({
        ...prev,
        otp: "Verification failed. Please try again.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const {
    signInWithGoogle,
    signInWithFacebook,
    signUp,
    requestSignupOTP,
    verifySignupOTP,
    createUserAccount,
    checkAvailability: authCheckAvailability,
  } = useAuth();

  // Google signup handler with Firebase
  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    setErrorAlert(null);

    try {
      console.log("🔥 Attempting Google OAuth sign-in...");

      // Use real Google OAuth
      const { oauthService } = await import("../lib/oauth-service");

      const oauthResult = await oauthService.signInWithGoogleIdToken();

      if (!oauthResult.success || !oauthResult.idToken) {
        throw new Error(oauthResult.error || "Google sign-in failed");
      }

      const result = await signInWithGoogle(oauthResult.idToken);

      if (result.success) {
        toast({
          title: "Welcome to CATCH! 🎉",
          description: "Google signup successful! Redirecting to home...",
        });

        setTimeout(() => {
          navigate("/home");
        }, 1500);
      } else {
        setErrorAlert(result.message);
        toast({
          title: "Google signup failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Google sign-in error:", error);
      setErrorAlert(error.message || "Google sign-in failed");
      toast({
        title: "Google sign-in error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Facebook signup handler with Firebase
  const handleFacebookSignup = async () => {
    setIsFacebookLoading(true);
    setErrorAlert(null);

    try {
      console.log("🔥 Attempting Facebook OAuth sign-in...");

      // Use real Facebook OAuth
      const { oauthService } = await import("../lib/oauth-service");

      const oauthResult = await oauthService.signInWithFacebook();

      if (!oauthResult.success || !oauthResult.token) {
        throw new Error(oauthResult.error || "Facebook sign-in failed");
      }

      const result = await signInWithFacebook(oauthResult.token);

      if (result.success && result.user) {
        console.log("✅ Firebase Facebook sign-in successful:", result.user);

        // Store the user data from Facebook
        setFormData((prev) => ({
          ...prev,
          email: result.user.email || "",
          name: result.user.displayName || "",
          profileImageURL: result.user.photoURL || "",
        }));

        // Store the authenticated user
        setVerificationUser(result.user);
        setIsSocialSignup(true);

        toast({
          title: "Welcome to CATCH! ��",
          description: `Please complete your profile setup`,
        });

        // Redirect to profile step to collect username, then DOB, gender, bio
        setCurrentStep("profile");
      } else {
        setErrorAlert(result.error || "Facebook sign-in failed");
        toast({
          title: "Facebook sign-in failed",
          description: result.error || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("❌ Facebook sign-in error:", error);
      setErrorAlert(error.message || "Facebook sign-in failed");
      toast({
        title: "Facebook sign-in error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsFacebookLoading(false);
    }
  };

  // Step handlers
  const handleMethodStep = (method: SignupMethod) => {
    setSignupMethod(method);
    setErrorAlert(null); // Clear any errors when switching methods
    setIsLoading(false); // Reset loading state
    setIsGoogleLoading(false); // Reset Google loading state
    setIsFacebookLoading(false); // Reset Facebook loading state

    if (method === "email") {
      setCurrentStep("email");
    } else {
      setCurrentStep("phone");
    }
  };

  const handleEmailStep = async () => {
    if (!validateEmail(formData.email)) return;

    setIsLoading(true);

    try {
      // Check if email is available first
      const availabilityResult = await checkAvailability(formData.email);

      if (!availabilityResult.available) {
        setErrors({ email: "Email is already taken or unavailable" });
        toast({
          title: "Email unavailable",
          description:
            "This email is already in use. Please try another or login instead.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Store email and proceed to verification
      toast({
        title: "Sending verification code...",
        description: `Please wait while we send a code to ${formData.email}`,
      });

      // Request OTP verification (no account creation yet)
      const otpResult = await requestSignupOTP(
        formData.email,
        "temp_password_123",
        formData.name || "User",
        formData.username || "temp_username",
      );

      if (otpResult.success) {
        if (otpResult.skipOTP) {
          // Direct registration completed, skip OTP verification
          setEmailVerified(true);
          toast({
            title: "Account created successfully! ✅",
            description:
              "Your account has been created. Let's complete your profile.",
          });
          setCurrentStep("profile");
        } else {
          setEmailVerificationSent(true);
          setResendTimer(60);
          toast({
            title: "Verification code sent! 📧",
            description: `We sent a 6-digit code to ${formData.email}. Please check your email.`,
          });
          setCurrentStep("email-verify");
        }
      } else {
        setErrorAlert(otpResult.message || "Failed to send verification code");
        toast({
          title: "Failed to send code",
          description: otpResult.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Email step error:", error);
      setErrorAlert(error.message || "Failed to continue with email");
      toast({
        title: "Email step failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneStep = async () => {
    if (!validatePhone(formData.phone)) return;

    setIsLoading(true);
    await checkAvailability("phone", formData.phone);
    setIsLoading(false);

    if (availability.phone !== false) {
      setCurrentStep("phone-verify");
      await sendOTP();
    }
  };

  const handleProfileStep = async () => {
    if (!validateProfile()) return;

    // Check if email is verified for email signups
    if (signupMethod === "email" && !emailVerified) {
      setErrorAlert("Please verify your email address before continuing.");
      toast({
        title: "Email verification required",
        description: "Please verify your email before completing your profile",
        variant: "destructive",
      });
      setCurrentStep("email-verify");
      return;
    }

    setIsLoading(true);

    try {
      // Final availability check before proceeding
      const availabilityResult = await checkAvailability(
        undefined,
        formData.username,
      );

      if (!availabilityResult.available) {
        setErrors({
          username: "Username is already taken. Please choose another.",
        });
        toast({
          title: "Username unavailable",
          description: "Please choose a different username",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if user already exists with this email
      if (signupMethod === "email") {
        const emailCheck = await checkAvailability(formData.email, undefined);
        if (!emailCheck.available) {
          setErrorAlert(
            "An account with this email already exists. Please login instead.",
          );
          toast({
            title: "Account already exists",
            description: "Please login with your existing account",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Success - proceed to next step
      toast({
        title: "Profile validated! ✅",
        description: "Username is available and profile looks good.",
      });

      if (isSocialSignup) {
        // For social signups, proceed to DOB step (skip password)
        setCurrentStep("dob");
      } else if (signupMethod === "phone") {
        // Complete phone signup
        await handlePasswordStep();
      } else {
        setCurrentStep("password");
      }
    } catch (error: any) {
      console.error("Profile step validation error:", error);
      setErrorAlert("Failed to validate profile. Please try again.");
      toast({
        title: "Validation failed",
        description: "Please check your information and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationStep = async () => {
    // Skip verification for Supabase - go directly to profile
    setCurrentStep("profile");
  };

  const handleEmailVerifyStep = async () => {
    if (!validateOTP(formData.otp)) return;

    setIsLoading(true);

    try {
      // Verify OTP using the enhanced auth context
      const verificationResult = await verifySignupOTP(
        formData.email,
        formData.otp,
      );

      if (verificationResult.success) {
        setEmailVerified(true);
        setEmailVerificationSent(false);

        toast({
          title: "Account created successfully! 🎉",
          description:
            "Welcome to Music Catch! Your account has been created with secure JWT authentication.",
        });

        // Clear OTP field
        setFormData((prev) => ({ ...prev, otp: "" }));

        // Account is already created, redirect to home
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      } else {
        setErrors((prev) => ({
          ...prev,
          otp:
            verificationResult.message ||
            "Invalid verification code. Please try again.",
        }));

        toast({
          title: "Verification failed",
          description:
            verificationResult.message ||
            "Invalid verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Email OTP verification error:", error);
      setErrors((prev) => ({
        ...prev,
        otp: "Verification failed. Please try again.",
      }));

      toast({
        title: "Verification failed",
        description: "Please check your code and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerifyStep = async () => {
    await verifyOTP();
  };

  const handlePasswordStep = async () => {
    if (!validatePassword()) return;

    if (signupMethod === "email") {
      // Check email verification status
      if (!emailVerified) {
        setErrorAlert("Email verification required.");
        setCurrentStep("email-verify");
        return;
      }
      // For email signup, proceed to DOB step
      setCurrentStep("dob");
      return;
    }

    setIsLoading(true);

    try {
      if (signupMethod === "phone") {
        // Keep existing phone registration logic
        const response = await fetch("/api/phone/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: formData.phone,
            name: formData.name,
            username: formData.username,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast({
            title: "Account created successfully! �����",
            description: `Welcome to Music Catch, ${data.user.name}!`,
          });

          setTimeout(() => {
            navigate("/home");
          }, 2000);
        } else {
          toast({
            title: "Registration failed",
            description: data.message || "Please try again",
            variant: "destructive",
          });
        }
      } else {
        // Clear any previous errors
        setErrorAlert(null);

        try {
          // For email signups that went through OTP verification, create account now
          // For other signups, use different flows
          const isEmailSignupVerified =
            signupMethod === "email" && emailVerified;

          if (isEmailSignupVerified) {
            // Create account with real user data for verified email signups
            const result = await createUserAccount(
              formData.email,
              formData.password,
              formData.name,
              formData.username,
              {
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                bio: formData.bio,
                profileImageURL: formData.profileImageURL,
              },
            );

            if (result.success) {
              // Account created successfully
              toast({
                title: "Account Created! 🎉",
                description: `Welcome to Music Catch, ${formData.name}! Your account has been created successfully.`,
              });

              console.log(
                "✅ User created with secure JWT + bcrypt authentication",
              );

              // Redirect to home page after successful signup
              setTimeout(() => {
                navigate("/home");
              }, 1500);
            } else {
              setErrorAlert(
                result.message || "Registration failed. Please try again.",
              );
            }
          } else if (false) {
            // Disabled OTP option
            // Use OTP verification signup
            const result = await requestSignupOTP(
              formData.email,
              formData.password,
              formData.name,
              formData.username,
            );

            if (result.success) {
              toast({
                title: "Verification Code Sent! 📧",
                description:
                  "Please check your email and enter the verification code.",
              });

              // Move to OTP verification step
              setCurrentStep("email-verify");
            } else {
              setErrorAlert(result.message);
            }
          } else {
            // Fallback for other signup methods (not currently used)
            setErrorAlert("Please complete email verification first.");
          }
        } catch (error: any) {
          console.error("Registration error:", error);
          setErrorAlert(error.message || "Network error. Please try again.");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorAlert("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDOBStep = () => {
    if (!validateDateOfBirth()) return;

    // Check email verification for email signups (only if required)
    if (
      signupMethod === "email" &&
      requireEmailVerification &&
      !emailVerified
    ) {
      setErrorAlert("Email verification required.");
      setCurrentStep("email-verify");
      return;
    }

    // Skip profile image during signup - we'll ask for it on home page
    setCurrentStep("gender");
  };

  const handleProfileImageStep = async () => {
    // Check email verification for email signups (only if required)
    if (
      signupMethod === "email" &&
      requireEmailVerification &&
      !emailVerified
    ) {
      setErrorAlert("Email verification required.");
      setCurrentStep("email-verify");
      return;
    }

    setIsLoading(true);

    try {
      // If user selected an image, store it temporarily for preview
      if (formData.profileImage) {
        const imageURL = URL.createObjectURL(formData.profileImage);
        setFormData((prev) => ({ ...prev, profileImageURL: imageURL }));
      }

      // Create the account now with all collected data
      const result = await createUserAccount(
        formData.email,
        formData.password,
        formData.name,
        formData.username,
        {
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          bio: formData.bio,
          profileImageURL: formData.profileImageURL,
        },
      );

      if (result.success) {
        toast({
          title: "Account Created! 🎉",
          description: `Welcome to Music Catch, ${formData.name}! Your account has been created successfully.`,
        });
        setTimeout(() => {
          navigate("/home");
        }, 1200);
      } else {
        setErrorAlert(
          result.message || "Registration failed. Please try again.",
        );
      }
    } catch (error) {
      console.error("Profile image step error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenderStep = () => {
    if (!validateGender()) return;

    // Check email verification for email signups (only if required)
    if (
      signupMethod === "email" &&
      requireEmailVerification &&
      !emailVerified
    ) {
      setErrorAlert("Email verification required.");
      setCurrentStep("email-verify");
      return;
    }

    setCurrentStep("bio");
  };

  const handleBioStep = async () => {
    if (!validateBio()) return;

    setCurrentStep("profileImage");
    return;

    setIsLoading(true);

    try {
      // Clear any previous errors
      setErrorAlert(null);

      if (isSocialSignup && verificationUser) {
        // For social signups, save the additional profile data
        const completeUserData = {
          uid: verificationUser.uid,
          email: formData.email,
          name: formData.name,
          username: formData.username,
          profileImageURL: formData.profileImageURL,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          bio: formData.bio,
        };

        // Save user data to localStorage for immediate access
        localStorage.setItem("currentUser", JSON.stringify(completeUserData));
        localStorage.setItem("userAvatar", formData.profileImageURL || "");

        console.log("�� Saved social signup profile data:", completeUserData);

        toast({
          title: "Profile completed successfully! 🎉",
          description: `Welcome to Music Catch, ${formData.name}! Let's add your profile picture next.`,
        });

        // Sync with backend API to create user in backend store
        try {
          const backendSyncResponse = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: verificationUser.uid,
              email: formData.email,
              name: formData.name,
              username: formData.username,
              password:
                "social_signup_temp_password_" + Math.random().toString(36),
              dateOfBirth: formData.dateOfBirth,
              gender: formData.gender,
              bio: formData.bio,
              profileImageURL: formData.profileImageURL,
              provider: "social",
              socialSignup: true,
            }),
          });

          if (backendSyncResponse.ok) {
            try {
              const backendResult = await backendSyncResponse.json();
              console.log(
                "✅ Social signup data synced with backend:",
                backendResult,
              );
            } catch (parseError) {
              console.warn(
                "⚠️ Failed to parse backend sync response, but sync appeared successful",
              );
            }
          } else {
            // Read the error response safely
            try {
              const responseClone = backendSyncResponse.clone();
              const errorText = await responseClone.text();
              console.warn(
                `⚠️ Backend sync failed (${backendSyncResponse.status}): ${errorText}`,
              );
            } catch (readError) {
              console.warn(
                `⚠️ Backend sync failed (${backendSyncResponse.status}), continuing with Firebase-only data`,
              );
            }
          }
        } catch (backendError) {
          console.warn(
            "⚠️ Backend sync error for social signup:",
            backendError,
          );
        }

        setTimeout(() => {
          navigate("/home?showProfileImagePrompt=true");
        }, 2000);
      } else {
        // For email signup, use the already verified user
        if (!tempEmailUser || !emailVerified) {
          setErrorAlert(
            "Email verification required. Please verify your email first.",
          );
          setCurrentStep("email-verify");
          return;
        }

        // Update the verified user with complete profile data
        const result = { success: true, user: tempEmailUser };

        if (result.success && result.user) {
          // Update the verified user's display name and profile
          try {
            await result.user.updateProfile({
              displayName: formData.name,
              photoURL: formData.profileImageURL || null,
            });
            console.log("✅ Updated Firebase user profile");
          } catch (updateError) {
            console.warn("⚠️ Failed to update Firebase profile:", updateError);
          }

          // Save complete profile data to Firestore
          const additionalProfileData = {
            username: formData.username,
            name: formData.name,
            dob: formData.dateOfBirth,
            gender: formData.gender,
            bio: formData.bio,
            profileImage: formData.profileImageURL,
          };

          console.log(
            "💾 Saving complete profile data:",
            additionalProfileData,
          );

          const saveResult = await saveUserData(
            result.user,
            additionalProfileData,
          );

          if (saveResult.success) {
            console.log("✅ Complete profile data saved to Firestore");
          } else {
            console.warn(
              "⚠��� Failed to save complete profile data:",
              saveResult.error,
            );
          }

          // Save complete user data to localStorage for immediate access
          const completeUserData = {
            uid: result.user.uid,
            email: formData.email,
            name: formData.name,
            username: formData.username,
            profileImageURL: formData.profileImageURL,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            bio: formData.bio,
            phone: formData.phone,
            emailVerified: result.user.emailVerified,
          };

          localStorage.setItem("currentUser", JSON.stringify(completeUserData));
          localStorage.setItem("userAvatar", formData.profileImageURL || "");

          console.log(
            "💾 Saved complete user data to localStorage:",
            completeUserData,
          );

          // Try to sync with backend API if available
          try {
            const backendSyncResponse = await fetch("/api/auth/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: result.user.uid,
                email: formData.email,
                name: formData.name,
                username: formData.username,
                password: formData.password,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                bio: formData.bio,
                profileImageURL: formData.profileImageURL,
                phone: formData.phone,
                emailVerified: result.user.emailVerified,
              }),
            });

            if (backendSyncResponse.ok) {
              try {
                const backendResult = await backendSyncResponse.json();
                console.log("✅ User data synced with backend:", backendResult);
              } catch (parseError) {
                console.warn(
                  "⚠️ Failed to parse backend sync response, but sync appeared successful",
                );
              }
            } else {
              // Read the error response safely
              try {
                const responseClone = backendSyncResponse.clone();
                const errorText = await responseClone.text();
                console.warn(
                  `⚠️ Backend sync failed (${backendSyncResponse.status}): ${errorText}`,
                );
              } catch (readError) {
                console.warn(
                  `⚠️ Backend sync failed (${backendSyncResponse.status}), continuing with Firebase-only data`,
                );
              }
            }
          } catch (backendError) {
            console.warn(
              "⚠️ Backend sync error (continuing with Firebase):",
              backendError,
            );
          }

          // Send Firebase email verification notification
          setEmailVerificationSent(true);
          setVerificationUser(result.user);

          toast({
            title: "Account created successfully! 🎉",
            description:
              "Welcome to Music Catch! Let's add your profile picture next.",
          });

          setTimeout(() => {
            navigate("/home?showProfileImagePrompt=true");
          }, 2000);
        } else {
          setErrorAlert(result.message);
          toast({
            title: "Registration failed",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrorAlert("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep === "email") {
      setCurrentStep("method");
    } else if (currentStep === "email-verify") {
      setCurrentStep("email");
    } else if (currentStep === "phone") {
      setCurrentStep("method");
    } else if (currentStep === "phone-verify") {
      setCurrentStep("phone");
    } else if (currentStep === "profile") {
      if (signupMethod === "email") {
        setCurrentStep("email-verify");
      } else {
        setCurrentStep("phone-verify");
      }
    } else if (currentStep === "password") {
      setCurrentStep("profile");
    } else if (currentStep === "dob") {
      setCurrentStep("password");
    } else if (currentStep === "gender") {
      setCurrentStep("dob");
    } else if (currentStep === "bio") {
      setCurrentStep("gender");
    } else if (currentStep === "profileImage") {
      setCurrentStep("bio");
    }
  };

  // Resend email OTP verification
  const handleResendEmailVerification = async () => {
    if (resendTimer > 0) return;

    if (!formData.email) {
      toast({
        title: "Error",
        description: "No email address found to send verification to",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Resend OTP verification (no account creation)
      const otpResult = await requestSignupOTP(
        formData.email,
        "temp_password_123",
        formData.name || "User",
        formData.username || "temp_username",
      );

      if (otpResult.success) {
        toast({
          title: "Verification code resent! 📧",
          description: "Please check your email for the new 6-digit code.",
        });
        setResendTimer(60);
        setEmailVerificationSent(true);
      } else {
        toast({
          title: "Failed to resend code",
          description: otpResult.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Resend email OTP error:", error);
      toast({
        title: "Error",
        description: "Failed to resend verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/send-email-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Verification code resent!",
          description:
            "Please check your email for the new 6-digit verification code.",
        });

        setResendTimer(60);
      } else {
        toast({
          title: "Failed to resend code",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast({
        title: "Network error",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Timer for resend functionality
  // Check Firebase connection on mount
  useEffect(() => {
    // Using new backend authentication instead of Firebase
    console.log("✅ Backend authentication ready");
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const stepTitles = {
    method: "Choose signup method",
    email: "What's your email?",
    "email-verify": "Verify your email",
    phone: "What's your phone number?",
    "phone-verify": "Verify your phone",
    profile: "Tell us about yourself",
    verification: "Verify your email",
    password: "Create your password",
    dob: "When were you born?",
    profileImage: "Add your profile picture",
    gender: "What's your gender?",
    bio: "Tell us more about yourself",
  };

  const stepDescriptions = {
    method: "Sign up with email, phone, or social media",
    email: "We'll send you a 6-digit verification code",
    "email-verify": "Enter the 6-digit code sent to your email address",
    phone: "We'll send you a verification code",
    "phone-verify": "Enter the 6-digit code we sent to your phone",
    profile: "Help others find you on Music Catch",
    verification: "Check your email and enter the verification code",
    password:
      "Create a strong password (12+ chars, uppercase, lowercase, number, special char)",
    dob: "You must be 18 or older to register",
    profileImage: "Click the circle to upload your profile picture (optional)",
    gender: "Help us personalize your experience",
    bio: "Share something interesting about yourself (optional)",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark flex flex-col items-center py-4 sm:py-8 px-3 sm:px-6 relative overflow-auto">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-primary/10 via-purple-secondary/5 to-purple-accent/8"></div>

      {/* reCAPTCHA container for Firebase phone auth */}
      <div id="recaptcha-container" className="hidden"></div>

      <div className="relative z-10 w-full max-w-md px-2 sm:px-0 flex-1 flex flex-col justify-center min-h-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-4 sm:mb-6"
        >
          <div className="flex justify-center mb-1 sm:mb-2">
            <MusicCatchLogo
              animated={true}
              signupMode={true}
              className="scale-90 sm:scale-100"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            Sign up to
          </h1>
          <h2 className="text-2xl sm:text-3xl font-bold purple-gradient-text">
            CATCH
          </h2>
        </motion.div>

        {/* Social Signup Buttons - Only visible on method step */}
        {currentStep === "method" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mb-6 space-y-3"
          >
            <button
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isFacebookLoading}
              className="w-full h-12 sm:h-14 bg-purple-dark/50 hover:bg-purple-dark/70 rounded-xl flex items-center justify-center text-white font-medium transition-all duration-200 border border-purple-primary/30 hover:border-purple-primary/50 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-primary/20"
            >
              {isGoogleLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting to Google...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <button
              onClick={handleFacebookSignup}
              disabled={isGoogleLoading || isFacebookLoading}
              className="w-full h-12 sm:h-14 bg-purple-dark/50 hover:bg-purple-dark/70 rounded-xl flex items-center justify-center text-white font-medium transition-all duration-200 border border-purple-secondary/30 hover:border-purple-secondary/50 disabled:opacity-50 hover:shadow-lg hover:shadow-purple-secondary/20"
            >
              {isFacebookLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Connecting to Facebook...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-3"
                    viewBox="0 0 24 24"
                    fill="#1877F2"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Continue with Facebook
                </>
              )}
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Method Selection Step */}
          {currentStep === "method" && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6" />

              {/* Divider */}
              <div className="flex items-center my-4">
                <div className="flex-1 h-px bg-slate-600"></div>
                <span className="px-3 text-slate-400 text-xs sm:text-sm">
                  or
                </span>
                <div className="flex-1 h-px bg-slate-600"></div>
              </div>

              {/* Loading State Reset */}
              {(isGoogleLoading || isFacebookLoading) && (
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 text-yellow-500 mr-3 animate-spin" />
                      <div>
                        <p className="text-yellow-500 text-sm font-medium">
                          {isGoogleLoading ? "Google" : "Facebook"} sign-in in
                          progress...
                        </p>
                        <p className="text-yellow-400 text-xs">
                          If this takes too long, try the reset button
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsGoogleLoading(false);
                        setIsFacebookLoading(false);
                        setErrorAlert(
                          "Social sign-in cancelled. Please try again or use email signup.",
                        );
                      }}
                      className="text-yellow-500 hover:text-yellow-400 text-xs bg-yellow-500/20 px-2 py-1 rounded"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorAlert && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                      <p className="text-red-500 text-sm font-medium">
                        {errorAlert}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMethodStep("email")}
                        className="text-red-500 hover:text-red-400 text-xs bg-red-500/20 px-2 py-1 rounded"
                      >
                        Use Email
                      </button>
                      <button
                        onClick={() => setErrorAlert(null)}
                        className="text-red-500 hover:text-red-400 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Method Selection Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleMethodStep("email")}
                  className="w-full h-12 sm:h-14 bg-purple-dark/50 border border-purple-primary/30 rounded-xl flex items-center justify-center text-white hover:bg-purple-primary/10 hover:border-purple-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-primary/20"
                >
                  <Mail className="w-5 h-5 mr-3 text-purple-primary" />
                  Continue with Email
                </button>

                <button
                  onClick={() => handleMethodStep("phone")}
                  className="w-full h-12 sm:h-14 bg-purple-dark/50 border border-purple-secondary/30 rounded-xl flex items-center justify-center text-white hover:bg-purple-secondary/10 hover:border-purple-secondary/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-secondary/20"
                >
                  <Phone className="w-5 h-5 mr-3 text-purple-secondary" />
                  Continue with Phone Number
                </button>
              </div>
            </motion.div>
          )}

          {/* Email Step */}
          {currentStep === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-purple-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles.email}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions.email}
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="your@email.com"
                  className="w-full h-12 sm:h-14 bg-purple-dark/30 border border-purple-primary/30 rounded-xl px-3 sm:px-4 text-white placeholder-slate-400 focus:outline-none focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20 transition-all duration-200 text-sm sm:text-base backdrop-blur-sm"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                onClick={handleEmailStep}
                disabled={isLoading || !formData.email}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-sm sm:text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-purple-primary/30 hover:shadow-purple-secondary/40"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Continue"
                )}
              </button>

              <button
                onClick={() => setCurrentStep("method")}
                className="w-full text-purple-primary hover:text-purple-secondary transition-colors text-sm mt-4"
              >
                ← Back to other options
              </button>
            </motion.div>
          )}

          {/* Phone Step */}
          {currentStep === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-purple-secondary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles.phone}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions.phone}
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneInput(
                      e.target.value,
                      formData.phone,
                    );
                    setFormData((prev) => ({ ...prev, phone: formatted }));
                  }}
                  placeholder="(555) 123-4567"
                  className="w-full h-12 sm:h-14 bg-slate-800/50 border border-slate-600 rounded-lg px-3 sm:px-4 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green transition-colors text-sm sm:text-base"
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <button
                onClick={handlePhoneStep}
                disabled={isLoading || !formData.phone}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-neon-green to-neon-blue hover:from-neon-green/80 hover:to-neon-blue/80 text-black font-bold text-sm sm:text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Send Code"
                )}
              </button>

              <button
                onClick={() => setCurrentStep("method")}
                className="w-full text-purple-secondary hover:text-purple-primary transition-colors text-sm mt-4"
              >
                ← Back to other options
              </button>
            </motion.div>
          )}

          {/* Email Verification Step */}
          {currentStep === "email-verify" && (
            <motion.div
              key="email-verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-purple-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles["email-verify"]}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions["email-verify"]}
                </p>
              </div>

              <div className="text-center space-y-2 mb-4">
                <p className="font-medium text-purple-primary break-all text-sm sm:text-base">
                  {formData.email}
                </p>
              </div>

              {/* OTP Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/[^0-9]/g, "")
                      .slice(0, 6);
                    setFormData((prev) => ({ ...prev, otp: value }));
                    // Clear errors when user starts typing
                    if (errors.otp) {
                      setErrors((prev) => ({ ...prev, otp: undefined }));
                    }
                  }}
                  placeholder="Enter 6-digit code"
                  className="w-full h-12 sm:h-14 bg-purple-dark/30 border border-purple-primary/30 rounded-xl px-4 text-white placeholder-gray-400 focus:outline-none focus:border-purple-primary/50 focus:ring-1 focus:ring-purple-primary/50 transition-all duration-200 text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  autoComplete="one-time-code"
                  disabled={isLoading}
                />
                {errors.otp && (
                  <p className="text-red-400 text-xs sm:text-sm flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.otp}
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <button
                onClick={handleEmailVerifyStep}
                disabled={isLoading || formData.otp.length !== 6}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-sm sm:text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-purple-primary/30 hover:shadow-purple-secondary/40"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify Code"
                )}
              </button>

              {/* Resend Section */}
              <div className="text-center space-y-2">
                <button
                  onClick={handleResendEmailVerification}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-purple-primary hover:text-purple-secondary text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 mx-auto"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span>
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend verification code"}
                  </span>
                </button>
              </div>

              <button
                onClick={() => setCurrentStep("email")}
                className="w-full text-purple-primary hover:text-purple-secondary transition-colors text-sm mt-4"
              >
                ← Change email address
              </button>

              {/* Tips */}
              <div className="bg-purple-dark/30 border border-purple-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground text-center">
                  💡 The code expires in 10 minutes. Make sure to check your
                  email's spam/junk folder if you don't see it.
                </p>
              </div>
            </motion.div>
          )}

          {/* Phone Verification Step */}
          {currentStep === "phone-verify" && (
            <motion.div
              key="phone-verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles["phone-verify"]}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions["phone-verify"]}
                </p>
              </div>

              <div className="text-center">
                <p className="text-white mb-2 text-sm sm:text-base">
                  Code sent to:
                </p>
                <p className="text-neon-green font-medium text-sm sm:text-base mb-2">
                  {formatPhoneDisplay(formData.phone)}
                </p>
                {phoneVerified && (
                  <div className="flex items-center justify-center space-x-2 text-green-500 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Phone number verified!</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Verification code
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setFormData((prev) => ({ ...prev, otp: value }));
                  }}
                  placeholder="123456"
                  className="w-full h-12 sm:h-14 bg-slate-800/50 border border-slate-600 rounded-lg px-3 sm:px-4 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green transition-colors text-sm sm:text-base text-center tracking-wider"
                  disabled={isLoading}
                  maxLength={6}
                />
                {errors.otp && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.otp}
                  </p>
                )}
              </div>

              <button
                onClick={handlePhoneVerifyStep}
                disabled={isLoading || formData.otp.length !== 6}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-neon-green to-neon-blue hover:from-neon-green/80 hover:to-neon-blue/80 text-black font-bold text-sm sm:text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Verify Code"
                )}
              </button>

              <div className="text-center">
                <p className="text-slate-400 text-xs sm:text-sm mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={sendOTP}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-neon-green hover:text-emerald-400 text-xs sm:text-sm disabled:opacity-50 flex items-center space-x-1 mx-auto"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span>
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend OTP"}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Profile Step */}
          {currentStep === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-neon-blue" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles.profile}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions.profile}
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    // Clear errors when user starts typing
                    if (errors.name) {
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                  placeholder="Your full name"
                  className={`w-full h-12 sm:h-14 bg-purple-dark/30 border rounded-xl px-3 sm:px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-primary/20 transition-all duration-200 text-sm sm:text-base ${
                    errors.name
                      ? "border-red-500"
                      : "border-purple-primary/30 focus:border-purple-primary/50"
                  }`}
                  disabled={isLoading}
                  maxLength={50}
                />
                {errors.name && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={async (e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        username: value,
                      }));

                      // Clear previous errors
                      setErrors((prev) => ({ ...prev, username: undefined }));

                      // Check availability in real-time if username is valid length
                      if (value.length >= 3) {
                        try {
                          const result = await checkAvailability(
                            undefined,
                            value,
                          );
                          if (!result.available) {
                            setErrors((prev) => ({
                              ...prev,
                              username:
                                result.message ===
                                "Email or username already taken"
                                  ? "Username is already taken"
                                  : "Username is not available",
                            }));
                          }
                        } catch (error) {
                          console.error(
                            "Username availability check failed:",
                            error,
                          );
                        }
                      }
                    }}
                    placeholder="your_username"
                    className={`w-full h-12 sm:h-14 bg-purple-dark/30 border rounded-xl px-3 sm:px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-primary/20 transition-all duration-200 text-sm sm:text-base ${
                      errors.username
                        ? "border-red-500"
                        : availability.username === false
                          ? "border-red-500"
                          : availability.username === true
                            ? "border-green-500"
                            : "border-purple-primary/30 focus:border-purple-primary/50"
                    }`}
                    disabled={isLoading}
                    maxLength={20}
                  />
                  {formData.username.length >= 3 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {availability.username === true && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {availability.username === false && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {errors.username && (
                    <p className="text-red-400 text-xs sm:text-sm flex items-center">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {errors.username}
                    </p>
                  )}
                  {availability.username === true && !errors.username && (
                    <p className="text-green-400 text-xs sm:text-sm flex items-center">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      Username is available!
                    </p>
                  )}
                  <p className="text-slate-400 text-xs">
                    Only lowercase letters, numbers, and underscores allowed.{" "}
                    {formData.username.length}/20
                  </p>
                </div>
              </div>

              <button
                onClick={handleProfileStep}
                disabled={
                  isLoading ||
                  !formData.name ||
                  !formData.username ||
                  availability.username === false
                }
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-sm sm:text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-purple-primary/30 hover:shadow-purple-secondary/40"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : signupMethod === "phone" ? (
                  "Create Account"
                ) : (
                  "Continue"
                )}
              </button>
            </motion.div>
          )}

          {/* Email Verification Step */}
          {currentStep === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  Verify your email
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  Enter the 6-digit code we sent to your email
                </p>
              </div>

              <div className="text-center text-purple-primary text-sm break-all mt-4">
                {formData.email}
              </div>

              <div>
                {/* Masked Input Display */}
                <div
                  className="flex justify-center space-x-2 sm:space-x-3 mb-4 relative cursor-text"
                  onClick={() => {
                    const input = document.querySelector(
                      "#verification-input",
                    ) as HTMLInputElement;
                    if (input) input.focus();
                  }}
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className="w-10 h-12 sm:w-12 sm:h-14 bg-purple-dark/30 border border-purple-primary/30 rounded-xl flex items-center justify-center text-white text-lg sm:text-xl font-bold tracking-wider transition-all duration-200"
                      style={{
                        borderColor: formData.otp[index]
                          ? "hsl(var(--purple-primary))"
                          : undefined,
                        backgroundColor: formData.otp[index]
                          ? "hsl(var(--purple-primary) / 0.1)"
                          : undefined,
                      }}
                    >
                      {formData.otp[index] ? "●" : ""}
                    </div>
                  ))}

                  {/* Hidden input field that captures typing */}
                  <input
                    id="verification-input"
                    type="text"
                    value={formData.otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setFormData((prev) => ({ ...prev, otp: value }));
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text"
                    disabled={isLoading}
                    maxLength={6}
                    autoFocus
                    placeholder=""
                  />
                </div>
                {errors.otp && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.otp}
                  </p>
                )}
              </div>

              <button
                onClick={handleVerificationStep}
                disabled={isLoading || formData.otp.length !== 6}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-neon-green to-neon-blue hover:from-neon-green/80 hover:to-neon-blue/80 text-black font-bold text-sm sm:text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Verify Code"
                )}
              </button>

              <div className="text-center">
                <p className="text-slate-400 text-xs sm:text-sm mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={resendTimer > 0 || isLoading}
                  className="text-neon-green hover:text-emerald-400 text-xs sm:text-sm disabled:opacity-50"
                >
                  {resendTimer > 0
                    ? `Resend in ${resendTimer}s`
                    : "Resend code"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Password Step */}
          {currentStep === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 sm:space-y-4"
            >
              <div className="text-center mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles.password}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions.password}
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }));
                      setErrorAlert(null); // Clear error when user types
                    }}
                    placeholder="Create a strong password"
                    className="w-full h-12 sm:h-14 bg-slate-800/50 border border-slate-600 rounded-lg px-3 sm:px-4 pr-10 sm:pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green transition-colors text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.password}
                  </p>
                )}

                {/* Password Strength Indicator */}
                <PasswordStrengthIndicator
                  password={formData.password}
                  className="mt-3"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm your password"
                    className="w-full h-12 sm:h-14 bg-slate-800/50 border border-slate-600 rounded-lg px-3 sm:px-4 pr-10 sm:pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-neon-green transition-colors text-sm sm:text-base"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Red Error Alert Box */}
              {errorAlert && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                    <p className="text-red-500 text-sm font-medium">
                      {errorAlert}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handlePasswordStep}
                disabled={
                  isLoading || !formData.password || !formData.confirmPassword
                }
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-sm sm:text-lg rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-purple-primary/30 hover:shadow-purple-secondary/40 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-accent to-purple-glow opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="group-hover:text-purple-glow transition-colors duration-300">
                        Verify & Continue
                      </span>
                      <svg
                        className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </motion.div>
          )}

          {/* Date of Birth Step */}
          {currentStep === "dob" && (
            <motion.div
              key="dob"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles.dob}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  You must be 18 or older to register
                </p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        dateOfBirth: e.target.value,
                      }));
                      // Clear errors when user selects a date
                      if (errors.dateOfBirth) {
                        setErrors((prev) => ({
                          ...prev,
                          dateOfBirth: undefined,
                        }));
                      }
                    }}
                    className={`w-full h-12 sm:h-14 bg-purple-dark/30 border rounded-xl px-3 sm:px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-primary/20 transition-all duration-200 text-sm sm:text-base backdrop-blur-sm ${
                      errors.dateOfBirth
                        ? "border-red-500"
                        : "border-purple-primary/30 focus:border-purple-primary/50"
                    }`}
                    disabled={isLoading}
                    max={new Date().toISOString().split("T")[0]}
                    min={
                      new Date(new Date().getFullYear() - 120, 0, 1)
                        .toISOString()
                        .split("T")[0]
                    }
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-purple-primary/60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Age display and helpful info */}
                {formData.dateOfBirth && !errors.dateOfBirth && (
                  <div className="mt-2 p-3 bg-purple-primary/10 border border-purple-primary/20 rounded-lg">
                    <p className="text-purple-primary text-sm">
                      ✅ You are{" "}
                      {Math.floor(
                        (new Date().getTime() -
                          new Date(formData.dateOfBirth).getTime()) /
                          (1000 * 60 * 60 * 24 * 365.25),
                      )}{" "}
                      years old
                    </p>
                  </div>
                )}

                {errors.dateOfBirth && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.dateOfBirth}
                  </p>
                )}

                {/* Trending info tip */}
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-400 text-xs flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    We keep your birthday private and only use it to verify
                    you're 18+
                  </p>
                </div>
              </div>

              <button
                onClick={handleDOBStep}
                disabled={isLoading || !formData.dateOfBirth}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-sm sm:text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-purple-primary/30 hover:shadow-purple-secondary/40"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Continue"
                )}
              </button>

              <button
                onClick={goBack}
                className="w-full text-purple-primary hover:text-purple-secondary transition-colors text-sm mt-4"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* Profile Image Step */}
          {currentStep === "profileImage" && (
            <motion.div
              key="profileImage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles.profileImage}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions.profileImage}
                </p>
                <button
                  onClick={handleProfileImageStep}
                  className="absolute top-4 right-4 text-purple-primary hover:text-purple-secondary transition-colors text-sm font-medium"
                >
                  Skip ���
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <div
                    className="w-24 h-24 sm:w-32 sm:h-32 bg-purple-dark/50 border-2 border-dashed border-purple-primary/40 rounded-full flex items-center justify-center cursor-pointer hover:border-purple-primary/60 hover:bg-purple-primary/10 transition-all duration-200 group"
                    onClick={() => {
                      const input = document.getElementById(
                        "profile-image-input",
                      ) as HTMLInputElement;
                      if (input) input.click();
                    }}
                  >
                    {formData.profileImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(formData.profileImage)}
                          alt="Profile preview"
                          className="w-full h-full rounded-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg
                          className="w-8 h-8 sm:w-12 sm:h-12 text-purple-primary/60 group-hover:text-purple-primary transition-colors duration-200 mx-auto mb-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        <p className="text-xs text-purple-primary/60 group-hover:text-purple-primary transition-colors duration-200">
                          Click to upload
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <input
                    id="profile-image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFormData((prev) => ({ ...prev, profileImage: file }));
                    }}
                    className="hidden"
                    disabled={isLoading}
                  />
                  {errors.profileImage && (
                    <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center justify-center">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      {errors.profileImage}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleProfileImageStep}
                disabled={isLoading}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-sm sm:text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-purple-primary/30 hover:shadow-purple-secondary/40"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Continue"
                )}
              </button>

              <button
                onClick={goBack}
                className="w-full text-purple-primary hover:text-purple-secondary transition-colors text-sm mt-4"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* Gender Step */}
          {currentStep === "gender" && (
            <motion.div
              key="gender"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-pink-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles.gender}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions.gender}
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { value: "Male", icon: "👨", description: "He/Him" },
                  { value: "Female", icon: "👩", description: "She/Her" },
                  { value: "Non-binary", icon: "🧑", description: "They/Them" },
                  { value: "Other", icon: "🌟", description: "Other identity" },
                  {
                    value: "Prefer not to say",
                    icon: "🔒",
                    description: "Keep private",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        gender: option.value,
                      }));
                      // Clear errors when user selects
                      if (errors.gender) {
                        setErrors((prev) => ({ ...prev, gender: undefined }));
                      }
                    }}
                    className={`w-full h-14 sm:h-16 rounded-xl border-2 transition-all duration-200 flex items-center justify-start px-4 text-sm sm:text-base font-medium group hover:scale-[1.02] ${
                      formData.gender === option.value
                        ? "bg-purple-primary/20 border-purple-primary text-purple-primary shadow-lg shadow-purple-primary/20"
                        : "bg-purple-dark/30 border-purple-primary/30 text-white hover:border-purple-primary/50 hover:bg-purple-primary/10"
                    }`}
                  >
                    <span className="text-2xl mr-3">{option.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">{option.value}</div>
                      <div
                        className={`text-xs ${
                          formData.gender === option.value
                            ? "text-purple-primary/80"
                            : "text-slate-400"
                        }`}
                      >
                        {option.description}
                      </div>
                    </div>
                    {formData.gender === option.value && (
                      <div className="ml-auto">
                        <CheckCircle className="w-5 h-5 text-purple-primary" />
                      </div>
                    )}
                  </button>
                ))}
                {errors.gender && (
                  <p className="text-red-400 text-xs sm:text-sm mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors.gender}
                  </p>
                )}
              </div>

              <button
                onClick={handleGenderStep}
                disabled={isLoading || !formData.gender}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-sm sm:text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-purple-primary/30 hover:shadow-purple-secondary/40"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Continue"
                )}
              </button>

              <button
                onClick={goBack}
                className="w-full text-purple-primary hover:text-purple-secondary transition-colors text-sm mt-4"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* Bio Step */}
          {currentStep === "bio" && (
            <motion.div
              key="bio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                  {stepTitles.bio}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm px-2">
                  {stepDescriptions.bio}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-white text-sm font-medium">
                    Bio (Optional) ✨
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, bio: "" }))
                    }
                    className="text-xs text-purple-primary hover:text-purple-secondary transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={formData.bio}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, bio: e.target.value }));
                      // Clear errors when user types
                      if (errors.bio) {
                        setErrors((prev) => ({ ...prev, bio: undefined }));
                      }
                    }}
                    placeholder="Tell us about your musical interests, favorite artists, or anything you'd like to share... 🎵"
                    rows={5}
                    className={`w-full bg-purple-dark/30 border rounded-xl px-3 sm:px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-primary/20 transition-all duration-200 text-sm sm:text-base backdrop-blur-sm resize-none ${
                      errors.bio
                        ? "border-red-500"
                        : "border-purple-primary/30 focus:border-purple-primary/50"
                    }`}
                    disabled={isLoading}
                    maxLength={500}
                  />
                </div>

                <div className="mt-3 space-y-2">
                  {/* Character count with visual indicator */}
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      {errors.bio && (
                        <p className="text-red-400 text-xs sm:text-sm flex items-center">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {errors.bio}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`text-xs font-medium ${
                          formData.bio.length > 450
                            ? "text-orange-400"
                            : formData.bio.length > 400
                              ? "text-yellow-400"
                              : "text-slate-400"
                        }`}
                      >
                        {formData.bio.length}/500
                      </div>
                      <div className="w-16 h-1 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            formData.bio.length > 450
                              ? "bg-orange-400"
                              : formData.bio.length > 400
                                ? "bg-yellow-400"
                                : "bg-purple-primary"
                          }`}
                          style={{
                            width: `${(formData.bio.length / 500) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bio suggestions */}
                  {formData.bio.length === 0 && (
                    <div className="bg-purple-primary/10 border border-purple-primary/20 rounded-lg p-3">
                      <p className="text-purple-primary text-xs font-medium mb-2">
                        💡 Bio ideas:
                      </p>
                      <div className="grid grid-cols-1 gap-1 text-xs text-purple-primary/80">
                        <p>
                          • "Music lover, vinyl collector, concert enthusiast"
                        </p>
                        <p>
                          • "Hip-hop head, bedroom producer, always finding new
                          beats"
                        </p>
                        <p>
                          • "Classical pianist, jazz appreciator, music theory
                          nerd"
                        </p>
                        <p>
                          • "Festival goer, playlist curator, discovering indie
                          gems"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Completion encouragement */}
                  {formData.bio.length > 0 && formData.bio.length < 50 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-blue-400 text-xs flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Tell us a bit more! A longer bio helps others connect
                        with you.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Verification Info for non-social signups */}
              {!isSocialSignup && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-blue-400 text-sm font-medium">
                        Email verification via Firebase
                      </p>
                      <p className="text-blue-300 text-xs">
                        We'll send a verification link to {formData.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleBioStep}
                disabled={isLoading}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-primary to-purple-secondary hover:from-purple-secondary hover:to-purple-accent text-white font-bold text-sm sm:text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg shadow-purple-primary/30 hover:shadow-purple-secondary/40"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto" />
                ) : (
                  "Create Account"
                )}
              </button>

              <button
                onClick={goBack}
                className="w-full text-purple-primary hover:text-purple-secondary transition-colors text-sm mt-4"
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer - Only show on method step */}
        {currentStep === "method" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center mt-6 sm:mt-8"
          >
            <p className="text-slate-400 text-xs sm:text-sm px-2">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-purple-primary hover:text-purple-secondary transition-colors underline"
              >
                Log in here
              </Link>
            </p>
          </motion.div>
        )}
      </div>

      {/* reCAPTCHA container for Firebase phone auth */}
      <div
        id="recaptcha-container"
        className="fixed bottom-4 right-4 z-50"
      ></div>

      {/* Additional reCAPTCHA info for users */}
      {phoneVerificationSent && (
        <div className="fixed bottom-20 left-4 right-4 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-3 text-white text-xs text-center z-40">
          <p>📱 SMS verification powered by Google reCAPTCHA</p>
        </div>
      )}
    </div>
  );
}
