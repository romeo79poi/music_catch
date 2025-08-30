import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";

export default function AuthTest() {
  const {
    user,
    signUp,
    signIn,
    signOut,
    requestSignupOTP,
    verifySignupOTP,
    requestLoginOTP,
    verifyLoginOTP,
    signInWithGoogle,
    signInWithFacebook,
    checkAvailability,
    isAuthenticated,
  } = useAuth();

  const { toast } = useToast();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // Test functions
  const testDirectSignup = async () => {
    setLoading(true);
    try {
      const result = await signUp(email, password, { name, username });
      toast({
        title: result.success ? "Success!" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testOTPSignup = async () => {
    setLoading(true);
    try {
      const result = await requestSignupOTP(email, password, name, username);
      toast({
        title: result.success ? "OTP Sent!" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testVerifySignupOTP = async () => {
    setLoading(true);
    try {
      const result = await verifySignupOTP(email, otp);
      toast({
        title: result.success ? "Account Created!" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testDirectLogin = async () => {
    setLoading(true);
    try {
      const result = await signIn(email, password);
      toast({
        title: result.success ? "Login Success!" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testOTPLogin = async () => {
    setLoading(true);
    try {
      const result = await requestLoginOTP(email);
      toast({
        title: result.success ? "OTP Sent!" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testVerifyLoginOTP = async () => {
    setLoading(true);
    try {
      const result = await verifyLoginOTP(email, otp);
      toast({
        title: result.success ? "Login Success!" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testGoogleAuth = async () => {
    setLoading(true);
    try {
      const mockToken = "mock_google_token_" + Date.now();
      const result = await signInWithGoogle(mockToken);
      toast({
        title: result.success ? "Google Auth Success!" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testFacebookAuth = async () => {
    setLoading(true);
    try {
      const mockToken = "mock_facebook_token_" + Date.now();
      const result = await signInWithFacebook(mockToken);
      toast({
        title: result.success ? "Facebook Auth Success!" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testCheckAvailability = async () => {
    setLoading(true);
    try {
      const result = await checkAvailability(email, username);
      toast({
        title: result.available ? "Available!" : "Not Available",
        description: result.message,
        variant: result.available ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const testSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "Successfully signed out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">JWT Authentication Test Page</h1>
          <p className="text-muted-foreground mt-2">
            Test all authentication methods with your JWT backend
          </p>
        </div>

        {/* Current User Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current User Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Authenticated:</span>
                <Badge variant={isAuthenticated ? "default" : "secondary"}>
                  {isAuthenticated ? "Yes" : "No"}
                </Badge>
              </div>
              {user && (
                <div className="space-y-1 text-sm">
                  <div>Email: {user.email}</div>
                  <div>Username: {user.username}</div>
                  <div>Name: {user.name}</div>
                  <div>ID: {user.id}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Test Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              placeholder="OTP Code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Registration Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Tests</CardTitle>
            <CardDescription>Test user registration methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={testDirectSignup} 
                disabled={loading}
                className="w-full"
              >
                Direct Signup (JWT)
              </Button>
              <Button 
                onClick={testCheckAvailability} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Check Availability
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium">OTP Signup Flow:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={testOTPSignup} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  1. Request Signup OTP
                </Button>
                <Button 
                  onClick={testVerifySignupOTP} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  2. Verify Signup OTP
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Login Tests</CardTitle>
            <CardDescription>Test user login methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testDirectLogin} 
              disabled={loading}
              className="w-full"
            >
              Direct Login (Email/Password)
            </Button>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium">OTP Login Flow:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={testOTPLogin} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  1. Request Login OTP
                </Button>
                <Button 
                  onClick={testVerifyLoginOTP} 
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  2. Verify Login OTP
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OAuth Tests */}
        <Card>
          <CardHeader>
            <CardTitle>OAuth Tests</CardTitle>
            <CardDescription>Test social authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={testGoogleAuth} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Google OAuth (Mock)
              </Button>
              <Button 
                onClick={testFacebookAuth} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                Facebook OAuth (Mock)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Actions */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle>User Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testSignOut} 
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
