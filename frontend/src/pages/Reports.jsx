import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import ActionButtons from '../components/ActionButtons';
import { SettingsContext } from '../App';

const Reports = () => {
  const settings = useContext(SettingsContext);
  const [sales, setSales] = useState([]);
  const [waste, setWaste] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  
  useEffect(() => {
    axios.get('/api/sales').then(res => setSales(res.data));
    axios.get('/api/waste').then(res => setWaste(res.data));
    axios.get('/api/inventory').then(res => {
      // Filter only low stock items
      const low = res.data.filter(item => item.quantity <= item.low_stock_threshold);
      setLowStock(low);
    });
  }, []);

  const totalSales = sales.reduce((sum, item) => sum + item.total_price, 0);
  const totalWaste = waste.reduce((sum, item) => sum + item.cost, 0);
  
  const reportData = [
    { type: 'إجمالي المبيعات', amount: totalSales },
    { type: 'إجمالي الهدر', amount: totalWaste },
    { type: 'صافي الإيرادات (قبل التكلفة)', amount: totalSales - totalWaste }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2>التقارير المالية والتشغيلية</h2>
        <ActionButtons data={reportData} filename="Financial_Reports_Export" />
      </div>

      <div className="stat-grid" style={{ marginBottom: '30px' }}>
        <div className="stat-card" style={{ backgroundColor: 'var(--success-color)', color: 'white' }}>
          <div className="stat-info">
            <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>إجمالي المبيعات</h3>
            <p style={{ color: 'white' }}>{totalSales.toFixed(2)} {settings.currency}</p>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--danger-color)', color: 'white' }}>
          <div className="stat-info">
            <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>إجمالي تكلفة الهدر</h3>
            <p style={{ color: 'white' }}>{totalWaste.toFixed(2)} {settings.currency}</p>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
          <div className="stat-info">
            <h3 style={{ color: 'rgba(255,255,255,0.8)' }}>المؤشر (Waste % of Sales)</h3>
            <p style={{ color: 'white' }}>{totalSales > 0 ? ((totalWaste / totalSales) * 100).toFixed(1) : 0}%</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ color: 'var(--danger-color)' }}>تقرير نواقص المخزون (تحت الحد الخطر)</h3>
          <ActionButtons data={lowStock} filename="Low_Stock_Report" />
        </div>
        <table>
          <thead>
            <tr>
              <th>اسم الصنف</th>
              <th>الكمية الحالية</th>
              <th>حد النقص الخطر</th>
              <th>وحدة القياس</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map(item => (
              <tr key={item.id} style={{ backgroundColor: '#FEE2E2' }}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td style={{ fontWeight: 'bold', color: 'var(--danger-color)' }}>{item.low_stock_threshold}</td>
                <td>{item.recipe_unit}</td>
              </tr>
            ))}
            {lowStock.length === 0 && (
              <tr><td colSpan="4" style={{textAlign: 'center', color: 'var(--success-color)', fontWeight: 'bold'}}>المخزون بوضع آمن - لا توجد نواقص</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>تفصيل المبيعات الأخيرة</h3>
        <table style={{ marginTop: '15px' }}>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الوصفة</th>
              <th>الكمية</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {sales.slice(0, 10).map(s => (
              <tr key={s.id}>
                <td>{new Date(s.sale_date).toLocaleString('ar-EG')}</td>
                <td>{s.recipe_name}</td>
                <td>{s.quantity}</td>
                <td>{s.total_price} {settings.currency}</td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan="4" style={{textAlign:'center'}}>لا توجد مبيعات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
