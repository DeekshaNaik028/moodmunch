# backend/app/database/mongodb.py - SERVERLESS OPTIMIZED VERSION
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError, ServerSelectionTimeoutError
from bson import ObjectId
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import os

from app.core.config import get_settings

logger = logging.getLogger(__name__)

class MongoDB:
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None
        
    async def connect(self):
        """Connect to MongoDB with serverless compatibility"""
        try:
            # Get MongoDB URL from environment or settings
            mongodb_url = os.getenv('MONGODB_URL', self.settings.MONGODB_URL)
            
            logger.info(f"Connecting to MongoDB... (URL length: {len(mongodb_url)})")
            
            # Validate URL format
            if not mongodb_url or mongodb_url == "mongodb://localhost:27017":
                raise ValueError(
                    "MongoDB Atlas connection string required for production. "
                    "Set MONGODB_URL environment variable with format: "
                    "mongodb+srv://username:password@cluster.mongodb.net/dbname"
                )
            
            # SERVERLESS OPTIMIZED: Minimal connection pooling
            self.client = AsyncIOMotorClient(
                mongodb_url,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000,
                socketTimeoutMS=10000,
                maxPoolSize=1,  # Serverless: Use 1 connection per instance
                minPoolSize=0,   # Allow zero when idle
                maxIdleTimeMS=30000,  # Close idle connections after 30s
                retryWrites=True,
                w='majority'
            )
            
            # Get database name
            db_name = os.getenv('DATABASE_NAME', self.settings.DATABASE_NAME)
            self.database = self.client[db_name]
            
            # Test connection with ping
            await self.client.admin.command('ping')
            
            # Create indexes
            await self._create_indexes()
            
            logger.info(f"✅ Connected to MongoDB successfully (Database: {db_name})")
            
        except ServerSelectionTimeoutError as e:
            logger.error(f"❌ MongoDB connection timeout: {str(e)}")
            logger.error("Check: 1) Internet connection, 2) MongoDB Atlas whitelist, 3) Correct credentials")
            raise Exception(f"Failed to connect to MongoDB: {str(e)}")
            
        except Exception as e:
            logger.error(f"❌ MongoDB connection error: {str(e)}")
            raise Exception(f"Database connection failed: {str(e)}")
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")
    
    async def _create_indexes(self):
        """Create database indexes"""
        try:
            # User indexes
            await self.database.users.create_index("email", unique=True)
            await self.database.users.create_index("created_at")
            
            # Recipe history indexes
            await self.database.recipe_history.create_index("user_id")
            await self.database.recipe_history.create_index("created_at")
            await self.database.recipe_history.create_index([("user_id", 1), ("created_at", -1)])
            
            # Favorites indexes
            await self.database.favorites.create_index([("user_id", 1), ("recipe_id", 1)], unique=True)
            
            # Mood logs indexes
            await self.database.mood_logs.create_index([("user_id", 1), ("timestamp", -1)])
            
            logger.info("✅ Database indexes created successfully")
            
        except Exception as e:
            logger.warning(f"Index creation warning (may already exist): {str(e)}")
    
    async def health_check(self) -> bool:
        """Check if database is accessible"""
        try:
            await self.client.admin.command('ping')
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            user_data["created_at"] = datetime.utcnow()
            user_data["updated_at"] = datetime.utcnow()
            user_data["is_active"] = True
            user_data["favorite_recipes"] = []
            result = await self.database.users.insert_one(user_data)
            user_data["_id"] = result.inserted_id
            return user_data
        except DuplicateKeyError:
            raise ValueError("Email already registered")
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        try:
            return await self.database.users.find_one({"email": email, "is_active": True})
        except Exception as e:
            logger.error(f"Error getting user by email: {str(e)}")
            raise
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        try:
            return await self.database.users.find_one({"_id": ObjectId(user_id), "is_active": True})
        except Exception as e:
            logger.error(f"Error getting user by ID: {str(e)}")
            raise
    
    async def save_recipe_history(self, history_data: Dict[str, Any]) -> str:
        try:
            result = await self.database.recipe_history.insert_one(history_data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving recipe history: {str(e)}")
            raise
    
    async def get_recipe_history(self, user_id: str, limit: int = 10, skip: int = 0) -> List[Dict[str, Any]]:
        try:
            cursor = self.database.recipe_history.find(
                {"user_id": user_id}
            ).sort("created_at", -1).skip(skip).limit(limit)
            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"Error getting recipe history: {str(e)}")
            raise
    
    async def update_user_profile(self, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            update_data["updated_at"] = datetime.utcnow()
            result = await self.database.users.find_one_and_update(
                {"_id": ObjectId(user_id)},
                {"$set": update_data},
                return_document=True
            )
            return result
        except Exception as e:
            logger.error(f"Error updating user profile: {str(e)}")
            raise
    
    async def toggle_favorite_recipe(self, user_id: str, recipe_id: str) -> bool:
        try:
            existing_favorite = await self.database.favorites.find_one(
                {"user_id": user_id, "recipe_id": recipe_id}
            )
            if existing_favorite:
                await self.database.favorites.delete_one(
                    {"user_id": user_id, "recipe_id": recipe_id}
                )
                return False
            else:
                await self.database.favorites.insert_one({
                    "user_id": user_id,
                    "recipe_id": recipe_id,
                    "created_at": datetime.utcnow()
                })
                return True
        except Exception as e:
            logger.error(f"Error toggling favorite recipe: {str(e)}")
            raise
    
    async def get_favorite_recipes(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            favorite_cursor = self.database.favorites.find({"user_id": user_id})
            favorite_docs = await favorite_cursor.to_list(length=None)
            recipe_ids = [ObjectId(doc["recipe_id"]) for doc in favorite_docs]
            if not recipe_ids:
                return []
            recipe_cursor = self.database.recipe_history.find({"_id": {"$in": recipe_ids}})
            return await recipe_cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Error getting favorite recipes: {str(e)}")
            raise
    
    async def save_mood_log(self, mood_data: Dict[str, Any]) -> str:
        try:
            result = await self.database.mood_logs.insert_one(mood_data)
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error saving mood log: {str(e)}")
            raise
    
    async def get_mood_trends(self, user_id: str, days: int = 30) -> List[Dict[str, Any]]:
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            pipeline = [
                {"$match": {"user_id": user_id, "timestamp": {"$gte": start_date}}},
                {
                    "$group": {
                        "_id": {
                            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                            "mood": "$mood"
                        },
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "date": "$_id.date",
                        "mood": "$_id.mood",
                        "count": 1
                    }
                },
                {"$sort": {"date": 1, "mood": 1}}
            ]
            cursor = self.database.mood_logs.aggregate(pipeline)
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Error getting mood trends: {str(e)}")
            raise
    
    async def get_ingredient_usage_stats(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$unwind": "$ingredients_used"},
                {
                    "$group": {
                        "_id": "$ingredients_used",
                        "usage_count": {"$sum": 1},
                        "last_used": {"$max": "$created_at"}
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "ingredient": "$_id",
                        "usage_count": 1,
                        "last_used": 1
                    }
                },
                {"$sort": {"usage_count": -1}}
            ]
            cursor = self.database.recipe_history.aggregate(pipeline)
            return await cursor.to_list(length=None)
        except Exception as e:
            logger.error(f"Error getting ingredient usage stats: {str(e)}")
            raise

# Global database instance for serverless
_db_instance = None

async def get_database() -> MongoDB:
    """Get or create database instance (serverless-friendly)"""
    global _db_instance
    
    if _db_instance is None:
        _db_instance = MongoDB()
        await _db_instance.connect()
    
    # Verify connection is still alive
    try:
        is_healthy = await _db_instance.health_check()
        if not is_healthy:
            logger.warning("Database connection unhealthy, reconnecting...")
            _db_instance = MongoDB()
            await _db_instance.connect()
    except Exception as e:
        logger.error(f"Health check failed: {e}, reconnecting...")
        _db_instance = MongoDB()
        await _db_instance.connect()
    
    return _db_instance