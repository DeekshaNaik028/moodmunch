# backend/app/services/email_service.py - FIXED VERSION
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
        
        # CRITICAL FIX: Use production URL if deployed
        self.frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # Enable if credentials are set
        self.enabled = bool(self.smtp_username and self.smtp_password)
        
        if not self.enabled:
            logger.warning("⚠️ Email service disabled - SMTP credentials not configured")
        else:
            logger.info(f"✅ Email service enabled with SMTP ({self.smtp_server})")
            logger.info(f"📧 Sending from: {self.from_email}")
            logger.info(f"🌐 Frontend URL: {self.frontend_url}")
    
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
        # CRITICAL FIX: Use direct URL without extra parameters
        verification_url = f"{self.frontend_url}/verify-email?token={token}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6; 
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;
                }}
                .container {{ 
                    max-width: 600px; 
                    margin: 0 auto; 
                    padding: 20px;
                }}
                .header {{ 
                    background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0;
                }}
                .content {{ 
                    background: white; 
                    padding: 30px; 
                    border-radius: 0 0 10px 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .button {{ 
                    display: inline-block; 
                    background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%);
                    color: white !important; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px;
                    font-weight: bold; 
                    margin: 20px 0;
                    text-align: center;
                }}
                .button:hover {{
                    opacity: 0.9;
                }}
                .footer {{ 
                    text-align: center; 
                    color: #666; 
                    font-size: 14px; 
                    margin-top: 30px;
                    padding: 20px;
                }}
                .warning {{
                    background: #FEF3C7;
                    padding: 15px;
                    border-left: 4px solid #F59E0B;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .url-box {{
                    background: #f5f5f5;
                    padding: 12px;
                    border-radius: 6px;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                    border: 1px solid #ddd;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🍳 Welcome to MoodMunch!</h1>
                </div>
                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Hi {name}! 👋</h2>
                    <p style="font-size: 16px; color: #555;">
                        Thank you for joining MoodMunch - your AI-powered recipe companion!
                    </p>
                    <p style="font-size: 16px; color: #555;">
                        To get started with personalized recipe recommendations, please verify your email address by clicking the button below:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{verification_url}" class="button" style="color: white;">
                            ✅ Verify Email Address
                        </a>
                    </div>
                    
                    <div class="warning">
                        <p style="margin: 0; font-size: 14px; color: #92400E;">
                            <strong>⚠️ Can't click the button?</strong> Copy and paste this link into your browser:
                        </p>
                        <div class="url-box">
                            {verification_url}
                        </div>
                    </div>
                    
                    <p style="color: #999; font-size: 12px; margin-top: 30px;">
                        ⏰ This link will expire in 24 hours for security reasons.
                    </p>
                </div>
                <div class="footer">
                    <p>If you didn't create this account, please ignore this email.</p>
                    <p style="margin-top: 10px;">© 2024 MoodMunch. All rights reserved.</p>
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6; 
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f5f5f5;
                }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ 
                    background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0;
                }}
                .content {{ 
                    background: white; 
                    padding: 30px; 
                    border-radius: 0 0 10px 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .button {{ 
                    display: inline-block; 
                    background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%);
                    color: white !important; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px;
                    font-weight: bold; 
                    margin: 20px 0;
                }}
                .warning {{ 
                    background: #FEF3C7; 
                    padding: 15px; 
                    border-left: 4px solid #F59E0B; 
                    border-radius: 5px; 
                    margin: 20px 0;
                }}
                .url-box {{
                    background: #f5f5f5;
                    padding: 12px;
                    border-radius: 6px;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 12px;
                    color: #666;
                    margin-top: 10px;
                    border: 1px solid #ddd;
                }}
                .footer {{ 
                    text-align: center; 
                    color: #666; 
                    font-size: 14px; 
                    margin-top: 30px;
                    padding: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">🔐 Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2 style="color: #333; margin-top: 0;">Hi {name},</h2>
                    <p style="font-size: 16px;">
                        We received a request to reset your MoodMunch password.
                    </p>
                    <p style="font-size: 16px;">
                        Click the button below to create a new password:
                    </p>
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button" style="color: white;">
                            🔑 Reset Password
                        </a>
                    </div>
                    
                    <div class="warning">
                        <p style="margin: 0; font-size: 14px; color: #92400E;">
                            <strong>⚠️ Can't click the button?</strong> Copy this link:
                        </p>
                        <div class="url-box">{reset_url}</div>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>This link expires in 1 hour</li>
                            <li>If you didn't request this, ignore this email</li>
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
                .header {{ 
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 10px 10px 0 0;
                }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
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