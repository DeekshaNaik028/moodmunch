# backend/main.py
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional
import logging
from datetime import datetime
import os
import time
from pathlib import Path

from app.database.mongodb import MongoDB, get_database
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
auth_service = AuthService()
recipe_service = RecipeService()
voice_service = VoiceIngredientService()
security = HTTPBearer()

# Ensure upload directories exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.AUDIO_UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("🚀 Starting MoodMunch Recipe Recommendation System...")
    db = MongoDB()
    await db.connect()
    logger.info("✅ Database connected successfully")
    await voice_service.initialize()
    logger.info("✅ Voice service initialized")
    await recipe_service.initialize()
    logger.info("✅ Recipe service initialized")
    logger.info("✨ System ready! API available at http://localhost:8000")
    logger.info("📖 API Documentation: http://localhost:8000/docs")
    yield
    logger.info("👋 Shutting down...")
    await db.close()
    logger.info("✅ Cleanup complete")

app = FastAPI(
    title="MoodMunch - AI Recipe Recommendation System",
    description="Backend API for personalized recipe recommendations with voice input",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
logger.info(f"CORS enabled for: {', '.join(settings.ALLOWED_ORIGINS)}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user ID"""
    try:
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
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "2.0.0",
        "features": {
            "voice_input": settings.ENABLE_VOICE_INPUT,
            "recipe_generation": True,
            "user_authentication": True
        }
    }

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "MoodMunch - AI Recipe Recommendation System API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# ============== AUTHENTICATION ==============

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: MongoDB = Depends(get_database)):
    """Register a new user"""
    try:
        user = await auth_service.create_user(user_data, db)
        logger.info(f"New user registered: {user_data.email}")
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
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/auth/login")
async def login_user(user_credentials: UserLogin, db: MongoDB = Depends(get_database)):
    """Login user and get access token"""
    try:
        result = await auth_service.authenticate_user(user_credentials, db)
        logger.info(f"User logged in: {user_credentials.email}")
        return result
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ============== INGREDIENT EXTRACTION ==============

@app.post("/ingredients/extract-from-audio", response_model=IngredientExtractionResponse)
async def extract_ingredients_from_audio(
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    """Extract ingredients from voice/audio input"""
    temp_path = None
    try:
        start_time = time.time()
        
        if not file.content_type or not file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400, 
                detail="File must be an audio file (wav, mp3, ogg, webm, m4a)"
            )
        
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_AUDIO_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds maximum ({settings.MAX_AUDIO_FILE_SIZE} bytes)"
            )
        
        if file_size < 1000:
            raise HTTPException(
                status_code=400,
                detail="Audio file is too small. Please record a longer message."
            )
        
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'wav'
        temp_filename = f"{current_user}_{int(time.time())}.{file_extension}"
        temp_path = os.path.join(settings.AUDIO_UPLOAD_DIR, temp_filename)
        
        with open(temp_path, 'wb') as f:
            f.write(content)
        
        logger.info(f"Processing audio: {temp_filename} ({file_size/1024:.1f}KB)")
        
        try:
            ingredients = await voice_service.transcribe_and_extract_ingredients(temp_path)
        except Exception as e:
            logger.error(f"Gemini AI processing failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process audio with AI: {str(e)}. Please try again or use text input."
            )
        
        validation_result = await voice_service.validate_ingredients(ingredients)
        
        processing_time = time.time() - start_time
        
        logger.info(f"✅ Extracted {len(ingredients)} ingredients in {processing_time:.2f}s")
        
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
        logger.error(f"Unexpected audio processing error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process audio file: {str(e)}"
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file: {e}")

@app.post("/ingredients/extract-from-text", response_model=IngredientExtractionResponse)
async def extract_ingredients_from_text(
    request: VoiceIngredientRequest,
    current_user: str = Depends(get_current_user)
):
    """Extract ingredients from text input"""
    try:
        start_time = time.time()
        
        logger.info(f"Extracting ingredients from text: {request.text[:50]}...")
        
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
        raise HTTPException(
            status_code=500,
            detail="Failed to extract ingredients from text"
        )

# ============== RECIPE GENERATION ==============

@app.post("/recipes/generate", response_model=RecipeResponse)
async def generate_recipe(
    recipe_request: RecipeRequest,
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
):
    """Generate personalized recipe based on ingredients and mood"""
    try:
        user = await db.get_user_by_id(current_user)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"Generating recipe for user {current_user} with {len(recipe_request.ingredients)} ingredients")
        
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
        
        history_id = await db.save_recipe_history(recipe_history)
        logger.info(f"Recipe saved to history: {history_id}")
        
        # Log mood
        mood_log = {
            "user_id": current_user,
            "mood": recipe_request.mood.value,
            "timestamp": datetime.utcnow()
        }
        await db.save_mood_log(mood_log)
        
        logger.info(f"✅ Recipe generated: {recipe.title}")
        
        return recipe
        
    except CustomException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    except Exception as e:
        logger.error(f"Recipe generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate recipe"
        )

# ============== RECIPE HISTORY ==============

@app.get("/recipes/history")
async def get_recipe_history(
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database),
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
        
        total = len(history)
        
        logger.info(f"Retrieved {total} recipes for user {current_user}")
        
        return {
            "recipes": history,
            "total": total,
            "limit": limit,
            "skip": skip,
            "has_more": total == limit
        }
        
    except Exception as e:
        logger.error(f"Get recipe history error: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve recipe history"
        )

@app.get("/recipes/history/{recipe_id}")
async def get_recipe_by_id(
    recipe_id: str,
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
):
    """Get specific recipe from history"""
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
        raise HTTPException(status_code=500, detail="Failed to retrieve recipe")

