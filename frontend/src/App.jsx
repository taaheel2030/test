import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import Sales from './pages/Sales';
import Waste from './pages/Waste';
import Users from './pages/Users';
import Login from './pages/Login';
import Reports from './pages/Reports';

export const SettingsContext = createContext({ currency: 'ريال', targetProfitMargin: 30, updateSettings: () => { } });

function App() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({ currency: 'ريال', targetProfitMargin: 30 });

  useEffect(() => {
    axios.get('/api/settings')
      .then(res => setSettings(res.data))
      .catch(err => console.error(err));
  }, []);

  const updateSettings = (newSettings) => {
    axios.post('/api/settings', newSettings)
      .then(res => setSettings(res.data));
  };

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  // Simple permission check wrapper
  const hasPermission = (page) => {
    if (user.role === 'admin') return true;
    const perms = JSON.parse(user.permissions || '[]');
    return perms.includes('all') || perms.includes(page);
  };

  const ProtectedRoute = ({ page, element }) => {
    return hasPermission(page) ? element : <div style={{ padding: '20px' }}><h3>عذراً، لا تملك صلاحية للوصول إلى هذه الصفحة</h3></div>;
  };

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout user={user} onLogout={() => setUser(null)} />}>
            <Route index element={<Dashboard user={user} />} />
            <Route path="inventory" element={<ProtectedRoute page="inventory" element={<Inventory />} />} />
            <Route path="recipes" element={<ProtectedRoute page="recipes" element={<Recipes />} />} />
            <Route path="sales" element={<ProtectedRoute page="sales" element={<Sales user={user} />} />} />
            <Route path="waste" element={<ProtectedRoute page="waste" element={<Waste />} />} />
            <Route path="reports" element={<ProtectedRoute page="reports" element={<Reports />} />} />
            <Route path="users" element={<ProtectedRoute page="users" element={<Users />} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsContext.Provider>
  );
}

export default App;
