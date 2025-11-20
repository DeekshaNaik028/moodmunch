// frontend/src/pages/LandingPage.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Mic, ChefHat, Heart, TrendingUp, ArrowRight, Check, Menu, X, Utensils, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/common/Logo';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRecipes: 0,
    totalUsers: 0,
    averageRating: 4.9
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fetch real metrics from backend
    const fetchMetrics = async () => {
      try {
        console.log('Fetching metrics from backend...');
        
        // Determine the correct API URL based on environment
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? 'https://moodmunchbackend.vercel.app/health'
          : 'http://localhost:8000/health';
        
        console.log('Using API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Health data received:', data);
          
          if (data.stats) {
            const newMetrics = {
              totalRecipes: data.stats.total_recipes || 0,
              totalUsers: data.stats.total_users || 0,
              averageRating: data.stats.average_rating || 4.9
            };
            console.log('Setting metrics to:', newMetrics);
            setMetrics(newMetrics);
          } else {
            console.warn('No stats in response');
          }
        } else {
          console.error('Failed to fetch metrics, status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      }
    };
    
    fetchMetrics();
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced AI analyzes your mood and ingredients to create perfect recipes tailored just for you."
    },
    {
      icon: Mic,
      title: "Voice Input",
      description: "Simply speak your ingredients - no typing needed. Our smart AI understands natural language."
    },
    {
      icon: Heart,
      title: "Mood-Based Recipes",
      description: "Feeling happy? Stressed? Tired? Get recipes that match and enhance your emotional state."
    },
    {
      icon: ChefHat,
      title: "Personalized Cooking",
      description: "Considers your dietary preferences, allergies, and health goals in every recipe."
    },
    {
      icon: TrendingUp,
      title: "Track Your Journey",
      description: "Monitor mood trends, favorite ingredients, and cooking patterns over time."
    },
    {
      icon: Sparkles,
      title: "Instant Generation",
      description: "Get complete recipes with ingredients, instructions, and nutrition in seconds."
    }
  ];

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-lg' : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo - Use actual MoodMunch Logo */}
            <div className="flex items-center gap-2">
              <Logo size="default" className="w-8 h-8 md:w-10 md:h-10" />
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                MoodMunch
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                How It Works
              </button>
              <button onClick={() => scrollToSection('benefits')} className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                Benefits
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-xl z-50">
              <div className="py-4 px-4 space-y-2">
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="block w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 rounded-xl font-medium transition-all"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')} 
                  className="block w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 rounded-xl font-medium transition-all"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => scrollToSection('benefits')} 
                  className="block w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 rounded-xl font-medium transition-all"
                >
                  Benefits
                </button>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="block w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold text-center shadow-lg hover:shadow-xl transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Match AuthScreen background */}
      {/* Hero Section - Match AuthScreen background */}
      <section className="pt-28 md:pt-32 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full mb-4 md:mb-6 border border-pink-200 dark:border-pink-800">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-pink-600 dark:text-pink-400" />
              <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">AI-Powered Recipe Generation</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 leading-tight px-4">
              Cook With Your
              <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Mood & Ingredients
              </span>
            </h1>
            
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Tell us what you have and how you feel. Our AI creates personalized recipes that match your mood, ingredients, and dietary needs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
              <button 
                onClick={() => window.location.href = '/login'}
                className="w-full sm:w-auto group px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold text-base md:text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Cooking Now
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold text-base md:text-lg hover:shadow-xl transition-all border-2 border-gray-200 dark:border-gray-700"
              >
                See How It Works
              </button>
            </div>

            {/* Stats - Real Metrics */}
            <div className="grid grid-cols-3 gap-3 md:gap-8 mt-8 md:mt-16 max-w-3xl mx-auto px-4">
              <div className="text-center p-3 md:p-0">
                <div className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {metrics.totalRecipes > 0 ? metrics.totalRecipes.toLocaleString() : '0'}+
                </div>
                <div className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400">Recipes Generated</div>
              </div>
              <div className="text-center p-3 md:p-0">
                <div className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {metrics.totalUsers > 0 ? metrics.totalUsers.toLocaleString() : '0'}+
                </div>
                <div className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400">Happy Users</div>
              </div>
              <div className="text-center p-3 md:p-0">
                <div className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {metrics.averageRating}★
                </div>
                <div className="text-[10px] md:text-sm text-gray-600 dark:text-gray-400">User Rating</div>
              </div>
            </div>          </div>
        </div>
      </section>

      {/* Features Section - Match Background */}
      <section id="features" className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-4">
              Why Choose MoodMunch?
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Powerful features that make cooking easier, smarter, and more enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-2">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="group p-5 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl hover:shadow-2xl transition-all transform hover:scale-105 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-4">
              How It Works
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Get personalized recipes in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 px-2">
            {[
              {
                step: "1",
                title: "Share Your Mood",
                description: "Tell us how you're feeling today. Happy? Stressed? Energetic? We'll match your emotional state.",
                icon: "😊"
              },
              {
                step: "2",
                title: "List Ingredients",
                description: "Speak or type what you have. Our AI understands natural language - no formatting needed!",
                icon: "🥕"
              },
              {
                step: "3",
                title: "Get Your Recipe",
                description: "Receive a complete, personalized recipe with instructions, nutrition info, and a mood message.",
                icon: "🍽️"
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-center">
                  <div className="w-14 h-14 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl md:text-3xl font-bold shadow-xl">
                    {item.step}
                  </div>
                  <div className="text-4xl md:text-6xl mb-3 md:mb-4">{item.icon}</div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3 px-4">
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 px-4">
                    {item.description}
                  </p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-pink-600 to-purple-600 -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
       
      {/* Benefits Section - Replace Testimonials */}
      <section id="benefits" className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-4">
              Benefits You'll Love
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Real advantages that make everyday cooking better
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 px-2">
            {[
              {
                icon: Utensils,
                title: "Save Time Planning",
                description: "Stop wondering what to cook. Get instant recipe ideas tailored to what's already in your kitchen.",
                color: "from-pink-500 to-rose-600"
              },
              {
                icon: TrendingUp,
                title: "Reduce Food Waste",
                description: "Use ingredients before they expire. Our AI finds creative ways to combine what you have.",
                color: "from-purple-500 to-indigo-600"
              },
              {
                icon: Heart,
                title: "Eat Healthier",
                description: "Detailed nutrition info and health goal tracking keep you on your wellness journey.",
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: Sparkles,
                title: "Discover New Flavors",
                description: "Try cuisines and ingredient combinations you never would have thought of on your own.",
                color: "from-blue-500 to-cyan-600"
              },
              {
                icon: Brain,
                title: "Mood-Matched Meals",
                description: "Feel better with recipes designed to complement and enhance your emotional state.",
                color: "from-orange-500 to-amber-600"
              },
              {
                icon: Users,
                title: "Perfect for Everyone",
                description: "Respects dietary preferences, allergies, and health goals for the whole family.",
                color: "from-teal-500 to-cyan-600"
              }
            ].map((benefit, idx) => (
              <div 
                key={idx}
                className="group p-5 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${benefit.color} rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                  <benefit.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 md:mb-3">
                  {benefit.title}
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 px-4">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-pink-100 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of home cooks who are already creating amazing meals with MoodMunch
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="group px-6 md:px-10 py-3 md:py-5 bg-white text-pink-600 rounded-xl font-bold text-base md:text-xl hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-2 md:gap-3"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
          </button>
          <p className="text-pink-100 text-xs md:text-sm mt-3 md:mt-4 px-4">
            No credit card required • Free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <Logo size="default" className="w-8 h-8 md:w-10 md:h-10" />
              <span className="text-lg md:text-xl font-bold">MoodMunch</span>
            </div>
            <div className="text-gray-400 text-xs md:text-sm text-center md:text-left">
              © 2024 MoodMunch. Built with ❤️ using AI
            </div>
            <div className="flex gap-4 md:gap-6 text-xs md:text-sm">
              <button className="text-gray-400 hover:text-white transition-colors">Privacy</button>
              <button className="text-gray-400 hover:text-white transition-colors">Terms</button>
              <button className="text-gray-400 hover:text-white transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;