@app.delete("/recipes/history/{recipe_id}")
async def delete_recipe(
    recipe_id: str,
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
):
    """Delete recipe from history"""
    try:
        from bson import ObjectId
        
        result = await db.database.recipe_history.delete_one({
            "_id": ObjectId(recipe_id),
            "user_id": current_user
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return {"message": "Recipe deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete recipe error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete recipe")

# ============== FAVORITES ==============

@app.post("/recipes/{recipe_id}/favorite")
async def toggle_favorite_recipe(
    recipe_id: str,
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
):
    """Add or remove recipe from favorites"""
    try:
        is_favorited = await db.toggle_favorite_recipe(current_user, recipe_id)
        
        return {
            "recipe_id": recipe_id,
            "is_favorited": is_favorited,
            "message": "Added to favorites" if is_favorited else "Removed from favorites"
        }
        
    except Exception as e:
        logger.error(f"Toggle favorite error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update favorites"
        )

@app.get("/recipes/favorites")
async def get_favorite_recipes(
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
):
    """Get user's favorite recipes"""
    try:
        favorite_cursor = db.database.favorites.find({"user_id": current_user})
        favorite_docs = await favorite_cursor.to_list(length=None)
        
        if not favorite_docs:
            logger.info(f"No favorites found for user {current_user}")
            return {
                "favorites": [],
                "total": 0
            }
        
        from bson import ObjectId
        recipe_ids = []
        for doc in favorite_docs:
            try:
                recipe_id = doc.get("recipe_id")
                if recipe_id:
                    if isinstance(recipe_id, str):
                        recipe_ids.append(ObjectId(recipe_id))
                    else:
                        recipe_ids.append(recipe_id)
            except Exception as e:
                logger.warning(f"Invalid recipe_id in favorites: {e}")
                continue
        
        if not recipe_ids:
            logger.info(f"No valid recipe IDs in favorites for user {current_user}")
            return {
                "favorites": [],
                "total": 0
            }
        
        recipe_cursor = db.database.recipe_history.find({"_id": {"$in": recipe_ids}})
        recipes = await recipe_cursor.to_list(length=None)
        
        for recipe in recipes:
            if "_id" in recipe:
                recipe["_id"] = str(recipe["_id"])
            if "recipe" in recipe and isinstance(recipe["recipe"], dict):
                if "_id" in recipe["recipe"]:
                    recipe["recipe"]["_id"] = str(recipe["recipe"]["_id"])
        
        logger.info(f"Retrieved {len(recipes)} favorite recipes for user {current_user}")
        
        return {
            "favorites": recipes,
            "total": len(recipes)
        }
        
    except Exception as e:
        logger.error(f"Get favorites error: {str(e)}")
        logger.exception(e)
        return {
            "favorites": [],
            "total": 0,
            "error": str(e)
        }

# ============== USER PROFILE ==============

@app.get("/users/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
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
        raise HTTPException(status_code=500, detail="Failed to retrieve profile")

@app.put("/users/me")
async def update_user_profile(
    profile_update: UserProfile,
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
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
            "message": "Profile updated successfully",
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
        raise HTTPException(status_code=500, detail="Failed to update profile")

# ============== ANALYTICS & STATISTICS ==============

@app.get("/analytics/mood-trends")
async def get_mood_trends(
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database),
    days: int = 30
):
    """Get mood trends over time"""
    try:
        trends = await db.get_mood_trends(current_user, days)
        
        return {
            "trends": trends,
            "period_days": days,
            "total_entries": len(trends)
        }
        
    except Exception as e:
        logger.error(f"Get mood trends error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve mood trends"
        )

@app.get("/analytics/ingredient-stats")
async def get_ingredient_statistics(
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
):
    """Get ingredient usage statistics"""
    try:
        stats = await db.get_ingredient_usage_stats(current_user)
        
        return {
            "ingredients": stats,
            "total_unique_ingredients": len(stats)
        }
        
    except Exception as e:
        logger.error(f"Get ingredient stats error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve ingredient statistics"
        )

@app.get("/analytics/dashboard")
async def get_user_dashboard(
    current_user: str = Depends(get_current_user),
    db: MongoDB = Depends(get_database)
):
    """Get comprehensive user dashboard data"""
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
        
        cooking_times = []
        for recipe_doc in history:
            recipe = recipe_doc.get("recipe", {})
            if recipe and recipe.get("total_time"):
                cooking_times.append(recipe.get("total_time", 0))
        
        avg_cooking_time = sum(cooking_times) / len(cooking_times) if cooking_times else 0
        
        recent_recipes = []
        for recipe_doc in history[:5]:
            recent_recipes.append({
                "id": str(recipe_doc.get("_id")),
                "title": recipe_doc.get("recipe", {}).get("title", "Unknown"),
                "created_at": recipe_doc.get("created_at"),
                "mood": recipe_doc.get("mood")
            })
        
        logger.info(f"Dashboard stats: {total_recipes} recipes, {len(favorites)} favorites")
        
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
        logger.error(f"Get dashboard error: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve dashboard data: {str(e)}"
        )

# ============== ERROR HANDLERS ==============

@app.exception_handler(CustomException)
async def custom_exception_handler(request, exc: CustomException):
    """Handle custom exceptions"""
    return {
        "error": True,
        "status_code": exc.status_code,
        "detail": exc.detail,
        "error_code": exc.error_code,
        "timestamp": exc.timestamp.isoformat()
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        reload_excludes=["venv/*", "*.pyc", "__pycache__/*", "uploads/*"],
        log_level=settings.LOG_LEVEL.lower()
    )