# backend/main.py - WITHOUT ADMIN PANEL
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging
from datetime import datetime, timedelta
import os
import time
from pathlib import Path
from app.services.email_service import EmailService
from dotenv import load_dotenv
from fastapi.responses import HTMLResponse
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / '.env'
load_dotenv(dotenv_path=env_path)

from app.database.mongodb import get_database
from app.models.schemas import (
    UserCreate, UserResponse, UserLogin, RecipeRequest, RecipeResponse,
    VoiceIngredientRequest, IngredientExtractionResponse,
    MoodLog, UserProfile, RecipeHistory,
    DailyMoodCreate, EmailVerification,
    ResendVerification,
    PasswordResetRequest,
    PasswordReset,
    PasswordChange,
    RatingRequest
)
from app.services.auth_service import AuthService
from app.services.recipe_service import RecipeService
from app.services.voice_ingredient_service import VoiceIngredientService
from app.utils.exceptions import CustomException
from app.core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Global instances - lazy initialized
_auth_service = None
_recipe_service = None
_voice_service = None

def get_auth_service():
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service

async def get_recipe_service():
    global _recipe_service
    if _recipe_service is None:
        _recipe_service = RecipeService()
        await _recipe_service.initialize()
    return _recipe_service

async def get_voice_service():
    global _voice_service
    if _voice_service is None:
        _voice_service = VoiceIngredientService()
        await _voice_service.initialize()
    return _voice_service

security = HTTPBearer()

