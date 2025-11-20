# backend/app/api/admin.py - NEW FILE
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from app.database.mongodb import get_database
from app.services.auth_service import AuthService
from app.models.schemas import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])

import os

ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@moodmunch.com')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'ChangeThisPassword123!')
async def get_current_admin(credentials = Depends(AuthService().security)):
    """Verify admin access"""
    try:
        auth_service = AuthService()
        token = credentials.credentials
        user_id = auth_service.verify_token(token)
        
        db = await get_database()
        user = await db.get_user_by_id(user_id)
        
        if not user or not user.get('is_admin', False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        return user_id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

@router.post("/login")
async def admin_login(email: str, password: str, db = Depends(get_database)):
    """Admin login endpoint"""
    try:
        # For first-time setup, create admin user if it doesn't exist
        admin_user = await db.get_user_by_email(ADMIN_EMAIL)
        
        if not admin_user:
            # Create default admin user
            auth_service = AuthService()
            hashed_password = auth_service._hash_password(ADMIN_PASSWORD)
            
            admin_data = {
                "name": "Admin",
                "email": ADMIN_EMAIL,
                "hashed_password": hashed_password,
                "is_admin": True,
                "is_active": True,
                "email_verified": True,
                "dietary_preferences": [],
                "allergies": [],
                "health_goals": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            admin_user = await db.create_user(admin_data)
        
        # Verify credentials
        auth_service = AuthService()
        if email != ADMIN_EMAIL or not auth_service._verify_password(password, admin_user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate token
        token_data = auth_service._create_access_token(str(admin_user["_id"]))
        
        return {
            **token_data,
            "user": {
                "id": str(admin_user["_id"]),
                "email": admin_user["email"],
                "name": admin_user["name"],
                "is_admin": True
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
async def get_admin_dashboard(admin_id: str = Depends(get_current_admin), db = Depends(get_database)):
    """Get admin dashboard statistics"""
    try:
        # Total users
        total_users = await db.database.users.count_documents({"is_active": True})
        
        # Total recipes
        total_recipes = await db.database.recipe_history.count_documents({})
        
        # Users this month
        month_ago = datetime.utcnow() - timedelta(days=30)
        new_users = await db.database.users.count_documents({
            "created_at": {"$gte": month_ago},
            "is_active": True
        })
        
        # Recipes this month
        new_recipes = await db.database.recipe_history.count_documents({
            "created_at": {"$gte": month_ago}
        })
        
        # Average rating
        rating_pipeline = [
            {"$match": {"rating": {"$exists": True, "$ne": None}}},
            {"$group": {
                "_id": None,
                "average_rating": {"$avg": "$rating"},
                "total_ratings": {"$sum": 1}
            }}
        ]
        rating_cursor = db.database.recipe_history.aggregate(rating_pipeline)
        rating_data = await rating_cursor.to_list(length=1)
        
        avg_rating = 0
        total_ratings = 0
        if rating_data and len(rating_data) > 0:
            avg_rating = round(rating_data[0].get("average_rating", 0), 2)
            total_ratings = rating_data[0].get("total_ratings", 0)
        
        # Most active users
        active_users_pipeline = [
            {"$group": {
                "_id": "$user_id",
                "recipe_count": {"$sum": 1}
            }},
            {"$sort": {"recipe_count": -1}},
            {"$limit": 5}
        ]
        active_cursor = db.database.recipe_history.aggregate(active_users_pipeline)
        active_users = await active_cursor.to_list(length=5)
        
        # Popular ingredients
        ingredient_pipeline = [
            {"$unwind": "$ingredients_used"},
            {"$group": {
                "_id": "$ingredients_used",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        ingredient_cursor = db.database.recipe_history.aggregate(ingredient_pipeline)
        popular_ingredients = await ingredient_cursor.to_list(length=10)
        
        # Mood distribution
        mood_pipeline = [
            {"$group": {
                "_id": "$mood",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        mood_cursor = db.database.recipe_history.aggregate(mood_pipeline)
        mood_distribution = await mood_cursor.to_list(length=None)
        
        return {
            "total_users": total_users,
            "total_recipes": total_recipes,
            "new_users_this_month": new_users,
            "new_recipes_this_month": new_recipes,
            "average_rating": avg_rating,
            "total_ratings": total_ratings,
            "active_users": active_users,
            "popular_ingredients": popular_ingredients,
            "mood_distribution": mood_distribution,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
async def get_all_users(
    admin_id: str = Depends(get_current_admin),
    db = Depends(get_database),
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None
):
    """Get all users with pagination"""
    try:
        query = {"is_active": True}
        
        if search:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"name": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = db.database.users.find(query).skip(skip).limit(limit).sort("created_at", -1)
        users = await cursor.to_list(length=limit)
        
        total = await db.database.users.count_documents(query)
        
        # Get recipe count for each user
        for user in users:
            user["_id"] = str(user["_id"])
            recipe_count = await db.database.recipe_history.count_documents({
                "user_id": str(user["_id"])
            })
            user["recipe_count"] = recipe_count
        
        return {
            "users": users,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{user_id}")
async def get_user_details(
    user_id: str,
    admin_id: str = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Get detailed user information"""
    try:
        user = await db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's recipes
        recipe_cursor = db.database.recipe_history.find({
            "user_id": user_id
        }).sort("created_at", -1).limit(10)
        recipes = await recipe_cursor.to_list(length=10)
        
        # Get user's favorites
        favorite_cursor = db.database.favorites.find({"user_id": user_id})
        favorites = await favorite_cursor.to_list(length=None)
        
        # Get mood logs
        mood_cursor = db.database.daily_mood_logs.find({
            "user_id": user_id
        }).sort("timestamp", -1).limit(10)
        mood_logs = await mood_cursor.to_list(length=10)
        
        user["_id"] = str(user["_id"])
        for recipe in recipes:
            recipe["_id"] = str(recipe["_id"])
        for mood in mood_logs:
            mood["_id"] = str(mood["_id"])
        
        return {
            "user": user,
            "recent_recipes": recipes,
            "favorite_count": len(favorites),
            "recent_moods": mood_logs
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
async def deactivate_user(
    user_id: str,
    admin_id: str = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Deactivate a user account"""
    try:
        result = await db.database.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": False, "deactivated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deactivated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recipes")
async def get_all_recipes(
    admin_id: str = Depends(get_current_admin),
    db = Depends(get_database),
    skip: int = 0,
    limit: int = 20
):
    """Get all recipes with pagination"""
    try:
        cursor = db.database.recipe_history.find({}).skip(skip).limit(limit).sort("created_at", -1)
        recipes = await cursor.to_list(length=limit)
        
        total = await db.database.recipe_history.count_documents({})
        
        # Get user info for each recipe
        for recipe in recipes:
            recipe["_id"] = str(recipe["_id"])
            user = await db.get_user_by_id(recipe["user_id"])
            if user:
                recipe["user_email"] = user["email"]
                recipe["user_name"] = user["name"]
        
        return {
            "recipes": recipes,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/recipes/{recipe_id}")
async def delete_recipe(
    recipe_id: str,
    admin_id: str = Depends(get_current_admin),
    db = Depends(get_database)
):
    """Delete a recipe"""
    try:
        result = await db.database.recipe_history.delete_one({
            "_id": ObjectId(recipe_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Also remove from favorites
        await db.database.favorites.delete_many({"recipe_id": recipe_id})
        
        return {"message": "Recipe deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/trends")
async def get_analytics_trends(
    admin_id: str = Depends(get_current_admin),
    db = Depends(get_database),
    days: int = 30
):
    """Get analytics trends"""
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Daily user signups
        signup_pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        signup_cursor = db.database.users.aggregate(signup_pipeline)
        signups = await signup_cursor.to_list(length=None)
        
        # Daily recipe generation
        recipe_pipeline = [
            {"$match": {"created_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        recipe_cursor = db.database.recipe_history.aggregate(recipe_pipeline)
        recipes_generated = await recipe_cursor.to_list(length=None)
        
        return {
            "daily_signups": signups,
            "daily_recipes": recipes_generated,
            "period_days": days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))