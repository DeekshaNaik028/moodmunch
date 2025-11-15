# backend/app/services/recipe_service.py - ENHANCED WITH MOOD MESSAGES
import google.generativeai as genai
import json
import re
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime
import asyncio

from app.models.schemas import RecipeResponse, NutritionInfo, MoodEnum
from app.core.config import get_settings
from app.utils.exceptions import CustomException

logger = logging.getLogger(__name__)

class RecipeService:
    def __init__(self):
        self.settings = get_settings()
        self.model = None
        self.initialized = False
        
        # Mood-specific guidance for recipe generation
        self.mood_guidance = {
            MoodEnum.HAPPY: {
                "recipe_style": "vibrant, colorful dishes that celebrate joy with bright flavors",
                "cooking_approach": "fun to make, visually appealing",
                "message_template": "🌟 Keep that smile shining! This {dish} is designed to celebrate your happiness with vibrant flavors and colors. Enjoy every delicious bite and let this meal remind you of all the wonderful things in life! 😊"
            },
            MoodEnum.SAD: {
                "recipe_style": "warm, comforting dishes that provide emotional solace",
                "cooking_approach": "nostalgic, soul-warming",
                "message_template": "💙 We understand you're feeling down. This {dish} is like a warm hug for your soul - made with comforting ingredients that bring peace and warmth. Remember, better days are ahead, and sometimes the best therapy comes from a home-cooked meal. You've got this! 🤗"
            },
            MoodEnum.ENERGETIC: {
                "recipe_style": "protein-rich, energizing meals that sustain vitality",
                "cooking_approach": "quick to make, power-packed",
                "message_template": "⚡ Channel that amazing energy! This {dish} is packed with nutrients to fuel your active lifestyle and keep you going strong. Your enthusiasm is contagious - keep spreading that positive vibe! 💪"
            },
            MoodEnum.TIRED: {
                "recipe_style": "simple, nourishing dishes requiring minimal effort",
                "cooking_approach": "easy preparation, restorative",
                "message_template": "😴 Rest is important, and so is nourishment. This {dish} is incredibly easy to make and will help restore your energy without exhausting you further. Take it easy, enjoy this meal, and give yourself permission to rest. Tomorrow is a new day! 🌙"
            },
            MoodEnum.STRESSED: {
                "recipe_style": "calming, simple dishes with soothing properties",
                "cooking_approach": "meditative cooking process, stress-reducing",
                "message_template": "🧘 Take a deep breath. This {dish} features calming ingredients and a therapeutic cooking process. Let the act of preparing this meal become your meditation. Remember: this too shall pass, and you're stronger than you think. 🌸"
            },
            MoodEnum.CALM: {
                "recipe_style": "balanced, gentle dishes that maintain tranquility",
                "cooking_approach": "mindful preparation, harmonious flavors",
                "message_template": "😌 Your peaceful state is beautiful. This {dish} complements your calm energy with balanced flavors and gentle ingredients. Savor each moment of preparation and every bite - you've found your center. 🕊️"
            },
            MoodEnum.EXCITED: {
                "recipe_style": "adventurous, bold dishes with exciting flavors",
                "cooking_approach": "experimental, surprising combinations",
                "message_template": "🤩 Your excitement is infectious! This {dish} matches your energy with bold, adventurous flavors that will thrill your taste buds. Life is an adventure, and so is cooking - enjoy this culinary journey! 🎉"
            },
            MoodEnum.BORED: {
                "recipe_style": "creative, unique dishes that spark curiosity",
                "cooking_approach": "innovative techniques, unexpected combinations",
                "message_template": "🎨 Time to shake things up! This {dish} features unique ingredients and creative techniques to reignite your culinary passion. Cooking can be an adventure - let this recipe inspire your creativity! ✨"
            }
        }
    
    async def initialize(self):
        try:
            genai.configure(api_key=self.settings.GEMINI_API_KEY)
            model_name = 'gemini-2.5-flash-lite'
            
            logger.info(f"Initializing recipe model: {model_name}")
            self.model = genai.GenerativeModel(model_name)
            
            test_prompt = "Respond with 'OK' if working."
            response = self.model.generate_content(test_prompt)
            
            if response and response.text and 'OK' in response.text.upper():
                self.initialized = True
                logger.info(f"✅ Recipe service initialized successfully with {model_name}")
            else:
                raise Exception("Model test failed")
                    
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {str(e)}")
            logger.warning("Recipe generation will use fallback mode")
            self.initialized = False
    
    def _create_recipe_prompt(
        self, 
        ingredients: List[str], 
        mood: MoodEnum, 
        dietary_preferences: List[str],
        allergies: List[str], 
        health_goals: List[str],
        cuisine_preference: Optional[str] = None
    ) -> str:
        mood_info = self.mood_guidance.get(mood, self.mood_guidance[MoodEnum.HAPPY])
        
        ingredients_list = '\n'.join([f"- {ing}" for ing in ingredients])
        dietary_str = ', '.join(dietary_preferences) if dietary_preferences else 'None'
        allergies_str = ', '.join(allergies) if allergies else 'None'
        health_goals_str = ', '.join(health_goals) if health_goals else 'General wellness'
        
        prompt = f"""
You are an expert chef and nutritionist who creates recipes that match people's emotional states.

USER'S AVAILABLE INGREDIENTS:
{ingredients_list}

USER'S CURRENT MOOD: {mood.value}
MOOD GUIDANCE: Create a {mood_info['recipe_style']}. The recipe should be {mood_info['cooking_approach']}.

USER PREFERENCES:
- Dietary Preferences: {dietary_str}
- MUST AVOID (Allergies): {allergies_str}
- Health Goals: {health_goals_str}
- Cuisine Preference: {cuisine_preference if cuisine_preference and cuisine_preference != 'any' else 'Any cuisine'}
- Servings: 2

CRITICAL RULES:
1. Use ONLY the ingredients listed above as main ingredients
2. You MAY add common pantry staples: salt, pepper, oil, water, basic spices
3. Create a REAL recipe that matches the user's {mood.value} mood
4. STRICTLY AVOID any ingredients the user is allergic to
5. Consider the user's dietary preferences and health goals
6. Make the recipe uplifting and appropriate for their emotional state

Return ONLY valid JSON (no markdown, no extra text):

{{
  "title": "Recipe Name (should reflect the mood)",
  "description": "Brief description explaining how this recipe suits the {mood.value} mood",
  "ingredients": [
    "500g ingredient1",
    "2 medium ingredient2",
    "1 tbsp oil",
    "1 tsp salt"
  ],
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction",
    "Step 3 instruction"
  ],
  "prep_time": 15,
  "cook_time": 30,
  "total_time": 45,
  "servings": 2,
  "difficulty": "easy",
  "cuisine_type": "italian",
  "nutrition_info": {{
    "calories": 380,
    "protein": 35,
    "carbs": 18,
    "fat": 16,
    "fiber": 4,
    "sugar": 8,
    "sodium": 480
  }},
  "tags": ["mood-based", "{mood.value}", "homemade"]
}}

Generate a mood-appropriate, cookable recipe now:
"""
        return prompt.strip()
    
    def _create_mood_message(self, recipe_title: str, mood: MoodEnum) -> str:
        """Generate a personalized mood message for the recipe"""
        mood_info = self.mood_guidance.get(mood, self.mood_guidance[MoodEnum.HAPPY])
        message = mood_info['message_template'].format(dish=recipe_title)
        return message
    
    def _parse_recipe_response(self, response_text: str, mood: MoodEnum) -> RecipeResponse:
        try:
            # Clean up the response
            cleaned_text = response_text.strip()
            
            # Remove markdown code blocks
            if cleaned_text.startswith('```json'):
                cleaned_text = cleaned_text[7:]
            elif cleaned_text.startswith('```'):
                cleaned_text = cleaned_text[3:]
            
            if cleaned_text.endswith('```'):
                cleaned_text = cleaned_text[:-3]
            
            cleaned_text = cleaned_text.strip()
            
            # Try to extract JSON object
            json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
            if json_match:
                cleaned_text = json_match.group()
            
            # Fix common JSON errors
            cleaned_text = re.sub(r',(\s*[}\]])', r'\1', cleaned_text)
            cleaned_text = re.sub(r'"\s*\n\s*"', '",\n"', cleaned_text)
            
            logger.info(f"Parsing JSON response (length: {len(cleaned_text)} chars)")
            
            try:
                recipe_data = json.loads(cleaned_text)
            except json.JSONDecodeError as json_error:
                logger.error(f"JSON decode error at position {json_error.pos}")
                start = cleaned_text.find('{')
                end = cleaned_text.rfind('}')
                if start != -1 and end != -1:
                    cleaned_text = cleaned_text[start:end+1]
                    recipe_data = json.loads(cleaned_text)
                else:
                    raise
            
            # Extract and validate fields
            nutrition_data = recipe_data.get('nutrition_info', {})
            
            nutrition_info = NutritionInfo(
                calories=float(nutrition_data.get('calories', 300)),
                protein=float(nutrition_data.get('protein', 15)),
                carbs=float(nutrition_data.get('carbs', 30)),
                fat=float(nutrition_data.get('fat', 10)),
                fiber=float(nutrition_data.get('fiber', 5)),
                sugar=float(nutrition_data.get('sugar', 5)),
                sodium=float(nutrition_data.get('sodium', 400))
            )
            
            # Create the mood message
            recipe_title = recipe_data.get('title', 'Generated Recipe')
            mood_message = self._create_mood_message(recipe_title, mood)
            
            recipe = RecipeResponse(
                title=recipe_title,
                description=recipe_data.get('description', 'A delicious recipe'),
                ingredients=recipe_data.get('ingredients', []),
                instructions=recipe_data.get('instructions', []),
                prep_time=int(recipe_data.get('prep_time', 15)),
                cook_time=int(recipe_data.get('cook_time', 30)),
                total_time=int(recipe_data.get('total_time', 45)),
                servings=int(recipe_data.get('servings', 2)),
                difficulty=recipe_data.get('difficulty', 'medium'),
                cuisine_type=recipe_data.get('cuisine_type', 'fusion'),
                nutrition_info=nutrition_info,
                tags=recipe_data.get('tags', []),
                mood_message=mood_message  # Add mood message to recipe
            )
            
            logger.info(f"✅ Successfully parsed recipe: {recipe.title}")
            return recipe
            
        except Exception as e:
            logger.error(f"Recipe parsing error: {str(e)}")
            raise Exception(f"Failed to parse recipe: {str(e)}")
    
    def _create_fallback_recipe(self, ingredients: List[str], mood: MoodEnum) -> RecipeResponse:
        """Only used if AI is completely unavailable"""
        mood_titles = {
            MoodEnum.HAPPY: "Cheerful",
            MoodEnum.SAD: "Comforting",
            MoodEnum.ENERGETIC: "Power-Packed",
            MoodEnum.TIRED: "Easy",
            MoodEnum.STRESSED: "Soothing",
            MoodEnum.CALM: "Gentle",
            MoodEnum.EXCITED: "Adventure",
            MoodEnum.BORED: "Creative"
        }
        
        title = f"{mood_titles.get(mood, 'Simple')} {ingredients[0].title()} Dish"
        mood_message = self._create_mood_message(title, mood)
        
        return RecipeResponse(
            title=title,
            description=f"A simple {mood.value} recipe using {', '.join(ingredients[:3])}.",
            ingredients=[f"{ingredient} (as needed)" for ingredient in ingredients] + ["Salt and pepper to taste"],
            instructions=[
                "Prepare all available ingredients.",
                "Heat oil in a pan over medium heat.",
                "Add main ingredients and cook until done.",
                "Season with salt and pepper to taste.",
                "Serve hot and enjoy!"
            ],
            prep_time=10,
            cook_time=20,
            total_time=30,
            servings=2,
            difficulty="easy",
            cuisine_type="home-style",
            nutrition_info=NutritionInfo(
                calories=250, protein=12, carbs=25, fat=10,
                fiber=4, sugar=6, sodium=400
            ),
            tags=[mood.value, "simple", "homemade"],
            mood_message=mood_message
        )
    
    async def generate_recipe(
        self,
        ingredients: List[str],
        mood: MoodEnum,
        dietary_preferences: List[str] = [],
        allergies: List[str] = [],
        health_goals: List[str] = [],
        cuisine_preference: Optional[str] = None,
        max_retries: int = 3
    ) -> RecipeResponse:
        
        if not ingredients:
            raise CustomException(status_code=400, detail="At least one ingredient is required")
        
        if not self.initialized:
            logger.error("❌ AI not initialized - check your GEMINI_API_KEY in .env file")
            raise CustomException(
                status_code=503, 
                detail="AI service not available. Please check API configuration."
            )
        
        prompt = self._create_recipe_prompt(
            ingredients=ingredients,
            mood=mood,
            dietary_preferences=dietary_preferences,
            allergies=allergies,
            health_goals=health_goals,
            cuisine_preference=cuisine_preference
        )
        
        for attempt in range(max_retries):
            try:
                logger.info(f"🔄 Generating mood-based recipe (attempt {attempt + 1}/{max_retries})")
                
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.7,
                        top_p=0.8,
                        top_k=40,
                        max_output_tokens=2048,
                    )
                )
                
                if not response or not response.text:
                    raise Exception("Empty response from AI model")
                
                logger.info(f"📥 Received response from Gemini ({len(response.text)} chars)")
                
                recipe = self._parse_recipe_response(response.text, mood)
                
                if not recipe.ingredients or not recipe.instructions:
                    raise Exception("Recipe missing essential data")
                
                logger.info(f"✅ Mood-based recipe generated: {recipe.title}")
                return recipe
                    
            except Exception as e:
                logger.error(f"❌ Attempt {attempt + 1} failed: {str(e)}")
                
                if attempt == max_retries - 1:
                    logger.error("All attempts failed")
                    raise CustomException(
                        status_code=500,
                        detail="Failed to generate recipe. Please try again."
                    )
                
                await asyncio.sleep(1)
        
        raise CustomException(status_code=500, detail="Recipe generation failed")