import React, { useState, useContext } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../Context/AuthContext';

const PremiumLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState(null); // null means no message initially
  const { setIsAuthenticated, setIsAdmin } = useContext(AuthContext);
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/login`, {
        username,
        password
      });

      console.log('Login successful:', response.data.user);
      alert("Login successful");
      setLoginStatus({ type: 'uccess', message: 'Login successful' });
      Cookies.set('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setIsAuthenticated(true);
      setIsAdmin(response.data.admin); 
      setTimeout(() => {
        if(response.data.admin){
          navigate("/admin");
        }else{
          navigate("/mcq");
        }
      }, 2000);
    } catch (error) {
      console.error('Login failed:', error.response?.data?.error || error.message);
      setLoginStatus({ type: 'error', message: error.response?.data?.error || 'Login failed. Please try again.' });
    }

    setLocalLoading(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Welcome!</h2>
        {loginStatus && (
          <p className={`text-center text-${loginStatus.type === 'uccess'? 'green' : 'ed'}-600`}>
            {loginStatus.message}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              UserName
            </label>
            <input
              type="text"
              id="username"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={localLoading}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={localLoading}
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-indigo-600 text-white py-2 rounded-md ${localLoading? 'cursor-not-allowed opacity-50' : 'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'}`}
            disabled={localLoading}
          >
            {localLoading? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="text-indigo-600 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

export default PremiumLogin;