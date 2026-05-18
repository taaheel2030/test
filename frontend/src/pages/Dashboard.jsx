import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { DollarSign, AlertTriangle, TrendingDown, Settings, TrendingUp } from 'lucide-react';
import { SettingsContext } from '../App';

const Dashboard = ({ user }) => {
  const settings = useContext(SettingsContext);
  const [stats, setStats] = useState({
    salesToday: 0,
    lowStock: 0,
    wasteToday: 0
  });

  const [formData, setFormData] = useState({
    currency: settings.currency,
    targetProfitMargin: settings.targetProfitMargin
  });

  useEffect(() => {
    // Sync local state when settings context loads
    setFormData({ currency: settings.currency, targetProfitMargin: settings.targetProfitMargin });
  }, [settings.currency, settings.targetProfitMargin]);

  useEffect(() => {
    axios.get('/api/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    settings.updateSettings(formData);
    alert('تم حفظ الإعدادات بنجاح!');
  };

  // Simplified Profit Margin % = (Sales - Waste) / Sales * 100
  // Note: For accurate COGS, we should use estimated_cost * quantity from sales, but we'll use a simple metric here
  const sales = stats.salesToday || 0;
  const waste = stats.wasteToday || 0;
  const currentMargin = sales > 0 ? ((sales - waste) / sales) * 100 : 0;
  const targetMargin = parseFloat(settings.targetProfitMargin) || 0;
  const marginDiff = currentMargin - targetMargin;

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>نظرة عامة (لوحة القيادة)</h2>
      
      <div className="stat-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-color)' }}>
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>مبيعات اليوم</h3>
            <p>{sales.toFixed(2)} {settings.currency}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--danger-color)' }}>
            <TrendingDown size={24} />
          </div>
          <div className="stat-info">
            <h3>هدر اليوم</h3>
            <p>{waste.toFixed(2)} {settings.currency}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#F59E0B' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <h3>نواقص المخزون</h3>
            <p>{stats.lowStock || 0} أصناف</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div className="card" style={{ flex: 1 }}>
          <h3>مؤشر الأداء والربحية (KPI)</h3>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>نسبة الربح الحالية (هامش الربح التقريبي)</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: currentMargin >= targetMargin ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {currentMargin.toFixed(1)}%
            </div>
            
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#F3F4F6', borderRadius: '8px', display: 'flex', justifyContent: 'space-around' }}>
              <div>
                <p>النسبة المستهدفة</p>
                <strong>{targetMargin}%</strong>
              </div>
              <div>
                <p>الفرق</p>
                <strong style={{ color: marginDiff >= 0 ? 'var(--success-color)' : 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {marginDiff >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {Math.abs(marginDiff).toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        {user && user.role === 'admin' && (
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <Settings size={20} color="var(--primary-color)" />
              <h3>إعدادات النظام (للمدير فقط)</h3>
            </div>
            
            <form onSubmit={handleSaveSettings}>
              <div className="form-group">
                <label className="form-label">العملة المستخدمة</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.currency} 
                  onChange={e => setFormData({...formData, currency: e.target.value})} 
                  placeholder="مثال: ريال، جنيه، دولار"
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">نسبة الربح المستهدفة (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="form-control" 
                  value={formData.targetProfitMargin} 
                  onChange={e => setFormData({...formData, targetProfitMargin: e.target.value})} 
                  required 
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>سيتم استخدام هذه النسبة كمؤشر لقياس نجاح التشغيل.</p>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                حفظ الإعدادات
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
