import smtplib
import secrets
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class EmailService:
    """Email service using SMTP (Gmail or any SMTP server)"""
    
    def __init__(self):
        # Read from environment variables
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', f'MoodMunch <{self.smtp_username}>')
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # Enable if credentials are set
        self.enabled = bool(self.smtp_username and self.smtp_password)
        
        if not self.enabled:
            logger.warning("⚠️ Email service disabled - SMTP credentials not configured")
            logger.warning(f"   SMTP_USERNAME: {bool(self.smtp_username)}")
            logger.warning(f"   SMTP_PASSWORD: {bool(self.smtp_password)}")
        else:
            logger.info(f"✅ Email service enabled with SMTP ({self.smtp_server})")
            logger.info(f"📧 Sending from: {self.from_email}")
    
    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email using SMTP"""
        if not self.enabled:
            logger.info(f"[MOCK] Email would be sent to {to_email}: {subject}")
            return True
        
        try:
            message = MIMEMultipart('alternative')
            message['From'] = self.from_email
            message['To'] = to_email
            message['Subject'] = subject
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)
            
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP Authentication failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"❌ Email sending error: {str(e)}")
            return False
    
    def generate_verification_token(self) -> str:
        """Generate a secure verification token"""
        return secrets.token_urlsafe(32)
    
    def send_verification_email(self, email: str, name: str, token: str) -> bool:
        """Send email verification link"""
        verification_url = f"{self.frontend_url}/verify-email?token={token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%); 
                           color: white; padding: 30px; text-align: center; border-radius: 10px; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%);
                          color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;
                          font-weight: bold; margin: 20px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 14px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍳 Welcome to MoodMunch!</h1>
                </div>
                <div class="content">
                    <h2>Hi {name}! 👋</h2>
                    <p>Thank you for joining MoodMunch - your AI-powered recipe companion!</p>
                    <p>To get started with personalized recipe recommendations, please verify your email address:</p>
                    <p style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link into your browser:<br>
                        <code style="background: #eee; padding: 5px; display: inline-block; margin-top: 10px;">
                            {verification_url}
                        </code>
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        This link will expire in 24 hours for security reasons.
                    </p>
                </div>
                <div class="footer">
                    <p>If you didn't create this account, please ignore this email.</p>
                    <p>© 2024 MoodMunch. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=email,
            subject="🍳 Verify Your MoodMunch Account",
            html_content=html_content
        )
    
    def send_password_reset_email(self, email: str, name: str, token: str) -> bool:
        """Send password reset link"""
        reset_url = f"{self.frontend_url}/reset-password?token={token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%); 
                           color: white; padding: 30px; text-align: center; border-radius: 10px; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%);
                          color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;
                          font-weight: bold; margin: 20px 0; }}
                .warning {{ background: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; 
                           border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 14px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hi {name},</h2>
                    <p>We received a request to reset your MoodMunch password.</p>
                    <p>Click the button below to create a new password:</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Or copy and paste this link into your browser:<br>
                        <code style="background: #eee; padding: 5px; display: inline-block; margin-top: 10px;">
                            {reset_url}
                        </code>
                    </p>
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>This link expires in 1 hour</li>
                            <li>If you didn't request this, please ignore this email</li>
                            <li>Your password remains unchanged until you create a new one</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p>If you didn't request a password reset, please ignore this email.</p>
                    <p>© 2024 MoodMunch. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=email,
            subject="🔐 Reset Your MoodMunch Password",
            html_content=html_content
        )
    
    def send_password_changed_notification(self, email: str, name: str) -> bool:
        """Send notification that password was changed"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
                           color: white; padding: 30px; text-align: center; border-radius: 10px; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 10px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 14px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Password Changed Successfully</h1>
                </div>
                <div class="content">
                    <h2>Hi {name},</h2>
                    <p>Your MoodMunch password has been successfully changed.</p>
                    <p>If you made this change, you can safely ignore this email.</p>
                    <p style="background: #FEE2E2; padding: 15px; border-left: 4px solid #EF4444; border-radius: 5px;">
                        <strong>⚠️ Important:</strong> If you didn't make this change, 
                        please contact our support team immediately.
                    </p>
                </div>
                <div class="footer">
                    <p>© 2024 MoodMunch. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self.send_email(
            to_email=email,
            subject="✅ Your MoodMunch Password Was Changed",
            html_content=html_content
        )