# Create app WITHOUT lifespan (Vercel doesn't support it)
app = FastAPI(
    title="MoodMunch - AI Recipe Recommendation System",
    description="Backend API for personalized recipe recommendations with voice input",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://moodmunch.vercel.app",
        "https://*.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle CORS preflight requests"""
    return {"status": "ok"}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user ID"""
    try:
        auth_service = get_auth_service()
        token = credentials.credentials
        user_id = auth_service.verify_token(token)
        return user_id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ============== HEALTH CHECK ==============

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """System health check with stats"""
    try:
        db = await get_database()
        db_healthy = await db.health_check()
        
        gemini_configured = bool(
            settings.GEMINI_API_KEY and 
            settings.GEMINI_API_KEY != "your-gemini-api-key-here"
        )
        
        total_recipes = await db.database.recipe_history.count_documents({})
        total_users = await db.database.users.count_documents({"is_active": True})
        
        pipeline = [
            {"$match": {"rating": {"$exists": True, "$ne": None}}},
            {"$group": {
                "_id": None,
                "average_rating": {"$avg": "$rating"},
                "total_ratings": {"$sum": 1}
            }}
        ]
        
        rating_cursor = db.database.recipe_history.aggregate(pipeline)
        rating_data = await rating_cursor.to_list(length=1)
        
        if rating_data and len(rating_data) > 0 and rating_data[0].get("total_ratings", 0) > 0:
            average_rating = round(rating_data[0]["average_rating"], 1)
        else:
            average_rating = 4.9
        
        logger.info(f"Health check - Recipes: {total_recipes}, Users: {total_users}, Rating: {average_rating}")
        
        return {
            "status": "healthy" if db_healthy else "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0.0",
            "checks": {
                "database": "connected" if db_healthy else "disconnected",
                "gemini_ai": "configured" if gemini_configured else "not_configured",
                "voice_input": settings.ENABLE_VOICE_INPUT
            },
            "stats": {
                "total_recipes": total_recipes,
                "total_users": total_users,
                "average_rating": average_rating
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e),
            "stats": {
                "total_recipes": 0,
                "total_users": 0,
                "average_rating": 4.9
            }
        }

# ============== AUTHENTICATION ==============

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db = Depends(get_database)):
    """Register a new user"""
    try:
        auth_service = get_auth_service()
        user = await auth_service.create_user(user_data, db)
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            dietary_preferences=user["dietary_preferences"],
            allergies=user["allergies"],
            health_goals=user["health_goals"],
            created_at=user["created_at"]
        )
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login_user(user_credentials: UserLogin, db = Depends(get_database)):
    """Login user and get access token"""
    try:
        auth_service = get_auth_service()
        result = await auth_service.authenticate_user(user_credentials, db)
        return result
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/verify-email")
async def verify_email(data: EmailVerification, db = Depends(get_database)):
    """Verify user email with token"""
    try:
        auth_service = get_auth_service()
        result = await auth_service.verify_email(data.token, db)
        return result
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/resend-verification")
async def resend_verification(data: ResendVerification, db = Depends(get_database)):
    """Resend verification email"""
    try:
        auth_service = get_auth_service()
        await auth_service.resend_verification_email(data.email, db)
        return {
            "message": "If an account exists with this email, a verification link has been sent."
        }
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/forgot-password")
async def forgot_password(data: PasswordResetRequest, db = Depends(get_database)):
    """Request password reset email"""
    try:
        auth_service = get_auth_service()
        await auth_service.request_password_reset(data.email, db)
        return {
            "message": "If an account exists with this email, password reset instructions have been sent."
        }
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        return {
            "message": "If an account exists with this email, password reset instructions have been sent."
        }

@app.post("/auth/reset-password")
async def reset_password(data: PasswordReset, db = Depends(get_database)):
    """Reset password with token"""
    try:
        auth_service = get_auth_service()
        success = await auth_service.reset_password(data.token, data.new_password, db)
        if success:
            return {
                "message": "Password reset successful. You can now login with your new password."
            }
        else:
            raise HTTPException(status_code=400, detail="Password reset failed")
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/change-password")
async def change_password(
    data: PasswordChange,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Change password (when logged in)"""
    try:
        auth_service = get_auth_service()
        success = await auth_service.change_password(
            current_user,
            data.current_password,
            data.new_password,
            db
        )
        if success:
            return {"message": "Password changed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Password change failed")
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== INGREDIENT EXTRACTION ==============

@app.post("/ingredients/extract-from-audio", response_model=IngredientExtractionResponse)
async def extract_ingredients_from_audio(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """Extract ingredients from voice/audio input"""
    temp_path = None
    try:
        voice_service = await get_voice_service()
        start_time = time.time()
        
        if not file.content_type or not file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be audio")
        
        content = await file.read()
        if len(content) > settings.MAX_AUDIO_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large")
        
        os.makedirs('/tmp/audio', exist_ok=True)
        temp_path = f'/tmp/audio/{current_user}_{int(time.time())}.wav'
        
        with open(temp_path, 'wb') as f:
            f.write(content)
        
        ingredients = await voice_service.transcribe_and_extract_ingredients(temp_path)
        validation_result = await voice_service.validate_ingredients(ingredients)
        
        processing_time = time.time() - start_time
        
        return IngredientExtractionResponse(
            ingredients=ingredients,
            validated_ingredients=validation_result["validated_ingredients"],
            suggestions=validation_result["suggestions"],
            processing_time=round(processing_time, 2),
            source="audio",
            confidence=0.90
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@app.post("/ingredients/extract-from-text", response_model=IngredientExtractionResponse)
async def extract_ingredients_from_text(
    request: VoiceIngredientRequest,
    current_user: str = Depends(get_current_user)
):
    """Extract ingredients from text input"""
    try:
        voice_service = await get_voice_service()
        start_time = time.time()
        
        ingredients = await voice_service.extract_from_text(request.text)
        validation_result = await voice_service.validate_ingredients(ingredients)
        
        processing_time = time.time() - start_time
        
        return IngredientExtractionResponse(
            ingredients=ingredients,
            validated_ingredients=validation_result["validated_ingredients"],
            suggestions=validation_result["suggestions"],
            transcription=request.text,
            processing_time=round(processing_time, 2),
            source="text",
            confidence=0.90
        )
    except Exception as e:
        logger.error(f"Text extraction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== RECIPE GENERATION ==============

@app.post("/recipes/generate", response_model=RecipeResponse)
async def generate_recipe(
    recipe_request: RecipeRequest,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Generate personalized recipe"""
    try:
        recipe_service = await get_recipe_service()
        
        user = await db.get_user_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        recipe = await recipe_service.generate_recipe(
            ingredients=recipe_request.ingredients,
            mood=recipe_request.mood,
            dietary_preferences=user.get("dietary_preferences", []),
            allergies=user.get("allergies", []),
            health_goals=user.get("health_goals", []),
            cuisine_preference=recipe_request.cuisine_preference
        )
        
        recipe_history = {
            "user_id": current_user,
            "recipe": recipe.dict(),
            "ingredients_used": recipe_request.ingredients,
            "mood": recipe_request.mood.value,
            "input_method": "voice",
            "created_at": datetime.utcnow()
        }
        
        await db.save_recipe_history(recipe_history)
        
        await db.save_mood_log({
            "user_id": current_user,
            "mood": recipe_request.mood.value,
            "timestamp": datetime.utcnow()
        })
        
        return recipe
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Recipe generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Continue with remaining endpoints (recipes, users, analytics, mood)...
# (Include all the other endpoints from the original file)

# ============== RECIPE HISTORY ==============

@app.get("/recipes/history")
async def get_recipe_history(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database),
    limit: int = 10,
    skip: int = 0
):
    """Get user's recipe history"""
    try:
        history = await db.get_recipe_history(current_user, limit, skip)
        
        for item in history:
            if "_id" in item:
                item["_id"] = str(item["_id"])
            if "recipe" in item and "_id" in item["recipe"]:
                item["recipe"]["_id"] = str(item["recipe"]["_id"])
        
        return {
            "recipes": history,
            "total": len(history),
            "limit": limit,
            "skip": skip,
            "has_more": len(history) == limit
        }
    except Exception as e:
        logger.error(f"Get history error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recipes/history/{recipe_id}")
async def get_recipe_by_id(
    recipe_id: str,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get specific recipe"""
    try:
        from bson import ObjectId
        
        recipe = await db.database.recipe_history.find_one({
            "_id": ObjectId(recipe_id),
            "user_id": current_user
        })
        
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        recipe["_id"] = str(recipe["_id"])
        return recipe
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get recipe error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/recipes/history/{recipe_id}")
async def delete_recipe(
    recipe_id: str,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Delete recipe"""
    try:
        from bson import ObjectId
        
        result = await db.database.recipe_history.delete_one({
            "_id": ObjectId(recipe_id),
            "user_id": current_user
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return {"message": "Recipe deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete recipe error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== FAVORITES ==============

@app.post("/recipes/{recipe_id}/favorite")
async def toggle_favorite_recipe(
    recipe_id: str,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Toggle favorite"""
    try:
        is_favorited = await db.toggle_favorite_recipe(current_user, recipe_id)
        return {
            "recipe_id": recipe_id,
            "is_favorited": is_favorited,
            "message": "Added to favorites" if is_favorited else "Removed from favorites"
        }
    except Exception as e:
        logger.error(f"Toggle favorite error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recipes/favorites")
async def get_favorite_recipes(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get favorites"""
    try:
        from bson import ObjectId
        
        favorite_cursor = db.database.favorites.find({"user_id": current_user})
        favorite_docs = await favorite_cursor.to_list(length=None)
        
        if not favorite_docs:
            return {"favorites": [], "total": 0}
        
        recipe_ids = []
        for doc in favorite_docs:
            try:
                recipe_id = doc.get("recipe_id")
                if recipe_id:
                    recipe_ids.append(ObjectId(recipe_id) if isinstance(recipe_id, str) else recipe_id)
            except:
                continue
        
        if not recipe_ids:
            return {"favorites": [], "total": 0}
        
        recipe_cursor = db.database.recipe_history.find({"_id": {"$in": recipe_ids}})
        recipes = await recipe_cursor.to_list(length=None)
        
        for recipe in recipes:
            if "_id" in recipe:
                recipe["_id"] = str(recipe["_id"])
        
        return {"favorites": recipes, "total": len(recipes)}
    except Exception as e:
        logger.error(f"Get favorites error: {str(e)}")
        return {"favorites": [], "total": 0, "error": str(e)}

# ============== USER PROFILE ==============

@app.get("/users/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get current user profile"""
    try:
        user = await db.get_user_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            dietary_preferences=user.get("dietary_preferences", []),
            allergies=user.get("allergies", []),
            health_goals=user.get("health_goals", []),
            created_at=user["created_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/users/me")
async def update_user_profile(
    profile_update: UserProfile,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Update user profile"""
    try:
        update_data = profile_update.dict(exclude_unset=True)
        
        if "dietary_preferences" in update_data:
            update_data["dietary_preferences"] = [
                pref.value if hasattr(pref, 'value') else pref 
                for pref in update_data["dietary_preferences"]
            ]
        
        if "health_goals" in update_data:
            update_data["health_goals"] = [
                goal.value if hasattr(goal, 'value') else goal 
                for goal in update_data["health_goals"]
            ]
        
        updated_user = await db.update_user_profile(current_user, update_data)
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "message": "Profile updated",
            "user": {
                "id": str(updated_user["_id"]),
                "email": updated_user["email"],
                "name": updated_user["name"],
                "dietary_preferences": updated_user.get("dietary_preferences", []),
                "allergies": updated_user.get("allergies", []),
                "health_goals": updated_user.get("health_goals", [])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============== ANALYTICS ==============

@app.get("/analytics/dashboard")
async def get_user_dashboard(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get dashboard data"""
    try:
        history = await db.get_recipe_history(current_user, limit=100)
        mood_trends = await db.get_mood_trends(current_user, days=30)
        ingredient_stats = await db.get_ingredient_usage_stats(current_user)
        
        favorites_cursor = db.database.favorites.find({"user_id": current_user})
        favorites = await favorites_cursor.to_list(length=None)
        
        total_recipes = len(history)
        
        cuisine_counts = {}
        for recipe_doc in history:
            recipe = recipe_doc.get("recipe", {})
            if recipe:
                cuisine = recipe.get("cuisine_type", "unknown")
                cuisine_counts[cuisine] = cuisine_counts.get(cuisine, 0) + 1
        
        most_used_cuisine = max(cuisine_counts.items(), key=lambda x: x[1])[0] if cuisine_counts else None
        
        cooking_times = [
            recipe_doc.get("recipe", {}).get("total_time", 0) 
            for recipe_doc in history 
            if recipe_doc.get("recipe", {}).get("total_time")
        ]
        avg_cooking_time = sum(cooking_times) / len(cooking_times) if cooking_times else 0
        
        recent_recipes = [
            {
                "id": str(recipe_doc.get("_id")),
                "title": recipe_doc.get("recipe", {}).get("title", "Unknown"),
                "created_at": recipe_doc.get("created_at"),
                "mood": recipe_doc.get("mood")
            }
            for recipe_doc in history[:5]
        ]
        
        return {
            "total_recipes_generated": total_recipes,
            "total_favorites": len(favorites),
            "mood_trends_count": len(mood_trends),
            "unique_ingredients_used": len(ingredient_stats),
            "most_used_cuisine": most_used_cuisine,
            "avg_cooking_time_minutes": round(avg_cooking_time, 1),
            "top_ingredients": ingredient_stats[:10],
            "recent_recipes": recent_recipes
        }
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/mood-trends")
async def get_mood_trends(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database),
    days: int = 30
):
    """Get mood trends"""
    try:
        trends = await db.get_mood_trends(current_user, days)
        return {
            "trends": trends,
            "period_days": days,
            "total_entries": len(trends)
        }
    except Exception as e:
        logger.error(f"Mood trends error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/ingredient-stats")
async def get_ingredient_statistics(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get ingredient stats"""
    try:
        stats = await db.get_ingredient_usage_stats(current_user)
        return {
            "ingredients": stats,
            "total_unique_ingredients": len(stats)
        }
    except Exception as e:
        logger.error(f"Ingredient stats error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    # backend/main.py - ADD THESE ENDPOINTS (add after existing endpoints)

# ============== DAILY MOOD TRACKING ==============

@app.post("/mood/daily-log")
async def log_daily_mood(
    mood_data: DailyMoodCreate,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Log daily mood with detailed metrics"""
    try:
        mood_log = {
            "user_id": current_user,
            "mood": mood_data.mood.value,
            "energy_level": mood_data.energy_level,
            "meal_preference": mood_data.meal_preference,
            "emotional_state": mood_data.emotional_state,
            "timestamp": datetime.utcnow()
        }
        
        result = await db.database.daily_mood_logs.insert_one(mood_log)
        
        return {
            "message": "Mood logged successfully",
            "log_id": str(result.inserted_id),
            "mood": mood_data.mood.value,
            "timestamp": mood_log["timestamp"].isoformat()
        }
    except Exception as e:
        logger.error(f"Error logging mood: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mood/insights")
async def get_mood_insights(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database),
    days: int = 30
):
    """Get comprehensive mood insights"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get all mood logs for the period
        logs_cursor = db.database.daily_mood_logs.find({
            "user_id": current_user,
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", -1)
        
        logs = await logs_cursor.to_list(length=None)
        
        if not logs:
            return {
                "message": "No mood data available yet",
                "total_logs": 0
            }
        
        # Calculate insights
        moods = [log["mood"] for log in logs]
        energy_levels = [log["energy_level"] for log in logs]
        meal_prefs = [log["meal_preference"] for log in logs]
        
        from collections import Counter
        mood_counter = Counter(moods)
        meal_counter = Counter(meal_prefs)
        
        # Get logs from last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        logs_this_week = [log for log in logs if log["timestamp"] >= week_ago]
        
        # Calculate energy trend
        if len(energy_levels) >= 2:
            recent_avg = sum(energy_levels[:len(energy_levels)//2]) / (len(energy_levels)//2)
            older_avg = sum(energy_levels[len(energy_levels)//2:]) / (len(energy_levels) - len(energy_levels)//2)
            
            if recent_avg > older_avg + 1:
                energy_trend = "increasing"
            elif recent_avg < older_avg - 1:
                energy_trend = "decreasing"
            else:
                energy_trend = "stable"
        else:
            energy_trend = "not_enough_data"
        
        return {
            "most_common_mood": mood_counter.most_common(1)[0][0],
            "average_energy_level": round(sum(energy_levels) / len(energy_levels), 1),
            "preferred_meal_type": meal_counter.most_common(1)[0][0],
            "total_logs": len(logs),
            "logs_this_week": len(logs_this_week),
            "energy_trend": energy_trend,
            "mood_distribution": dict(mood_counter),
            "meal_distribution": dict(meal_counter)
        }
    except Exception as e:
        logger.error(f"Error getting mood insights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mood/history")
async def get_mood_history(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database),
    days: int = 30,
    limit: int = 100
):
    """Get mood history for the user"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        logs_cursor = db.database.daily_mood_logs.find({
            "user_id": current_user,
            "timestamp": {"$gte": start_date}
        }).sort("timestamp", -1).limit(limit)
        
        logs = await logs_cursor.to_list(length=limit)
        
        # Format for frontend
        formatted_logs = []
        for log in logs:
            formatted_logs.append({
                "date": log["timestamp"].strftime("%Y-%m-%d"),
                "time": log["timestamp"].strftime("%H:%M"),
                "mood": log["mood"],
                "energy_level": log["energy_level"],
                "meal_preference": log.get("meal_preference", ""),
                "emotional_state": log.get("emotional_state", "")
            })
        
        return {
            "logs": formatted_logs,
            "total": len(formatted_logs),
            "period_days": days
        }
    except Exception as e:
        logger.error(f"Error getting mood history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mood/today")
async def get_todays_mood(
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Check if user has logged mood today"""
    try:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        today_log = await db.database.daily_mood_logs.find_one({
            "user_id": current_user,
            "timestamp": {"$gte": today_start}
        })
        
        if today_log:
            return {
                "logged_today": True,
                "mood": today_log["mood"],
                "energy_level": today_log["energy_level"],
                "meal_preference": today_log.get("meal_preference", ""),
                "emotional_state": today_log.get("emotional_state", ""),
                "timestamp": today_log["timestamp"].isoformat()
            }
        else:
            return {
                "logged_today": False,
                "message": "No mood logged today yet"
            }
    except Exception as e:
        logger.error(f"Error checking today's mood: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/auth/verify-email")
async def verify_email(data: EmailVerification, db = Depends(get_database)):
    """Verify user email with token"""
    try:
        auth_service = get_auth_service()
        result = await auth_service.verify_email(data.token, db)
        return result
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/resend-verification")
async def resend_verification(data: ResendVerification, db = Depends(get_database)):
    """Resend verification email"""
    try:
        auth_service = get_auth_service()
        await auth_service.resend_verification_email(data.email, db)
        return {
            "message": "If an account exists with this email, a verification link has been sent."
        }
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Resend verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/forgot-password")
async def forgot_password(data: PasswordResetRequest, db = Depends(get_database)):
    """Request password reset email"""
    try:
        auth_service = get_auth_service()
        await auth_service.request_password_reset(data.email, db)
        return {
            "message": "If an account exists with this email, password reset instructions have been sent."
        }
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        # Always return success to avoid email enumeration
        return {
            "message": "If an account exists with this email, password reset instructions have been sent."
        }

@app.post("/auth/reset-password")
async def reset_password(data: PasswordReset, db = Depends(get_database)):
    """Reset password with token"""
    try:
        auth_service = get_auth_service()
        success = await auth_service.reset_password(data.token, data.new_password, db)
        if success:
            return {
                "message": "Password reset successful. You can now login with your new password."
            }
        else:
            raise HTTPException(status_code=400, detail="Password reset failed")
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/change-password")
async def change_password(
    data: PasswordChange,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Change password (when logged in)"""
    try:
        auth_service = get_auth_service()
        success = await auth_service.change_password(
            current_user,
            data.current_password,
            data.new_password,
            db
        )
        if success:
            return {"message": "Password changed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Password change failed")
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Change password error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# ============== PUBLIC STATS ENDPOINT ==============

@app.get("/api/public/stats")
async def get_public_stats(db = Depends(get_database)):
    """Get public statistics for landing page - NO AUTH REQUIRED"""
    try:
        # Get total recipes count
        total_recipes = await db.database.recipe_history.count_documents({})
        
        # Get total users count
        total_users = await db.database.users.count_documents({"is_active": True})
        
        # Calculate average rating from recipe history
        pipeline = [
            {"$match": {"rating": {"$exists": True, "$ne": None}}},
            {"$group": {
                "_id": None,
                "average_rating": {"$avg": "$rating"},
                "total_ratings": {"$sum": 1}
            }}
        ]
        
        rating_cursor = db.database.recipe_history.aggregate(pipeline)
        rating_data = await rating_cursor.to_list(length=1)
        
        if rating_data and len(rating_data) > 0 and rating_data[0].get("total_ratings", 0) > 0:
            average_rating = round(rating_data[0]["average_rating"], 1)
        else:
            # If no ratings yet, use default
            average_rating = 4.9
        
        logger.info(f"Public stats - Recipes: {total_recipes}, Users: {total_users}, Rating: {average_rating}")
        
        return {
            "total_recipes": total_recipes,
            "total_users": total_users,
            "average_rating": average_rating,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching public stats: {str(e)}")
        # Return reasonable defaults if error
        return {
            "total_recipes": 0,
            "total_users": 0,
            "average_rating": 4.9,
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }
# ============== RECIPE RATING ==============

@app.post("/recipes/history/{recipe_id}/rate")
async def rate_recipe(
    recipe_id: str,
    rating_data: RatingRequest,
    current_user: str = Depends(get_current_user),
    db = Depends(get_database)
):
    """Rate a recipe (1-5 stars)"""
    try:
        from bson import ObjectId
        
        rating = rating_data.rating
        
        result = await db.database.recipe_history.update_one(
            {
                "_id": ObjectId(recipe_id),
                "user_id": current_user
            },
            {
                "$set": {
                    "rating": rating,
                    "rated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return {
            "message": "Recipe rated successfully",
            "recipe_id": recipe_id,
            "rating": rating
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rate recipe error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
# backend/main.py - ADD THIS ENDPOINT (add after the existing POST endpoint)

# EXISTING POST endpoint (keep this)
@app.post("/auth/verify-email")
async def verify_email(data: EmailVerification, db = Depends(get_database)):
    """Verify user email with token (POST)"""
    try:
        auth_service = get_auth_service()
        result = await auth_service.verify_email(data.token, db)
        return result
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Add GET endpoint for email links
@app.get("/auth/verify-email")
async def verify_email_get(token: str, db = Depends(get_database)):
    """Verify user email with token (GET - for email links)"""
    try:
        auth_service = get_auth_service()
        result = await auth_service.verify_email(token, db)
        
        # Return HTML redirect for better UX
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta http-equiv="refresh" content="0;url={os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={token}&success=true">
            <title>Email Verified - MoodMunch</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8eaf6 100%);
                }}
                .container {{
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    max-width: 400px;
                }}
                .spinner {{
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #D946A6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }}
                @keyframes spin {{
                    0% {{ transform: rotate(0deg); }}
                    100% {{ transform: rotate(360deg); }}
                }}
                h1 {{
                    color: #D946A6;
                    margin-bottom: 10px;
                }}
                p {{
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="spinner"></div>
                <h1>✅ Email Verified!</h1>
                <p>Redirecting you to MoodMunch...</p>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">
                    If you're not redirected, <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/login">click here</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
        
    except CustomException as e:
        # Return error HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta http-equiv="refresh" content="3;url={os.getenv('FRONTEND_URL', 'http://localhost:3000')}/resend-verification">
            <title>Verification Error - MoodMunch</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8eaf6 100%);
                }}
                .container {{
                    text-align: center;
                    padding: 40px;
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    max-width: 400px;
                }}
                h1 {{
                    color: #EF4444;
                    margin-bottom: 10px;
                }}
                p {{
                    color: #666;
                    margin-bottom: 20px;
                }}
                .btn {{
                    display: inline-block;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #D946A6 0%, #9333EA 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 10px;
                    font-weight: 600;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>❌ Verification Failed</h1>
                <p>{e.detail}</p>
                <p style="font-size: 14px; color: #999;">Redirecting to request a new link...</p>
                <a href="{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/resend-verification" class="btn">
                    Request New Link
                </a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=e.status_code)
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

