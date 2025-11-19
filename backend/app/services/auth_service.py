# backend/app/services/auth_service.py - ENHANCED VERSION
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

from app.models.schemas import UserCreate, UserLogin, Token
from app.database.mongodb import MongoDB
from app.core.config import get_settings
from app.utils.exceptions import CustomException
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.settings = get_settings()
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 60 * 24  # 24 hours
        self.email_service = EmailService()
    
    def _hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def _verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    def _create_access_token(self, user_id: str) -> Dict[str, Any]:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode = {
            "user_id": user_id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        encoded_jwt = jwt.encode(
            to_encode, 
            self.settings.SECRET_KEY, 
            algorithm=self.algorithm
        )
        
        return {
            "access_token": encoded_jwt,
            "token_type": "bearer",
            "expires_in": self.access_token_expire_minutes * 60,
            "expires_at": expire.isoformat()
        }
    
    def verify_token(self, token: str) -> str:
        """Verify JWT token and return user_id"""
        try:
            payload = jwt.decode(
                token, 
                self.settings.SECRET_KEY, 
                algorithms=[self.algorithm]
            )
            
            user_id = payload.get("user_id")
            if user_id is None:
                raise CustomException(status_code=401, detail="Invalid token")
            
            exp = payload.get("exp")
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                raise CustomException(status_code=401, detail="Token expired")
            
            return user_id
            
        except jwt.ExpiredSignatureError:
            raise CustomException(status_code=401, detail="Token expired")
        except jwt.JWTError:
            raise CustomException(status_code=401, detail="Invalid token")
    
    async def create_user(self, user_data: UserCreate, db: MongoDB) -> Dict[str, Any]:
        """Create a new user account with email verification"""
        try:
            existing_user = await db.get_user_by_email(user_data.email)
            if existing_user:
                raise CustomException(status_code=400, detail="Email already registered")
            
            hashed_password = self._hash_password(user_data.password)
            
            # Generate verification token
            verification_token = self.email_service.generate_verification_token()
            verification_expires = datetime.utcnow() + timedelta(hours=24)
            
            user_doc = {
                "name": user_data.name,
                "email": user_data.email,
                "hashed_password": hashed_password,
                "dietary_preferences": [pref.value for pref in user_data.dietary_preferences],
                "allergies": user_data.allergies,
                "health_goals": [goal.value for goal in user_data.health_goals],
                "email_verified": False,
                "verification_token": verification_token,
                "verification_token_expires": verification_expires,
            }
            
            created_user = await db.create_user(user_doc)
            
            # Send verification email
            email_sent = self.email_service.send_verification_email(
                email=user_data.email,
                name=user_data.name,
                token=verification_token
            )
            
            if not email_sent:
                logger.warning(f"Failed to send verification email to {user_data.email}")
            
            logger.info(f"New user created: {user_data.email} (verification pending)")
            return created_user
            
        except CustomException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise CustomException(status_code=500, detail="Failed to create user")
    
    async def verify_email(self, token: str, db: MongoDB) -> Dict[str, Any]:
        """Verify user email with token"""
        try:
            # Find user with this verification token
            user = await db.database.users.find_one({
                "verification_token": token,
                "email_verified": False
            })
            
            if not user:
                raise CustomException(
                    status_code=400, 
                    detail="Invalid or expired verification link"
                )
            
            # Check if token expired
            if user.get("verification_token_expires") < datetime.utcnow():
                raise CustomException(
                    status_code=400, 
                    detail="Verification link has expired. Please request a new one."
                )
            
            # Update user as verified
            await db.database.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "email_verified": True,
                        "updated_at": datetime.utcnow()
                    },
                    "$unset": {
                        "verification_token": "",
                        "verification_token_expires": ""
                    }
                }
            )
            
            logger.info(f"Email verified: {user['email']}")
            
            return {
                "message": "Email verified successfully",
                "email": user["email"]
            }
            
        except CustomException:
            raise
        except Exception as e:
            logger.error(f"Error verifying email: {str(e)}")
            raise CustomException(status_code=500, detail="Email verification failed")
    
    async def resend_verification_email(self, email: str, db: MongoDB) -> bool:
        """Resend verification email"""
        try:
            user = await db.get_user_by_email(email)
            
            if not user:
                # Don't reveal if email exists
                return True
            
            if user.get("email_verified"):
                raise CustomException(status_code=400, detail="Email already verified")
            
            # Generate new token
            verification_token = self.email_service.generate_verification_token()
            verification_expires = datetime.utcnow() + timedelta(hours=24)
            
            await db.database.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "verification_token": verification_token,
                        "verification_token_expires": verification_expires,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Send email
            self.email_service.send_verification_email(
                email=email,
                name=user["name"],
                token=verification_token
            )
            
            logger.info(f"Verification email resent to {email}")
            return True
            
        except CustomException:
            raise
        except Exception as e:
            logger.error(f"Error resending verification: {str(e)}")
            raise CustomException(status_code=500, detail="Failed to resend verification email")
    
    async def authenticate_user(self, credentials: UserLogin, db: MongoDB) -> Dict[str, Any]:
        """Authenticate user and return access token"""
        try:
            user = await db.get_user_by_email(credentials.email)
            if not user:
                raise CustomException(status_code=401, detail="Invalid email or password")
            
            if not self._verify_password(credentials.password, user["hashed_password"]):
                raise CustomException(status_code=401, detail="Invalid email or password")
            
            if not user.get("is_active", True):
                raise CustomException(status_code=401, detail="Account is deactivated")
            
            # Check if email is verified
            if not user.get("email_verified", False):
                raise CustomException(
                    status_code=403, 
                    detail="Please verify your email before logging in. Check your inbox for the verification link."
                )
            
            token_data = self._create_access_token(str(user["_id"]))
            
            await db.database.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.utcnow()}}
            )
            
            response = {
                **token_data,
                "user": {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "name": user["name"],
                    "dietary_preferences": user.get("dietary_preferences", []),
                    "allergies": user.get("allergies", []),
                    "health_goals": user.get("health_goals", []),
                    "email_verified": user.get("email_verified", False)
                }
            }
            
            logger.info(f"User authenticated: {credentials.email}")
            return response
            
        except CustomException:
            raise
        except Exception as e:
            logger.error(f"Error authenticating user: {str(e)}")
            raise CustomException(status_code=500, detail="Authentication failed")
    
    async def request_password_reset(self, email: str, db: MongoDB) -> bool:
        """Generate and send password reset token"""
        try:
            user = await db.get_user_by_email(email)
            
            # Don't reveal if user exists (security best practice)
            if not user:
                logger.info(f"Password reset requested for non-existent email: {email}")
                return True
            
            # Generate reset token
            reset_token = self.email_service.generate_verification_token()
            reset_expires = datetime.utcnow() + timedelta(hours=1)
            
            await db.database.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "password_reset_token": reset_token,
                        "password_reset_expires": reset_expires,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Send reset email
            self.email_service.send_password_reset_email(
                email=email,
                name=user["name"],
                token=reset_token
            )
            
            logger.info(f"Password reset email sent to {email}")
            return True
            
        except Exception as e:
            logger.error(f"Error requesting password reset: {str(e)}")
            # Don't throw error to avoid revealing email existence
            return True
    
    async def reset_password(self, token: str, new_password: str, db: MongoDB) -> bool:
        """Reset password using token"""
        try:
            if len(new_password) < 8:
                raise CustomException(
                    status_code=400, 
                    detail="Password must be at least 8 characters"
                )
            
            # Find user with this reset token
            user = await db.database.users.find_one({
                "password_reset_token": token
            })
            
            if not user:
                raise CustomException(
                    status_code=400, 
                    detail="Invalid or expired reset link"
                )
            
            # Check if token expired
            if user.get("password_reset_expires") < datetime.utcnow():
                raise CustomException(
                    status_code=400, 
                    detail="Reset link has expired. Please request a new one."
                )
            
            # Hash new password
            new_hashed_password = self._hash_password(new_password)
            
            # Update password and remove reset token
            await db.database.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "hashed_password": new_hashed_password,
                        "updated_at": datetime.utcnow(),
                        "password_changed_at": datetime.utcnow()
                    },
                    "$unset": {
                        "password_reset_token": "",
                        "password_reset_expires": ""
                    }
                }
            )
            
            # Send confirmation email
            self.email_service.send_password_changed_notification(
                email=user["email"],
                name=user["name"]
            )
            
            logger.info(f"Password reset successful for {user['email']}")
            return True
            
        except CustomException:
            raise
        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}")
            raise CustomException(status_code=500, detail="Password reset failed")
    
    async def change_password(self, user_id: str, current_password: str, new_password: str, db: MongoDB) -> bool:
        """Change user password (when logged in)"""
        try:
            user = await db.get_user_by_id(user_id)
            if not user:
                raise CustomException(status_code=404, detail="User not found")
            
            if not self._verify_password(current_password, user["hashed_password"]):
                raise CustomException(status_code=400, detail="Current password is incorrect")
            
            if len(new_password) < 8:
                raise CustomException(status_code=400, detail="Password must be at least 8 characters")
            
            new_hashed_password = self._hash_password(new_password)
            
            await db.database.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "hashed_password": new_hashed_password,
                        "updated_at": datetime.utcnow(),
                        "password_changed_at": datetime.utcnow()
                    }
                }
            )
            
            # Send notification
            self.email_service.send_password_changed_notification(
                email=user["email"],
                name=user["name"]
            )
            
            logger.info(f"Password changed for user: {user_id}")
            return True
            
        except CustomException:
            raise
        except Exception as e:
            logger.error(f"Error changing password: {str(e)}")
            raise CustomException(status_code=500, detail="Failed to change password")