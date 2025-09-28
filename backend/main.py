"""
EcoMeal AI Backend - FastAPI server for recipe recommendations and eco-friendly menu analysis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import pandas as pd
import os
from datetime import datetime
from typing import List, Optional
import json

# Initialize FastAPI app
app = FastAPI(title="EcoMeal AI", version="1.0.0")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Google Gemini API
# Load from config.env file
from dotenv import load_dotenv
load_dotenv("config.env")
genai.configure(api_key=os.getenv("GEMINI_API_KEY", "your-api-key-here"))

# Initialize the Gemini model
model = genai.GenerativeModel('gemini-pro')

# Pydantic models for request/response
class IngredientRequest(BaseModel):
    ingredients: List[str]
    dietary_preferences: Optional[str] = None

class MenuRequest(BaseModel):
    menu_items: List[str]
    restaurant_name: Optional[str] = None

class RecipeResponse(BaseModel):
    recipe_name: str
    ingredients: List[str]
    instructions: List[str]
    calories: int
    eco_tip: str
    eco_score: str  # "green", "yellow", "red"
    health_score: str  # "green", "yellow", "red"
    prep_time: str
    difficulty: str

class MenuAnalysisResponse(BaseModel):
    restaurant_name: str
    eco_analysis: str
    recommendations: List[str]
    overall_eco_score: str
    menu_items_analysis: List[dict]

# CSV file paths for data storage
RECIPES_CSV = "data/recipes.csv"
MENU_ANALYSIS_CSV = "data/menu_analysis.csv"

# Create data directory if it doesn't exist
os.makedirs("data", exist_ok=True)

def save_to_csv(data: dict, filename: str):
    """Save data to CSV file"""
    try:
        # Check if file exists
        if os.path.exists(filename):
            df = pd.read_csv(filename)
            new_df = pd.DataFrame([data])
            df = pd.concat([df, new_df], ignore_index=True)
        else:
            df = pd.DataFrame([data])
        
        df.to_csv(filename, index=False)
    except Exception as e:
        print(f"Error saving to CSV: {e}")

def get_eco_score(ingredients: List[str], calories: int) -> str:
    """Determine eco score based on ingredients and calories"""
    eco_ingredients = ["organic", "local", "seasonal", "plant-based", "sustainable"]
    processed_ingredients = ["processed", "packaged", "frozen", "canned"]
    
    eco_count = sum(1 for ingredient in ingredients for eco in eco_ingredients if eco in ingredient.lower())
    processed_count = sum(1 for ingredient in ingredients for proc in processed_ingredients if proc in ingredient.lower())
    
    if eco_count > processed_count and calories < 600:
        return "green"
    elif eco_count == processed_count or 600 <= calories <= 800:
        return "yellow"
    else:
        return "red"

def get_health_score(calories: int, ingredients: List[str]) -> str:
    """Determine health score based on calories and ingredients"""
    healthy_ingredients = ["vegetables", "fruits", "whole grain", "lean protein", "nuts", "seeds"]
    unhealthy_ingredients = ["sugar", "sodium", "saturated fat", "processed"]
    
    healthy_count = sum(1 for ingredient in ingredients for healthy in healthy_ingredients if healthy in ingredient.lower())
    unhealthy_count = sum(1 for ingredient in ingredients for unhealthy in unhealthy_ingredients if unhealthy in ingredient.lower())
    
    if healthy_count > unhealthy_count and calories < 500:
        return "green"
    elif healthy_count == unhealthy_count or 500 <= calories <= 700:
        return "yellow"
    else:
        return "red"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "EcoMeal AI Backend is running!", "status": "healthy"}

@app.post("/generate-recipe", response_model=RecipeResponse)
async def generate_recipe(request: IngredientRequest):
    """
    Generate a recipe from leftover ingredients using Google Gemini AI
    """
    try:
        # Prepare prompt for Gemini
        ingredients_str = ", ".join(request.ingredients)
        dietary_pref = f" (Dietary preferences: {request.dietary_preferences})" if request.dietary_preferences else ""
        
        prompt = f"""
        Create a delicious recipe using these leftover ingredients: {ingredients_str}{dietary_pref}
        
        Please provide the response in the following JSON format:
        {{
            "recipe_name": "Creative recipe name",
            "ingredients": ["list", "of", "ingredients", "needed"],
            "instructions": ["step", "by", "step", "instructions"],
            "calories": estimated_calories_per_serving,
            "prep_time": "X minutes",
            "difficulty": "Easy/Medium/Hard"
        }}
        
        Make it eco-friendly and sustainable. Focus on reducing food waste and using all ingredients efficiently.
        """
        
        # Generate recipe using Gemini
        response = model.generate_content(prompt)
        
        # Parse the response (assuming it returns JSON)
        try:
            recipe_data = json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback if response isn't valid JSON
            recipe_data = {
                "recipe_name": f"Leftover {ingredients_str} Recipe",
                "ingredients": request.ingredients + ["salt", "pepper", "olive oil"],
                "instructions": ["Combine all ingredients", "Cook until done", "Season to taste"],
                "calories": 400,
                "prep_time": "30 minutes",
                "difficulty": "Easy"
            }
        
        # Calculate eco and health scores
        eco_score = get_eco_score(recipe_data["ingredients"], recipe_data["calories"])
        health_score = get_health_score(recipe_data["calories"], recipe_data["ingredients"])
        
        # Generate eco tip
        eco_tips = [
            "Use all parts of vegetables to reduce waste",
            "Choose local and seasonal ingredients when possible",
            "Compost food scraps instead of throwing them away",
            "Store leftovers properly to extend their shelf life",
            "Plan meals to use ingredients before they spoil"
        ]
        eco_tip = eco_tips[hash(recipe_data["recipe_name"]) % len(eco_tips)]
        
        # Create response
        recipe_response = RecipeResponse(
            recipe_name=recipe_data["recipe_name"],
            ingredients=recipe_data["ingredients"],
            instructions=recipe_data["instructions"],
            calories=recipe_data["calories"],
            eco_tip=eco_tip,
            eco_score=eco_score,
            health_score=health_score,
            prep_time=recipe_data["prep_time"],
            difficulty=recipe_data["difficulty"]
        )
        
        # Save to CSV
        save_data = {
            "timestamp": datetime.now().isoformat(),
            "type": "recipe_generation",
            "input_ingredients": ingredients_str,
            "dietary_preferences": request.dietary_preferences or "",
            "recipe_name": recipe_response.recipe_name,
            "calories": recipe_response.calories,
            "eco_score": recipe_response.eco_score,
            "health_score": recipe_response.health_score,
            "prep_time": recipe_response.prep_time,
            "difficulty": recipe_response.difficulty
        }
        save_to_csv(save_data, RECIPES_CSV)
        
        return recipe_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recipe: {str(e)}")

@app.post("/restaurant-analysis", response_model=MenuAnalysisResponse)
async def analyze_restaurant_menu(request: MenuRequest):
    """
    Analyze restaurant menu for eco-friendliness using Google Gemini AI
    """
    try:
        # Prepare prompt for Gemini
        menu_str = ", ".join(request.menu_items)
        restaurant_name = request.restaurant_name or "Restaurant"
        
        prompt = f"""
        Analyze this restaurant menu for eco-friendliness and sustainability: {menu_str}
        
        Please provide the response in the following JSON format:
        {{
            "eco_analysis": "Overall analysis of the menu's environmental impact",
            "recommendations": ["list", "of", "eco-friendly", "recommendations"],
            "overall_eco_score": "green/yellow/red",
            "menu_items_analysis": [
                {{"item": "menu item name", "eco_rating": "green/yellow/red", "suggestion": "improvement suggestion"}},
                {{"item": "another item", "eco_rating": "green/yellow/red", "suggestion": "improvement suggestion"}}
            ]
        }}
        
        Focus on:
        - Local and seasonal ingredients
        - Plant-based options
        - Sustainable protein sources
        - Food waste reduction
        - Packaging and preparation methods
        """
        
        # Generate analysis using Gemini
        response = model.generate_content(prompt)
        
        # Parse the response
        try:
            analysis_data = json.loads(response.text)
        except json.JSONDecodeError:
            # Fallback if response isn't valid JSON
            analysis_data = {
                "eco_analysis": "Menu analysis completed. Consider adding more plant-based options and local ingredients.",
                "recommendations": [
                    "Add more plant-based options",
                    "Source ingredients locally",
                    "Reduce food waste through better planning",
                    "Use sustainable packaging"
                ],
                "overall_eco_score": "yellow",
                "menu_items_analysis": [
                    {"item": item, "eco_rating": "yellow", "suggestion": "Consider making this more sustainable"} 
                    for item in request.menu_items
                ]
            }
        
        # Create response
        menu_response = MenuAnalysisResponse(
            restaurant_name=restaurant_name,
            eco_analysis=analysis_data["eco_analysis"],
            recommendations=analysis_data["recommendations"],
            overall_eco_score=analysis_data["overall_eco_score"],
            menu_items_analysis=analysis_data["menu_items_analysis"]
        )
        
        # Save to CSV
        save_data = {
            "timestamp": datetime.now().isoformat(),
            "type": "menu_analysis",
            "restaurant_name": restaurant_name,
            "menu_items": menu_str,
            "overall_eco_score": menu_response.overall_eco_score,
            "recommendations_count": len(menu_response.recommendations)
        }
        save_to_csv(save_data, MENU_ANALYSIS_CSV)
        
        return menu_response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing menu: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
