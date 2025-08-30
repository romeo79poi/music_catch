import nodemailer from "nodemailer";

// Create email transporter (prefers env SMTP, falls back to Nodemailer test account)
const createTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? parseInt(process.env.SMTP_PORT)
    : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    console.log("✉️ Using custom SMTP transport", {
      host,
      port,
      secure: port === 465,
    });
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  // Fallback: create an Ethereal test account dynamically
  console.log("✉️ Using Ethereal test SMTP (no SMTP_* env provided)");
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
    tls: { rejectUnauthorized: false },
  });
};

// Beautiful HTML email template
const createVerificationEmailHTML = (
  verificationCode: string,
  email: string,
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
            text-align: center;
        }
        
        .welcome-text {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        
        .verification-code {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border: 2px dashed #cc66ff;
            border-radius: 12px;
            padding: 30px 20px;
            margin: 30px 0;
            display: inline-block;
        }
        
        .code-label {
            font-size: 14px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .code {
            font-size: 32px;
            font-weight: 800;
            color: #cc66ff;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        
        .instructions {
            background-color: #f7fafc;
            border-left: 4px solid #cc66ff;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
            text-align: left;
        }
        
        .instructions h3 {
            color: #2d3748;
            font-size: 16px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .instructions ol {
            color: #4a5568;
            padding-left: 20px;
        }
        
        .instructions li {
            margin-bottom: 5px;
        }
        
        .security-note {
            background-color: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
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
        
        @media (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            .code {
                font-size: 28px;
                letter-spacing: 6px;
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
                Hi there! 👋<br>
                Welcome to <strong>Music Catch</strong>! We're excited to have you join our community.
            </p>
            
            <div class="verification-code">
                <div class="code-label">Your Verification Code</div>
                <div class="code">${verificationCode}</div>
                <div class="expiry-time">⏰ Expires in 10 minutes</div>
            </div>
            
            <div class="instructions">
                <h3>📱 How to verify your account:</h3>
                <ol>
                    <li>Return to the Music Catch signup page</li>
                    <li>Enter the 6-digit code above</li>
                    <li>Complete your profile setup</li>
                    <li>Start discovering amazing music! 🎶</li>
                </ol>
            </div>
            
            <div class="security-note">
                <h4>🔐 Security Notice</h4>
                <p>This code was sent to <strong>${email}</strong>. If you didn't request this verification, please ignore this email. Never share this code with anyone.</p>
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

// Send verification email
export const sendVerificationEmail = async (
  email: string,
  verificationCode: string,
) => {
  try {
    console.log("🔧 Email service configuration:", {
      emailUser: process.env.EMAIL_USER || "noreply@musiccatch.com",
      service: "Ethereal Email SMTP",
      nodeEnv: process.env.NODE_ENV,
    });

    const transporter = await createTransporter();

    // Test the connection first
    try {
      await transporter.verify();
      console.log("✅ SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("❌ SMTP connection verification failed:", verifyError);
      throw new Error(
        `SMTP connection failed: ${verifyError instanceof Error ? verifyError.message : "Unknown error"}`,
      );
    }

    const mailOptions = {
      from: `"${process.env.FROM_NAME || "Music Catch"}" <${process.env.FROM_EMAIL || "noreply@musiccatch.com"}>`,
      to: email,
      subject: "🎵 Verify your Music Catch account",
      html: createVerificationEmailHTML(verificationCode, email),
      // Text fallback for email clients that don't support HTML
      text: `
Welcome to Music Catch!

Your verification code is: ${verificationCode}

This code will expire in 10 minutes.

Please enter this code on the Music Catch signup page to verify your email address.

If you didn't create an account with Music Catch, please ignore this email.

Best regards,
The Music Catch Team
      `.trim(),
    };

    // Send email
    console.log(`📧 Attempting to send email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Verification email sent successfully:", {
      messageId: info.messageId,
      to: email,
      accepted: info.accepted,
      rejected: info.rejected,
      preview:
        process.env.NODE_ENV !== "production"
          ? nodemailer.getTestMessageUrl(info)
          : undefined,
    });

    return {
      success: true,
      messageId: info.messageId,
      previewUrl:
        process.env.NODE_ENV !== "production"
          ? nodemailer.getTestMessageUrl(info)
          : undefined,
    };
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);

    // Provide more specific error messages
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for common email service errors
      if (
        errorMessage.includes("Authentication failed") ||
        errorMessage.includes("Invalid login")
      ) {
        errorMessage =
          "Email service authentication failed - check email credentials";
      } else if (errorMessage.includes("SMTP connection failed")) {
        errorMessage =
          "Cannot connect to email service - check network and credentials";
      } else if (errorMessage.includes("timeout")) {
        errorMessage =
          "Email service timeout - service may be temporarily unavailable";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};

// Send welcome email after successful registration
export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${process.env.FROM_NAME || "Music Catch Team"}" <${process.env.FROM_EMAIL || "hello@musiccatch.com"}>`,
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 Welcome to Music Catch!</h1>
            <p>Hi ${name}, you're all set up and ready to go!</p>
        </div>
        <div class="content">
            <h2>What's next?</h2>
            <ul>
                <li>🎶 Discover new music</li>
                <li>📝 Create your playlists</li>
                <li>💜 Like your favorite songs</li>
                <li>👥 Connect with friends</li>
            </ul>
            <a href="#" class="button">Start Exploring Music →</a>
        </div>
    </div>
</body>
</html>
      `,
      text: `
Welcome to Music Catch, ${name}!

Your account has been successfully created. You can now:
- Discover new music
- Create playlists
- Like your favorite songs
- Connect with friends

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
