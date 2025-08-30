import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";
const EMAIL_JWT_EXPIRES_IN = process.env.EMAIL_JWT_EXPIRES_IN || "1h";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// Create email transporter
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || "musiccatch.verify@gmail.com";
  const emailPass = process.env.EMAIL_PASS || "xypt zqmr wrgt jwbs";

  return nodemailer.createTransporter({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Generate JWT token for email verification
export const generateEmailVerificationToken = (
  email: string,
  userId?: string,
): string => {
  const payload = {
    email,
    userId,
    type: "email_verification",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: EMAIL_JWT_EXPIRES_IN,
    issuer: "music-catch-api",
    audience: "music-catch-app",
  });
};

// Verify JWT token for email verification
export const verifyEmailVerificationToken = (
  token: string,
): { email: string; userId?: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "music-catch-api",
      audience: "music-catch-app",
    }) as any;

    if (decoded.type !== "email_verification") {
      return null;
    }

    return {
      email: decoded.email,
      userId: decoded.userId,
    };
  } catch (error) {
    console.error("Email verification token error:", error);
    return null;
  }
};

// Create HTML email template with verification link
const createVerificationEmailWithLinkHTML = (
  verificationLink: string,
  verificationCode: string,
  email: string,
  name?: string,
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Music Catch</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #cc66ff 0%, #f986d2 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: bold;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .welcome-text {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 30px;
            line-height: 1.5;
            text-align: center;
        }
        
        .verification-section {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        
        .verification-button {
            display: inline-block;
            background: linear-gradient(135deg, #cc66ff 0%, #f986d2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(204, 102, 255, 0.3);
            transition: all 0.3s ease;
        }
        
        .verification-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(204, 102, 255, 0.4);
        }
        
        .or-divider {
            margin: 30px 0;
            text-align: center;
            position: relative;
        }
        
        .or-divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: #e2e8f0;
        }
        
        .or-divider span {
            background: white;
            padding: 0 20px;
            color: #718096;
            font-size: 14px;
            font-weight: 500;
        }
        
        .verification-code {
            background: #fff;
            border: 2px dashed #cc66ff;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            display: inline-block;
        }
        
        .code-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .code {
            font-size: 24px;
            font-weight: 800;
            color: #cc66ff;
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
        }
        
        .instructions {
            background-color: #f7fafc;
            border-left: 4px solid #cc66ff;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .instructions h3 {
            color: #2d3748;
            font-size: 16px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .instructions p {
            color: #4a5568;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .instructions .method {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-radius: 6px;
        }
        
        .security-note {
            background-color: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .security-note h4 {
            color: #c53030;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .security-note p {
            color: #742a2a;
            font-size: 12px;
        }
        
        .footer {
            background-color: #2d3748;
            color: #a0aec0;
            padding: 30px 20px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer h3 {
            color: #ffffff;
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .footer p {
            margin-bottom: 5px;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #cc66ff;
            text-decoration: none;
            font-weight: 500;
        }
        
        .expiry-time {
            color: #e53e3e;
            font-weight: 600;
            font-size: 14px;
            margin-top: 15px;
        }
        
        .link-info {
            background-color: #e6fffa;
            border: 1px solid #4fd1c7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 13px;
            color: #234e52;
        }
        
        .manual-link {
            background-color: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            word-break: break-all;
            font-size: 12px;
            font-family: monospace;
            color: #4a5568;
        }
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .verification-button {
                padding: 14px 24px;
                font-size: 14px;
            }
            
            .code {
                font-size: 20px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎵</div>
            <h1>Music Catch</h1>
            <p>Verify your email to continue</p>
        </div>
        
        <div class="content">
            <p class="welcome-text">
                Hi ${name || "there"}! 👋<br>
                Welcome to <strong>Music Catch</strong>! We're excited to have you join our community.
            </p>
            
            <div class="verification-section">
                <h3>🚀 Quick Verification (Recommended)</h3>
                <p>Click the button below to instantly verify your email address:</p>
                
                <a href="${verificationLink}" class="verification-button" style="color: white;">
                    ✨ Verify My Email
                </a>
                
                <div class="link-info">
                    <strong>🔒 Secure Link:</strong> This link is encrypted and expires in 1 hour for your security.
                </div>
            </div>
            
            <div class="or-divider">
                <span>OR</span>
            </div>
            
            <div class="instructions">
                <h3>📱 Manual Verification</h3>
                
                <div class="method">
                    <strong>Method 1:</strong> Use the verification code
                    <div class="verification-code">
                        <div class="code-label">Verification Code</div>
                        <div class="code">${verificationCode}</div>
                    </div>
                </div>
                
                <div class="method">
                    <strong>Method 2:</strong> Copy and paste this link in your browser
                    <div class="manual-link">${verificationLink}</div>
                </div>
                
                <p><strong>Both methods work the same way</strong> - use whichever is more convenient for you!</p>
            </div>
            
            <div class="expiry-time">
                ⏰ This verification expires in 1 hour
            </div>
            
            <div class="security-note">
                <h4>🔐 Security Notice</h4>
                <p>This email was sent to <strong>${email}</strong>. If you didn't create an account with Music Catch, please ignore this email. Never share this verification link or code with anyone.</p>
            </div>
        </div>
        
        <div class="footer">
            <h3>Music Catch</h3>
            <p>Your music discovery platform</p>
            <p>Making music social, one catch at a time</p>
            
            <div class="social-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Contact Support</a>
            </div>
            
            <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
                © 2024 Music Catch. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`;
};

// Send verification email with JWT token link
export const sendVerificationEmailWithLink = async (
  email: string,
  verificationCode: string,
  name?: string,
  userId?: string,
) => {
  try {
    const transporter = createTransporter();

    // Generate JWT token for email verification
    const verificationToken = generateEmailVerificationToken(email, userId);

    // Create verification link
    const verificationLink = `${FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: '"Music Catch" <noreply@musiccatch.com>',
      to: email,
      subject:
        "🎵 Verify your Music Catch account - Click to verify instantly!",
      html: createVerificationEmailWithLinkHTML(
        verificationLink,
        verificationCode,
        email,
        name,
      ),
      text: `
Welcome to Music Catch!

Hi ${name || "there"},

Thank you for creating an account with Music Catch! To complete your registration, please verify your email address.

QUICK VERIFICATION (Recommended):
Click this link to verify instantly: ${verificationLink}

MANUAL VERIFICATION:
If the link doesn't work, use this code: ${verificationCode}

This verification expires in 1 hour for your security.

If you didn't create an account with Music Catch, please ignore this email.

Best regards,
The Music Catch Team
      `.trim(),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Verification email with JWT link sent successfully:", {
      messageId: info.messageId,
      to: email,
      verificationLink:
        process.env.NODE_ENV === "development" ? verificationLink : "[hidden]",
      preview:
        process.env.NODE_ENV !== "production"
          ? nodemailer.getTestMessageUrl(info)
          : undefined,
    });

    return {
      success: true,
      messageId: info.messageId,
      verificationToken,
      verificationLink:
        process.env.NODE_ENV === "development" ? verificationLink : undefined,
      previewUrl:
        process.env.NODE_ENV !== "production"
          ? nodemailer.getTestMessageUrl(info)
          : undefined,
    };
  } catch (error) {
    console.error("❌ Failed to send verification email with link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Create password reset email with JWT token
const createPasswordResetEmailHTML = (
  resetLink: string,
  resetToken: string,
  email: string,
  name?: string,
) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Music Catch</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #e53e3e 0%, #fc8181 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            font-size: 24px;
            font-weight: bold;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .reset-section {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #e53e3e 0%, #fc8181 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(229, 62, 62, 0.3);
        }
        
        .security-note {
            background-color: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .expiry-time {
            color: #e53e3e;
            font-weight: 600;
            font-size: 14px;
            margin-top: 15px;
        }
        
        .manual-token {
            background-color: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            word-break: break-all;
            font-size: 12px;
            font-family: monospace;
            color: #4a5568;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔒</div>
            <h1>Password Reset</h1>
            <p>Reset your Music Catch password</p>
        </div>
        
        <div class="content">
            <p>Hi ${name || "there"},</p>
            <p>You requested to reset your password for your Music Catch account. Click the button below to create a new password:</p>
            
            <div class="reset-section">
                <a href="${resetLink}" class="reset-button" style="color: white;">
                    🔑 Reset My Password
                </a>
                
                <div class="expiry-time">
                    ⏰ This link expires in 1 hour
                </div>
            </div>
            
            <p><strong>Manual Reset:</strong> If the button doesn't work, copy and paste this link:</p>
            <div class="manual-token">${resetLink}</div>
            
            <div class="security-note">
                <h4>🔐 Security Notice</h4>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

// Generate JWT token for password reset
export const generatePasswordResetToken = (
  email: string,
  userId: string,
): string => {
  const payload = {
    email,
    userId,
    type: "password_reset",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
    issuer: "music-catch-api",
    audience: "music-catch-app",
  });
};

// Verify JWT token for password reset
export const verifyPasswordResetToken = (
  token: string,
): { email: string; userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "music-catch-api",
      audience: "music-catch-app",
    }) as any;

    if (decoded.type !== "password_reset") {
      return null;
    }

    return {
      email: decoded.email,
      userId: decoded.userId,
    };
  } catch (error) {
    console.error("Password reset token error:", error);
    return null;
  }
};

// Send password reset email with JWT token link
export const sendPasswordResetEmail = async (
  email: string,
  userId: string,
  name?: string,
) => {
  try {
    const transporter = createTransporter();

    // Generate JWT token for password reset
    const resetToken = generatePasswordResetToken(email, userId);

    // Create reset link
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: '"Music Catch Security" <security@musiccatch.com>',
      to: email,
      subject: "🔒 Reset your Music Catch password",
      html: createPasswordResetEmailHTML(resetLink, resetToken, email, name),
      text: `
Password Reset Request

Hi ${name || "there"},

You requested to reset your password for your Music Catch account.

Click this link to reset your password: ${resetLink}

This link expires in 1 hour for your security.

If you didn't request this password reset, please ignore this email.

Best regards,
The Music Catch Security Team
      `.trim(),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Password reset email sent successfully:", {
      messageId: info.messageId,
      to: email,
      resetLink:
        process.env.NODE_ENV === "development" ? resetLink : "[hidden]",
    });

    return {
      success: true,
      messageId: info.messageId,
      resetToken,
      resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined,
    };
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Send welcome email after successful verification
export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: '"Music Catch Team" <hello@musiccatch.com>',
      to: email,
      subject: "🎉 Welcome to Music Catch!",
      html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Music Catch!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #cc66ff 0%, #f986d2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .content { padding: 30px 0; }
        .button { background: #cc66ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; }
        .feature { background: #f7fafc; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #cc66ff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 Welcome to Music Catch!</h1>
            <p>Hi ${name}, your email is verified and you're all set up!</p>
        </div>
        <div class="content">
            <h2>🚀 What's next?</h2>
            
            <div class="feature">
                <h3>🎶 Discover New Music</h3>
                <p>Explore trending songs and discover your next favorite track</p>
            </div>
            
            <div class="feature">
                <h3>📝 Create Playlists</h3>
                <p>Organize your music and share your taste with the community</p>
            </div>
            
            <div class="feature">
                <h3>💜 Like & Save</h3>
                <p>Like songs and build your personal music library</p>
            </div>
            
            <div class="feature">
                <h3>👥 Connect with Friends</h3>
                <p>Follow other music lovers and see what they're listening to</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${FRONTEND_URL}/home" class="button" style="color: white;">🎵 Start Exploring Music</a>
            </div>
            
            <p style="text-align: center; color: #666; margin-top: 30px;">
                Thanks for joining the Music Catch community! 🎉<br>
                We're excited to see what music you'll discover.
            </p>
        </div>
    </div>
</body>
</html>
      `,
      text: `
Welcome to Music Catch, ${name}!

Your email has been verified and your account is now active!

What's next?
• 🎶 Discover new music and trending songs
• 📝 Create and share your playlists  
• 💜 Like and save your favorite tracks
• 👥 Connect with other music lovers

Start exploring: ${FRONTEND_URL}/home

Thanks for joining us!
The Music Catch Team
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Welcome email sent successfully:", {
      messageId: info.messageId,
      to: email,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export { sendVerificationEmailWithLink as sendVerificationEmail };
