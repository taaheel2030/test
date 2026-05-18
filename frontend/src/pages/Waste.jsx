import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import ActionButtons from '../components/ActionButtons';

const Waste = () => {
  const [wasteRecords, setWasteRecords] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    inventory_id: '',
    quantity: '',
    waste_type: 'تخزين',
    reason: '',
    user_id: 1
  });

  const fetchData = () => {
    axios.get('/api/waste').then(res => setWasteRecords(res.data));
    axios.get('/api/inventory').then(res => setInventory(res.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/waste', formData)
      .then(() => {
        fetchData();
        setShowModal(false);
        setFormData({ inventory_id: '', quantity: 0, waste_type: 'تالف', reason: '', user_id: 1 });
      })
      .catch(err => {
        console.error(err);
        alert('حدث خطأ أثناء تسجيل الهالك. قد يكون السبب أن الكمية المدخلة غير صحيحة، أو الخادم متوقف.');
      });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2>إدارة الهالك والتوالف</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ActionButtons data={wasteRecords} filename="Waste_Export" />
          <button className="btn btn-danger" onClick={() => setShowModal(true)}>
            <Plus size={16} /> تسجيل هالك جديد
          </button>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>المكون</th>
              <th>الكمية المستهلكة</th>
              <th>نوع الهدر</th>
              <th>التكلفة (خسارة)</th>
              <th>السبب</th>
            </tr>
          </thead>
          <tbody>
            {wasteRecords.map(w => (
              <tr key={w.id}>
                <td>{new Date(w.waste_date).toLocaleString('ar-EG')}</td>
                <td>{w.inventory_name}</td>
                <td>{w.quantity}</td>
                <td>{w.waste_type}</td>
                <td style={{ color: 'var(--danger-color)' }}>{w.cost.toFixed(2)} ريال</td>
                <td>{w.reason}</td>
              </tr>
            ))}
            {wasteRecords.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>لا توجد سجلات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>تسجيل هالك جديد</h3>
              <button className="btn" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <form id="wasteForm" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">المكون التالف</label>
                  <select className="form-control" value={formData.inventory_id} onChange={e => setFormData({...formData, inventory_id: e.target.value})} required>
                    <option value="">اختر المكون...</option>
                    {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (المتاح: {i.quantity} {i.recipe_unit})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الكمية المهدرة (بوحدة الوصفة)</label>
                  <input type="number" step="0.01" className="form-control" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">نوع الهدر</label>
                  <select className="form-control" value={formData.waste_type} onChange={e => setFormData({...formData, waste_type: e.target.value})} required>
                    <option value="تحضير">هدر التحضير (تقشير، تقطيع)</option>
                    <option value="طهي">هدر الطهي (تبخير، حرق)</option>
                    <option value="تقديم">هدر التقديم (أخطاء طلبات)</option>
                    <option value="تخزين">هدر التخزين (تلف، انتهاء صلاحية)</option>
                    <option value="متعمد">هدر متعمد (وجبات موظفين، ضيافة)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">سبب الهدر (ملاحظات)</label>
                  <input type="text" className="form-control" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>إلغاء</button>
              <button className="btn btn-danger" type="submit" form="wasteForm">حفظ وخصم من المخزون</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Waste;
