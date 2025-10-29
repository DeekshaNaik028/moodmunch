# backend/main.py - SERVERLESS OPTIMIZED
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from datetime import datetime
import os
import time
from pathlib import Path

from app.database.mongodb import get_database
from app.models.schemas import (
    UserCreate, UserResponse, UserLogin, RecipeRequest, RecipeResponse,
    VoiceIngredientRequest, IngredientExtractionResponse,
    MoodLog, UserProfile, RecipeHistory
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

# CORS Configuration - FIXED for Production
allowed_origins = settings.ALLOWED_ORIGINS if hasattr(settings, 'ALLOWED_ORIGINS') else [
    "https://moodmunch.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

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
    """System health check"""
    try:
        db = await get_database()
        db_healthy = await db.health_check()
        
        gemini_configured = bool(
            settings.GEMINI_API_KEY and 
            settings.GEMINI_API_KEY != "your-gemini-api-key-here"
        )
        
        return {
            "status": "healthy" if db_healthy else "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0.0",
            "checks": {
                "database": "connected" if db_healthy else "disconnected",
                "gemini_ai": "configured" if gemini_configured else "not_configured",
                "voice_input": settings.ENABLE_VOICE_INPUT
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "MoodMunch API",
        "version": "2.0.0",
        "status": "running"
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
        
        # Save temporarily in /tmp (Vercel provides this)
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
        
        # Save to history
        recipe_history = {
            "user_id": current_user,
            "recipe": recipe.dict(),
            "ingredients_used": recipe_request.ingredients,
            "mood": recipe_request.mood.value,
            "input_method": "voice",
            "created_at": datetime.utcnow()
        }
        
        await db.save_recipe_history(recipe_history)
        
        # Log mood
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