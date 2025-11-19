// frontend/src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Mic, ChefHat, Heart, TrendingUp, ArrowRight, Check, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Home Cook",
      text: "MoodMunch understands what I need! When I'm stressed, it suggests comfort food. When I'm energetic, it gives me exciting recipes to try.",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Busy Professional",
      text: "The voice input is a game-changer. I just list what's in my fridge while cooking, and boom - perfect recipe suggestions!",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Health Enthusiast",
      text: "Finally, an app that respects my dietary preferences AND my mood. The nutrition tracking is incredibly detailed.",
      rating: 5
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
        scrolled ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
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
              <button onClick={() => scrollToSection('testimonials')} className="text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                Testimonials
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
            <div className="md:hidden py-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                How It Works
              </button>
              <button onClick={() => scrollToSection('testimonials')} className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                Testimonials
              </button>
              <button 
                onClick={() => window.location.href = '/login'}
                className="block w-full px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold text-center"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full mb-6 border border-pink-200 dark:border-pink-800">
              <Sparkles className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI-Powered Recipe Generation</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Cook With Your
              <span className="block bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Mood & Ingredients
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Tell us what you have and how you feel. Our AI creates personalized recipes that match your mood, ingredients, and dietary needs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => window.location.href = '/login'}
                className="group px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2"
              >
                Start Cooking Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold text-lg hover:shadow-xl transition-all border-2 border-gray-200 dark:border-gray-700"
              >
                See How It Works
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 md:mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">10K+</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Recipes Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">5K+</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1">4.9★</div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose MoodMunch?
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful features that make cooking easier, smarter, and more enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="group p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl hover:shadow-2xl transition-all transform hover:scale-105 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get personalized recipes in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
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
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-6 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-xl">
                    {item.step}
                  </div>
                  <div className="text-5xl md:text-6xl mb-4">{item.icon}</div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
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

      {/* Testimonials */}
      <section id="testimonials" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Home Cooks
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              See what our users are saying about MoodMunch
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, idx) => (
              <div 
                key={idx}
                className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-lg md:text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Join thousands of home cooks who are already creating amazing meals with MoodMunch
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="group px-8 md:px-10 py-4 md:py-5 bg-white text-pink-600 rounded-xl font-bold text-lg md:text-xl hover:shadow-2xl transition-all transform hover:scale-105 inline-flex items-center gap-3"
          >
            Get Started Free
            <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
          <p className="text-pink-100 text-sm mt-4">
            No credit card required • Free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">MoodMunch</span>
            </div>
            <div className="text-gray-400 text-sm text-center md:text-left">
              © 2024 MoodMunch. Built with ❤️ using AI
            </div>
            <div className="flex gap-6 text-sm">
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