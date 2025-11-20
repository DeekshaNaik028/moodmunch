import React, { useState, useEffect } from 'react';
import { Users, ChefHat, TrendingUp, Star, Activity, Search, Trash2, Shield, LogOut, BarChart3, Calendar } from 'lucide-react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://moodmunchbackend.vercel.app'
  : 'http://localhost:8000';

// Login Component
const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@moodmunch.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/login?email=${email}&password=${password}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('admin_token', data.access_token);
      onLogin(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
          <p className="text-gray-600">MoodMunch Administration</p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Default credentials:</p>
          <p className="font-mono text-xs mt-1">admin@moodmunch.com</p>
          <p className="text-xs text-red-500 mt-2">⚠️ Change password in production!</p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const AdminDashboard = () => {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/users?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecipes = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/recipes?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    } else if (activeTab === 'recipes' && recipes.length === 0) {
      fetchRecipes();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchUsers();
        alert('User deactivated successfully');
      }
    } catch (err) {
      alert('Failed to deactivate user');
    }
  };

  const deleteRecipe = async (recipeId) => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchRecipes();
        alert('Recipe deleted successfully');
      }
    } catch (err) {
      alert('Failed to delete recipe');
    }
  };

  if (!token) {
    return <AdminLogin onLogin={setToken} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">MoodMunch Admin</h1>
              <p className="text-xs text-gray-500">Administrative Dashboard</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white min-h-screen border-r border-gray-200 p-4">
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'recipes', label: 'Recipes', icon: ChefHat },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Overview</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                  <Users className="w-8 h-8 mb-3 opacity-80" />
                  <div className="text-3xl font-bold mb-1">{stats?.total_users || 0}</div>
                  <div className="text-blue-100 text-sm">Total Users</div>
                  <div className="text-xs text-blue-200 mt-2">
                    +{stats?.new_users_this_month || 0} this month
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                  <ChefHat className="w-8 h-8 mb-3 opacity-80" />
                  <div className="text-3xl font-bold mb-1">{stats?.total_recipes || 0}</div>
                  <div className="text-purple-100 text-sm">Total Recipes</div>
                  <div className="text-xs text-purple-200 mt-2">
                    +{stats?.new_recipes_this_month || 0} this month
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                  <Star className="w-8 h-8 mb-3 opacity-80" />
                  <div className="text-3xl font-bold mb-1">{stats?.average_rating || 0}★</div>
                  <div className="text-pink-100 text-sm">Avg Rating</div>
                  <div className="text-xs text-pink-200 mt-2">
                    From {stats?.total_ratings || 0} ratings
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                  <Activity className="w-8 h-8 mb-3 opacity-80" />
                  <div className="text-3xl font-bold mb-1">
                    {stats?.active_users?.length || 0}
                  </div>
                  <div className="text-green-100 text-sm">Active Users</div>
                  <div className="text-xs text-green-200 mt-2">Top contributors</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mood Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Mood Distribution</h3>
                  <div className="space-y-3">
                    {stats?.mood_distribution?.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-24 font-medium text-gray-700 capitalize text-sm">
                          {item._id || 'Unknown'}
                        </div>
                        <div className="flex-1">
                          <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-end pr-2"
                              style={{
                                width: `${(item.count / stats.total_recipes) * 100}%`
                              }}
                            >
                              <span className="text-white text-xs font-bold">
                                {item.count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Ingredients */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Top Ingredients</h3>
                  <div className="space-y-2">
                    {stats?.popular_ingredients?.slice(0, 8).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <span className="font-medium text-gray-700 capitalize">
                          {idx + 1}. {item._id}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.count} uses
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.recipe_count || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'recipes' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Recipe Management</h2>
              
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mood</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recipes.map((recipe) => (
                      <tr key={recipe._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {recipe.recipe?.title || 'Untitled'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {recipe.user_email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                          {recipe.mood}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(recipe.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => deleteRecipe(recipe._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics</h2>
              <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Advanced analytics coming soon!</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;