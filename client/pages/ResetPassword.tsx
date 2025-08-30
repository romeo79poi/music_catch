import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Key,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState<string>("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get token from URL
  const tokenFromUrl = searchParams.get("token");

  // Validate token on mount
  useEffect(() => {
    if (tokenFromUrl) {
      validateToken(tokenFromUrl);
    } else {
      setIsValidToken(false);
      setError("No reset token found in URL");
    }
  }, [tokenFromUrl]);

  // Validate the reset token
  const validateToken = async (token: string) => {
    setValidating(true);
    setError("");

    try {
      const response = await fetch(
        "/api/v4/auth/password/validate-reset-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setIsValidToken(true);
      } else {
        setIsValidToken(false);
        setError(data.message || "Invalid or expired reset token");
      }
    } catch (error) {
      setIsValidToken(false);
      setError("Network error occurred while validating token");
    } finally {
      setValidating(false);
    }
  };

  // Reset password using JWT token
  const resetPassword = async () => {
    if (!tokenFromUrl) {
      setError("No reset token available");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter both password fields");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v4/auth/password/reset-with-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenFromUrl,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResetComplete(true);
        toast({
          title: "✅ Password Reset Successful!",
          description:
            "Your password has been updated. You can now log in with your new password.",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || "Password reset failed");
        toast({
          title: "Reset Failed",
          description: data.message || "Failed to reset password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setError("Network error occurred");
      toast({
        title: "Network Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        return { level: "weak", color: "text-red-500", text: "Weak" };
      case 2:
      case 3:
        return { level: "medium", color: "text-yellow-500", text: "Medium" };
      case 4:
      case 5:
        return { level: "strong", color: "text-green-500", text: "Strong" };
      default:
        return { level: "weak", color: "text-gray-500", text: "" };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // If password reset is complete
  if (resetComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Password Reset Complete!
            </CardTitle>
            <CardDescription>
              Your password has been successfully updated. You can now log in
              with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Badge variant="secondary" className="text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Password Updated
            </Badge>

            <p className="text-sm text-muted-foreground">
              Redirecting to login page in 3 seconds...
            </p>

            <Button onClick={() => navigate("/login")} className="w-full">
              <Key className="w-4 h-4 mr-2" />
              Continue to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If validating token
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Validating Reset Token...
            </CardTitle>
            <CardDescription>
              Please wait while we verify your password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="secondary" className="text-blue-600">
              <Shield className="w-4 w-4 mr-1" />
              Secure Validation in Progress
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If token is invalid
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Invalid Reset Link
            </CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Password reset links expire after 1 hour for security reasons.
              </p>

              <div className="space-y-2">
                <Button
                  onClick={() => navigate("/forgot-password")}
                  className="w-full"
                >
                  Request New Reset Link
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main password reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Reset Your Password
            </CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
        </Card>

        {/* Token Info */}
        {isValidToken && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 justify-center">
                <Badge variant="outline" className="text-green-600">
                  <Shield className="w-4 h-4 mr-1" />
                  Secure Reset Token Verified
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Password Reset Form */}
        {isValidToken && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Password</CardTitle>
              <CardDescription>
                Choose a strong password for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Password */}
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Strength:
                      </span>
                      <span
                        className={`text-xs font-medium ${passwordStrength.color}`}
                      >
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground space-y-1">
                      <div
                        className={
                          newPassword.length >= 8 ? "text-green-600" : ""
                        }
                      >
                        ✓ At least 8 characters
                      </div>
                      <div
                        className={
                          /[A-Z]/.test(newPassword) ? "text-green-600" : ""
                        }
                      >
                        ✓ One uppercase letter
                      </div>
                      <div
                        className={
                          /[a-z]/.test(newPassword) ? "text-green-600" : ""
                        }
                      >
                        ✓ One lowercase letter
                      </div>
                      <div
                        className={
                          /\d/.test(newPassword) ? "text-green-600" : ""
                        }
                      >
                        ✓ One number
                      </div>
                      <div
                        className={
                          /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
                            ? "text-green-600"
                            : ""
                        }
                      >
                        ✓ One special character (recommended)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className="mt-1">
                    {newPassword === confirmPassword ? (
                      <span className="text-xs text-green-600">
                        ✓ Passwords match
                      </span>
                    ) : (
                      <span className="text-xs text-red-500">
                        ✗ Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                onClick={resetPassword}
                disabled={
                  loading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security Notice */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Security Notice</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>🔒 This is a secure password reset using encrypted tokens</p>
            <p>⏰ Reset links expire after 1 hour for your security</p>
            <p>🚫 This link can only be used once</p>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-purple-400 hover:text-purple-300 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
