import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TaxTronLogo from "./TaxTronLogo";

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state, default to admin dashboard
  const from = location.state?.from?.pathname || "/admin/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    // Read the actual form fields, including Chrome/password-manager autofill.
    const fields = new FormData(e.currentTarget);
    const username = String(fields.get('username') || '').trim();
    const password = String(fields.get('password') || '');
    setError("");
    if (!username || !password) {
      setError('Enter your administrator username and password.');
      return;
    }
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username.trim(),
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Store the admin token
        localStorage.setItem('adminToken', data.token);
        login();
        navigate(from, { replace: true });
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center">
      <div className="mb-16">
        <TaxTronLogo size="4xl" showText={false} />
      </div>
      <div className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-md text-center border border-green-200">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Admin Login
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 py-3 px-4 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label htmlFor="admin-username" className="block text-gray-700 font-medium mb-2">Username</label>
            <input
              id="admin-username"
              name="username"
              type="text"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              id="admin-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              required
            />
            <button type="button" className="mt-2 text-sm text-green-700 underline" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Hide password' : 'Show password'}</button>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white font-semibold py-3 rounded-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            style={{backgroundColor: '#8CC152'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7AB142'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#8CC152'}
          >
            {submitting ? 'Signing in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
