import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import {jwtDecode} from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTokenValidity = async () => {
      const accessToken = Cookies.get('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
  
      if (!accessToken && refreshToken) {
        try {
          const response = await axios.post(`${process.env.REACT_APP_BACEND_URL_CUSTOM}/api/refresh`, { refreshToken });
          const newAccessToken = response.data.accessToken;
          Cookies.set('accessToken', newAccessToken);
          setIsAuthenticated(true);
          const decodedToken = jwtDecode(newAccessToken);
          setIsAdmin(decodedToken.role === 'admin');
        } catch (error) {
          console.error('Failed to refresh token:', error);
          Cookies.remove('accessToken');
          localStorage.removeItem('refreshToken');
        }
      } else if (accessToken) {
        setIsAuthenticated(true);
        const decodedToken = jwtDecode(accessToken);
        setIsAdmin(decodedToken.role === 'admin');
      }
      setLoading(false);
    };
  
    checkTokenValidity();
  }, [setIsAuthenticated, setIsAdmin, setLoading]); // Updated dependency array
  

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, setIsAuthenticated, setIsAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
