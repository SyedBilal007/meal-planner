import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Check for redirect message from registration
  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    }
  }, [location]);

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (globalError) {
      setGlobalError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    setSuccess(false);

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare request body matching FastAPI schema
      const requestBody = {
        email: formData.email.trim(),
        password: formData.password,
      };

      // Call FastAPI backend login endpoint
      const response = await fetch('https://mealsync.up.railway.app/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error response formats from FastAPI
        if (response.status === 422) {
          // Validation errors from FastAPI
          const validationErrors: FieldErrors = {};
          if (data.detail && Array.isArray(data.detail)) {
            data.detail.forEach((err: any) => {
              const field = err.loc?.[err.loc.length - 1];
              if (field) {
                validationErrors[field as keyof FieldErrors] = err.msg;
              }
            });
            setErrors(validationErrors);
          } else {
            setGlobalError(data.detail || 'Validation failed');
          }
        } else if (response.status === 401 || response.status === 403) {
          // Invalid credentials
          setGlobalError(
            data.detail || 
            data.message || 
            'Incorrect email or password. Please check your credentials and try again.'
          );
        } else if (response.status === 400) {
          // Bad request
          if (data.detail?.includes('email') || data.detail?.includes('password')) {
            setGlobalError(data.detail || 'Invalid email or password');
          } else {
            setGlobalError(data.detail || data.message || 'Login failed');
          }
        } else {
          setGlobalError(data.detail || data.message || 'Login failed. Please try again.');
        }
        return;
      }

      // Success - handle response
      setSuccess(true);

      // Extract token (could be access_token, token, or accessToken)
      const token = data.access_token || data.token || data.accessToken;
      
      if (!token) {
        setGlobalError('Login successful but no token received. Please contact support.');
        return;
      }

      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Store token type if provided
      if (data.token_type) {
        localStorage.setItem('token_type', data.token_type);
      }

      // Store user data if provided
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect to home after a brief success message
      setTimeout(() => {
        // Clear any location state
        navigate('/', { replace: true });
        // Reload to trigger auth context update
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Network errors
      if (error.name === 'TypeError' || error.message?.includes('fetch')) {
        setGlobalError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setGlobalError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <Calendar className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-900">MealSync</h1>
        </div>

        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Login</h2>

        {/* Success Message (from registration redirect) */}
        {success && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{(location.state as { message?: string } | null)?.message || 'Login successful! Redirecting...'}</span>
          </motion.div>
        )}

        {/* Global Error Message */}
        {globalError && !success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading || success}
            whileHover={{ scale: loading || success ? 1 : 1.02 }}
            whileTap={{ scale: loading || success ? 1 : 0.98 }}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : success ? (
              'Login Successful!'
            ) : (
              'Login'
            )}
          </motion.button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
