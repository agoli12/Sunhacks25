import React, { useState } from 'react';
import { Plus, X, Clock, Zap, Leaf, Heart, ChefHat, Loader2 } from 'lucide-react';
import axios from 'axios';

interface RecipeResponse {
  recipe_name: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  eco_tip: string;
  eco_score: string;
  health_score: string;
  prep_time: string;
  difficulty: string;
}

const RecipeGenerator: React.FC = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setError('');
    setRecipe(null);

    try {
      const response = await axios.post('http://localhost:8001/generate-recipe', {
        ingredients,
        dietary_preferences: dietaryPreferences || null
      });

      setRecipe(response.data);
    } catch (err) {
      setError('Failed to generate recipe. Please try again.');
      console.error('Error generating recipe:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'yellow': return 'text-yellow-600 bg-yellow-100';
      case 'red': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'green': return '✅';
      case 'yellow': return '⚠️';
      case 'red': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Recipe Generator</h2>
        <p className="text-gray-600">
          Enter your leftover ingredients and let our AI create a delicious, eco-friendly recipe for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingredients
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                placeholder="Add an ingredient..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={addIngredient}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {/* Ingredients List */}
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                >
                  {ingredient}
                  <button
                    onClick={() => removeIngredient(index)}
                    className="ml-2 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Preferences (Optional)
            </label>
            <input
              type="text"
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
              placeholder="e.g., vegetarian, gluten-free, keto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={generateRecipe}
            disabled={loading || ingredients.length === 0}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Recipe...
              </>
            ) : (
              <>
                <ChefHat className="h-4 w-4 mr-2" />
                Generate Recipe
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Recipe Display Section */}
        <div>
          {recipe ? (
            <div className="bg-gray-50 rounded-lg p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{recipe.recipe_name}</h3>
                <div className="flex justify-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {recipe.prep_time}
                  </span>
                  <span className="flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    {recipe.calories} cal
                  </span>
                  <span className="px-2 py-1 bg-gray-200 rounded-full">
                    {recipe.difficulty}
                  </span>
                </div>
              </div>

              {/* Eco and Health Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${getScoreColor(recipe.eco_score)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Eco Score</span>
                    <span className="text-lg">{getScoreIcon(recipe.eco_score)}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getScoreColor(recipe.health_score)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Health Score</span>
                    <span className="text-lg">{getScoreIcon(recipe.health_score)}</span>
                  </div>
                </div>
              </div>

              {/* Eco Tip */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Leaf className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 mb-1">Eco Tip</h4>
                    <p className="text-green-700 text-sm">{recipe.eco_tip}</p>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Ingredients</h4>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Instructions</h4>
                <ol className="space-y-2">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-700">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {loading ? 'Generating your recipe...' : 'Your generated recipe will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeGenerator;
