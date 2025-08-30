import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Mail,
  Shield,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string>("");

  const [manualCode, setManualCode] = useState("");
  const [email, setEmail] = useState("");
  const [showManualVerification, setShowManualVerification] = useState(false);

  // Get token from URL
  const tokenFromUrl = searchParams.get("token");

  // Auto-verify if token is present in URL
  useEffect(() => {
    if (tokenFromUrl && !verified && !verifying) {
      verifyWithToken(tokenFromUrl);
    }
  }, [tokenFromUrl, verified, verifying]);

  // Verify email using JWT token from link
  const verifyWithToken = async (token: string) => {
    setVerifying(true);
    setError("");

    try {
      const response = await fetch(
        "/api/v4/auth/verification/email/verify-token",
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
        setVerified(true);
        toast({
          title: "✅ Email Verified!",
          description:
            data.message || "Your email has been successfully verified.",
        });

        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate("/home");
        }, 3000);
      } else {
        setError(data.message || "Token verification failed");
        setShowManualVerification(true);
        toast({
          title: "Token Verification Failed",
          description:
            data.message ||
            "The verification link may have expired. Try manual verification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setError("Network error occurred");
      setShowManualVerification(true);
      toast({
        title: "Network Error",
        description: "Failed to verify token. Please try manual verification.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  // Verify email using manual code
  const verifyWithCode = async () => {
    if (!email || !manualCode) {
      setError("Email and verification code are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/v4/auth/verification/email/verify-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            code: manualCode.trim(),
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setVerified(true);
        toast({
          title: "✅ Email Verified!",
          description:
            data.message || "Your email has been successfully verified.",
        });

        // Redirect to home after 3 seconds
        setTimeout(() => {
          navigate("/home");
        }, 3000);
      } else {
        setError(data.message || "Code verification failed");
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid verification code.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setError("Network error occurred");
      toast({
        title: "Network Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v4/auth/verification/email/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "📧 Verification Email Sent!",
          description: "Check your email for a new verification link.",
        });
      } else {
        setError(data.message || "Failed to resend verification email");
        toast({
          title: "Resend Failed",
          description: data.message || "Failed to resend verification email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setError("Network error occurred");
      toast({
        title: "Network Error",
        description: "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy current URL for sharing
  const copyVerificationLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Verification link copied to clipboard.",
    });
  };

  // If already verified
  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              Email Verified!
            </CardTitle>
            <CardDescription>
              Your email has been successfully verified. You'll be redirected to
              the home page shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verification Complete
              </Badge>

              <p className="text-sm text-muted-foreground">
                Redirecting in 3 seconds...
              </p>

              <Button onClick={() => navigate("/home")} className="w-full">
                Continue to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If currently verifying token
  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Verifying Email...
            </CardTitle>
            <CardDescription>
              Please wait while we verify your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="secondary" className="text-blue-600">
              <Shield className="w-4 h-4 mr-1" />
              Secure Verification in Progress
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main verification page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-darker via-background to-purple-dark flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Verify Your Email
            </CardTitle>
            <CardDescription>
              {tokenFromUrl
                ? "We're verifying your email address..."
                : "Enter your verification details to confirm your email address"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Token Info (if present) */}
        {tokenFromUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Secure Verification Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">JWT Token Detected</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyVerificationLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                This secure link contains an encrypted token to verify your
                email instantly.
              </p>

              <Button
                onClick={() => verifyWithToken(tokenFromUrl)}
                disabled={verifying}
                className="w-full"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify with Secure Token
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Verification */}
        {(showManualVerification || !tokenFromUrl) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Verification</CardTitle>
              <CardDescription>
                Enter your email and verification code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  disabled={loading}
                />
              </div>

              <Button
                onClick={verifyWithCode}
                disabled={loading || !email || !manualCode}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Resend Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="resendEmail">Email Address</Label>
              <Input
                id="resendEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to resend"
                disabled={loading}
              />
            </div>

            <Button
              variant="outline"
              onClick={resendVerificationEmail}
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Didn't receive an email? Check your spam folder.</p>
              <p className="mt-1">
                Need support?{" "}
                <a href="#" className="text-purple-400 hover:underline">
                  Contact us
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Verification Methods</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-start gap-2">
              <ExternalLink className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                <strong>Secure Link:</strong> Click the link in your email for
                instant verification
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-blue-500" />
              <span>
                <strong>Manual Code:</strong> Enter the 6-digit code from your
                email
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
