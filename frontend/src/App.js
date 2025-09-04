import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// 导入页面组件
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import UserManagePage from './pages/UserManagePage';
import CategoryManagePage from './pages/CategoryManagePage';
import OnlineStatusPage from './pages/OnlineStatusPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// 导入布局组件
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import TokenValidator from './components/TokenValidator';

function App() {
  return (
    <div className="app">
      <TokenValidator />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminLayout>
                <UserManagePage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedRoute>
              <AdminLayout>
                <CategoryManagePage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/online-status" element={
            <ProtectedRoute>
              <AdminLayout>
                <OnlineStatusPage />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;