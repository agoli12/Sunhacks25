import React, { useState } from 'react';
import { Plus, X, Building2, Leaf, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

interface MenuAnalysisResponse {
  restaurant_name: string;
  eco_analysis: string;
  recommendations: string[];
  overall_eco_score: string;
  menu_items_analysis: Array<{
    item: string;
    eco_rating: string;
    suggestion: string;
  }>;
}

const MenuAnalyzer: React.FC = () => {
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [newMenuItem, setNewMenuItem] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [analysis, setAnalysis] = useState<MenuAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMenuItem = () => {
    if (newMenuItem.trim() && !menuItems.includes(newMenuItem.trim())) {
      setMenuItems([...menuItems, newMenuItem.trim()]);
      setNewMenuItem('');
    }
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const analyzeMenu = async () => {
    if (menuItems.length === 0) {
      setError('Please add at least one menu item');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await axios.post('http://localhost:8001/restaurant-analysis', {
        menu_items: menuItems,
        restaurant_name: restaurantName || 'Restaurant'
      });

      setAnalysis(response.data);
    } catch (err) {
      setError('Failed to analyze menu. Please try again.');
      console.error('Error analyzing menu:', err);
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
      case 'green': return <CheckCircle className="h-5 w-5" />;
      case 'yellow': return <AlertCircle className="h-5 w-5" />;
      case 'red': return <XCircle className="h-5 w-5" />;
      default: return <AlertCircle className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Analyzer</h2>
        <p className="text-gray-600">
          Analyze your restaurant menu for eco-friendliness and get sustainable improvement suggestions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name (Optional)
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Enter restaurant name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menu Items
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={newMenuItem}
                onChange={(e) => setNewMenuItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMenuItem()}
                placeholder="Add a menu item..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={addMenuItem}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {/* Menu Items List */}
            <div className="flex flex-wrap gap-2">
              {menuItems.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {item}
                  <button
                    onClick={() => removeMenuItem(index)}
                    className="ml-2 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={analyzeMenu}
            disabled={loading || menuItems.length === 0}
            className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Menu...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Analyze Menu
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Analysis Display Section */}
        <div>
          {analysis ? (
            <div className="space-y-6">
              {/* Overall Analysis */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{analysis.restaurant_name}</h3>
                  <div className={`px-3 py-1 rounded-full ${getScoreColor(analysis.overall_eco_score)}`}>
                    <div className="flex items-center space-x-2">
                      {getScoreIcon(analysis.overall_eco_score)}
                      <span className="font-medium">Overall Eco Score</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{analysis.eco_analysis}</p>
              </div>

              {/* Recommendations */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-bold text-green-800 mb-3 flex items-center">
                  <Leaf className="h-5 w-5 mr-2" />
                  Eco-Friendly Recommendations
                </h4>
                <ul className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start text-green-700">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Menu Items Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-4">Menu Items Analysis</h4>
                <div className="space-y-4">
                  {analysis.menu_items_analysis.map((item, index) => (
                    <div key={index} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{item.item}</h5>
                        <div className={`px-2 py-1 rounded-full text-xs ${getScoreColor(item.eco_rating)}`}>
                          {getScoreIcon(item.eco_rating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{item.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {loading ? 'Analyzing your menu...' : 'Your menu analysis will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuAnalyzer;
