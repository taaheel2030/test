import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  ShoppingCart, 
  Trash2, 
  FileBarChart, 
  Users 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', name: 'لوحة التحكم', icon: <LayoutDashboard size={20} /> },
    { path: '/inventory', name: 'المخزون', icon: <Package size={20} /> },
    { path: '/recipes', name: 'الوصفات', icon: <ChefHat size={20} /> },
    { path: '/sales', name: 'المبيعات', icon: <ShoppingCart size={20} /> },
    { path: '/waste', name: 'الهالك', icon: <Trash2 size={20} /> },
    { path: '/reports', name: 'التقارير', icon: <FileBarChart size={20} /> },
    { path: '/users', name: 'المستخدمين', icon: <Users size={20} /> },
  ];

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="sidebar-header" style={{ padding: '20px 10px' }}>
        <img src="/logo.png" alt="Taaheel Logo" style={{ width: '100px', marginBottom: '10px' }} />
        <div>TAAHEEL Takeaway</div>
      </div>
      <ul className="nav-links" style={{ flex: 1 }}>
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div style={{ padding: '20px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        إعداد وتطوير د. عمرو عثمان استشاري التغذية العلاجية وصحة وسلامة الغذاء - 2026
      </div>
    </div>
  );
};

const Topbar = ({ user, onLogout }) => {
  return (
    <div className="topbar">
      <div>
        <h2>نظام إدارة المطعم</h2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span>المستخدم: {user?.username} ({user?.role === 'admin' ? 'مدير' : 'كاشير'})</span>
        <button onClick={onLogout} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>تسجيل خروج</button>
      </div>
    </div>
  );
};

const Layout = ({ user, onLogout }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar user={user} onLogout={onLogout} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
