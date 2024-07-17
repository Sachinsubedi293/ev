import React, { useContext } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PremiumLogin from '../Templates/Components/Login';
import MCQPage from '../Templates/Pages/Mcqpage';
import Signup from '../Templates/Components/SignUp';
import Admin from '../Templates/Pages/Admin/Admin';
import AuthContext, { AuthProvider } from '../Context/AuthContext';


const Router = () => {
  const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>; // or a spinner or some loading indicator
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PremiumLogin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mcq" element={isAuthenticated ? <MCQPage /> : "First Login Please"} />
        <Route path="/admin" element={isAuthenticated && isAdmin ? <Admin /> : "First login with admin id to enter this page."} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <AuthProvider>
    <Router />
  </AuthProvider>
);

export default App;
