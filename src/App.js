import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login         from './js/Login';
import Register      from './js/Register';
import Home          from './js/Home';
import Masters       from './js/Masters';
import Create_client from './js/Create_client.jsx';
import Dashboard     from './js/Dashboard.jsx';
import Profile       from './js/Profile.jsx';
import AdminPanel    from './js/AdminPanel.jsx';
import PrivateRoute  from './js/PrivateRoute.jsx';
import './App.css';

function RoleRedirect() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();
  if (!user) return <Navigate to="/login" replace />;
  if (user.is_super_admin || user.role === "admin" || user.role === "boss")
    return <Navigate to="/admin"   replace />;
  if (user.role === "master")
    return <Navigate to="/masters" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/redirect" element={<RoleRedirect />} />

        <Route path="/masters" element={
          <PrivateRoute allowedRoles={["master","admin","boss"]}>
            <Masters />
          </PrivateRoute>
        } />
        <Route path="/create_client" element={
          <PrivateRoute allowedRoles={["master","admin","boss"]}>
            <Create_client />
          </PrivateRoute>
        } />
        <Route path="/dashboard" element={
          <PrivateRoute allowedRoles={["master","admin","boss"]}>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute allowedRoles={["master","admin","boss"]}>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute allowedRoles={["admin","boss"]}>
            <AdminPanel />
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
