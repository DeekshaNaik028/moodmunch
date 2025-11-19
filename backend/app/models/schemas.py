from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class MoodEnum(str, Enum):
    HAPPY = "happy"
    SAD = "sad"
    ENERGETIC = "energetic"
    TIRED = "tired"
    STRESSED = "stressed"
    CALM = "calm"
    EXCITED = "excited"
    BORED = "bored"

class CuisineEnum(str, Enum):
    ITALIAN = "italian"
    CHINESE = "chinese"
    INDIAN = "indian"
    MEXICAN = "mexican"
    AMERICAN = "american"
    JAPANESE = "japanese"
    FRENCH = "french"
    THAI = "thai"
    MEDITERRANEAN = "mediterranean"
    ANY = "any"

class DietaryPreferenceEnum(str, Enum):
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    GLUTEN_FREE = "gluten_free"
    KETO = "keto"
    PALEO = "paleo"
    LOW_CARB = "low_carb"
    HIGH_PROTEIN = "high_protein"
    DAIRY_FREE = "dairy_free"
    NUT_FREE = "nut_free"

class HealthGoalEnum(str, Enum):
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    MAINTAIN_WEIGHT = "maintain_weight"
    HEART_HEALTH = "heart_health"
    DIABETES_MANAGEMENT = "diabetes_management"
    BALANCED_DIET = "balanced_diet"
    ENERGY_BOOST = "energy_boost"

class NutritionInfo(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    sugar: float
    sodium: float

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    dietary_preferences: List[DietaryPreferenceEnum] = []
    allergies: List[str] = []
    health_goals: List[HealthGoalEnum] = []
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    dietary_preferences: List[str]
    allergies: List[str]
    health_goals: List[str]
    created_at: datetime

class UserProfile(BaseModel):
    name: Optional[str] = None
    dietary_preferences: Optional[List[DietaryPreferenceEnum]] = None
    allergies: Optional[List[str]] = None
    health_goals: Optional[List[HealthGoalEnum]] = None

class RecipeResponse(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    ingredients: List[str]
    instructions: List[str]
    prep_time: int
    cook_time: int
    total_time: int
    servings: int
    difficulty: str
    cuisine_type: str
    nutrition_info: NutritionInfo
    tags: List[str] = []
    mood_message: Optional[str] = None  # NEW FIELD - Personalized mood message
    generated_at: datetime = datetime.utcnow()
    
class RecipeRequest(BaseModel):
    ingredients: List[str]
    mood: MoodEnum
    cuisine_preference: Optional[CuisineEnum] = CuisineEnum.ANY
    max_prep_time: Optional[int] = None
    servings: Optional[int] = 2
    
    @validator('ingredients')
    def validate_ingredients(cls, v):
        if len(v) < 1:
            raise ValueError('At least one ingredient is required')
        return v

# NEW: Voice/Audio ingredient detection
class VoiceIngredientRequest(BaseModel):
    """Request model for text-based ingredient extraction"""
    text: str
    
    @validator('text')
    def validate_text(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Text must be at least 3 characters')
        return v.strip()

class IngredientExtractionResponse(BaseModel):
    """Response for ingredient extraction (voice or text)"""
    ingredients: List[str]
    validated_ingredients: Optional[List[str]] = None
    suggestions: Optional[Dict[str, str]] = None
    transcription: Optional[str] = None  # Original transcription if from audio
    processing_time: float
    source: str  # "audio" or "text"
    confidence: Optional[float] = None

class MoodLog(BaseModel):
    user_id: str
    mood: MoodEnum
    timestamp: datetime = datetime.utcnow()
# backend/app/models/schemas.py - ADD THESE NEW SCHEMAS

# Add to the existing file, after MoodLog class:

class DailyMoodLog(BaseModel):
    """Enhanced daily mood log with detailed metrics"""
    user_id: str
    mood: MoodEnum
    energy_level: int  # 1-10
    meal_preference: str  # comfort, light, hearty, quick
    emotional_state: str  # happy, stressed, calm, excited, sad, bored
    timestamp: datetime = datetime.utcnow()
    
    @validator('energy_level')
    def validate_energy_level(cls, v):
        if not 1 <= v <= 10:
            raise ValueError('Energy level must be between 1 and 10')
        return v

class DailyMoodCreate(BaseModel):
    """Request model for creating daily mood log"""
    mood: MoodEnum
    energy_level: int
    meal_preference: str
    emotional_state: str
    
    @validator('energy_level')
    def validate_energy_level(cls, v):
        if not 1 <= v <= 10:
            raise ValueError('Energy level must be between 1 and 10')
        return v
    
    @validator('meal_preference')
    def validate_meal_preference(cls, v):
        valid_prefs = ['comfort', 'light', 'hearty', 'quick']
        if v not in valid_prefs:
            raise ValueError(f'Meal preference must be one of: {", ".join(valid_prefs)}')
        return v
    
    @validator('emotional_state')
    def validate_emotional_state(cls, v):
        valid_states = ['happy', 'sad', 'stressed', 'calm', 'excited', 'bored']
        if v not in valid_states:
            raise ValueError(f'Emotional state must be one of: {", ".join(valid_states)}')
        return v

class DailyMoodLog(BaseModel):
    """Enhanced daily mood log with detailed metrics"""
    user_id: str
    mood: MoodEnum
    energy_level: int  # 1-10
    meal_preference: str  # comfort, light, hearty, quick
    emotional_state: str  # happy, stressed, calm, excited, sad, bored
    timestamp: datetime = datetime.utcnow()
    
    @validator('energy_level')
    def validate_energy_level(cls, v):
        if not 1 <= v <= 10:
            raise ValueError('Energy level must be between 1 and 10')
        return v

class MoodInsights(BaseModel):
    """Comprehensive mood insights for analytics"""
    most_common_mood: str
    average_energy_level: float
    preferred_meal_type: str
    mood_trend: str  # improving, declining, stable
    total_logs: int
    logs_this_week: int
    energy_trend: str  # increasing, decreasing, stable
    mood_distribution: Optional[Dict[str, int]] = None
    meal_distribution: Optional[Dict[str, int]] = None
    
class RecipeHistory(BaseModel):
    user_id: str
    recipe: RecipeResponse
    ingredients_used: List[str]
    mood: MoodEnum
    input_method: Optional[str] = "manual"  # "manual", "voice", "text"
    created_at: datetime = datetime.utcnow()
    rating: Optional[int] = None
    notes: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    expires_at: str

# Statistics and Analytics
class IngredientUsageStats(BaseModel):
    ingredient: str
    usage_count: int
    last_used: datetime

class MoodTrendData(BaseModel):
    date: str
    mood: str
    count: int

class UserStats(BaseModel):
    total_recipes_generated: int
    favorite_ingredients: List[IngredientUsageStats]
    mood_trends: List[MoodTrendData]
    most_used_cuisine: Optional[str]
    avg_cooking_time: Optional[float]



class EmailVerification(BaseModel):
    token: str

class ResendVerification(BaseModel):
    email: EmailStr

# Password Reset Schemas
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
