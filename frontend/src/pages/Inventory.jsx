import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';
import ActionButtons from '../components/ActionButtons';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    purchase_unit: '',
    recipe_unit: '',
    conversion_rate: 1,
    quantity: 0,
    low_stock_threshold: 0,
    cost_per_purchase_unit: 0,
    yield_percent: 100
  });
  const [purchaseData, setPurchaseData] = useState({
    inventory_id: null,
    quantity_purchased: 0,
    cost_per_purchase_unit: 0
  });
  const [editId, setEditId] = useState(null);

  const fetchInventory = () => {
    axios.get('/api/inventory')
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      axios.put(`/api/inventory/${editId}`, formData)
        .then(() => {
          fetchInventory();
          setShowModal(false);
          setEditId(null);
          setFormData({name: '', purchase_unit: '', recipe_unit: '', conversion_rate: 1, quantity: 0, low_stock_threshold: 0, cost_per_purchase_unit: 0, yield_percent: 100});
        })
        .catch(err => console.error(err));
    } else {
      axios.post('/api/inventory', formData)
        .then(() => {
          fetchInventory();
          setShowModal(false);
          setFormData({name: '', purchase_unit: '', recipe_unit: '', conversion_rate: 1, quantity: 0, low_stock_threshold: 0, cost_per_purchase_unit: 0, yield_percent: 100});
        })
        .catch(err => console.error(err));
    }
  };

  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/purchases', { ...purchaseData, user_id: 1 }) // Hardcoded user_id for simplicity, in a real app this should be from auth context
      .then(() => {
        fetchInventory();
        setShowPurchaseModal(false);
        setPurchaseData({ inventory_id: null, quantity_purchased: 0, cost_per_purchase_unit: 0 });
      })
      .catch(err => console.error(err));
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData({
      name: item.name,
      purchase_unit: item.purchase_unit,
      recipe_unit: item.recipe_unit,
      conversion_rate: item.conversion_rate,
      quantity: item.quantity,
      low_stock_threshold: item.low_stock_threshold || 0,
      cost_per_purchase_unit: item.cost_per_purchase_unit,
      yield_percent: item.yield_percent
    });
    setShowModal(true);
  };

  const handlePurchase = (item) => {
    setPurchaseData({
      inventory_id: item.id,
      quantity_purchased: 0,
      cost_per_purchase_unit: item.cost_per_purchase_unit
    });
    setShowPurchaseModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
      axios.delete(`/api/inventory/${id}`)
        .then(() => fetchInventory())
        .catch(err => console.error(err));
    }
  };

  const handleBulkImport = async (data) => {
    let successCount = 0;
    for (const row of data) {
      if (row.name) {
        try {
          await axios.post('/api/inventory', {
            name: row.name,
            purchase_unit: row.purchase_unit || 'كجم',
            recipe_unit: row.recipe_unit || 'جرام',
            conversion_rate: row.conversion_rate || 1000,
            quantity: row.quantity || 0,
            low_stock_threshold: row.low_stock_threshold || 0,
            cost_per_purchase_unit: row.cost_per_purchase_unit || 0,
            yield_percent: row.yield_percent || 100
          });
          successCount++;
        } catch (e) {
          console.error(e);
        }
      }
    }
    alert(`تم استيراد ${successCount} صنف بنجاح!`);
    fetchInventory();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2>إدارة المخزون</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ActionButtons data={items} filename="Inventory_Export" onImport={handleBulkImport} />
          <button className="btn btn-primary" onClick={() => {
            setEditId(null);
            setFormData({name: '', purchase_unit: '', recipe_unit: '', conversion_rate: 1, quantity: 0, low_stock_threshold: 0, cost_per_purchase_unit: 0, yield_percent: 100});
            setShowModal(true);
          }}>
            <Plus size={16} /> إضافة صنف
          </button>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>اسم الصنف</th>
              <th>الكمية الحالية</th>
              <th>حد النقص الخطر</th>
              <th>وحدة الشراء</th>
              <th>سعر الشراء</th>
              <th>وحدة الوصفة</th>
              <th>نسبة التصافي (Yield)</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ backgroundColor: item.quantity <= item.low_stock_threshold ? '#FEE2E2' : 'transparent' }}>
                <td>{item.name}</td>
                <td>{item.quantity} {item.recipe_unit}</td>
                <td style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>{item.low_stock_threshold}</td>
                <td>{item.purchase_unit}</td>
                <td>{item.cost_per_purchase_unit}</td>
                <td>{item.recipe_unit}</td>
                <td>{item.yield_percent}%</td>
                <td>
                  <button className="btn btn-success" style={{ marginLeft: '5px' }} onClick={() => handlePurchase(item)} title="تسجيل مشتريات">
                    <ShoppingCart size={16} />
                  </button>
                  <button className="btn btn-primary" style={{ marginLeft: '5px' }} onClick={() => handleEdit(item)} title="تعديل">
                    <Edit size={16} />
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(item.id)} title="حذف">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>لا توجد بيانات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editId ? 'تعديل صنف' : 'إضافة صنف جديد للمخزون'}</h3>
              <button className="btn" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <form id="inventoryForm" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">اسم الصنف</label>
                  <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">وحدة الشراء (مثال: كجم، لتر)</label>
                    <input type="text" className="form-control" value={formData.purchase_unit} onChange={e => setFormData({...formData, purchase_unit: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">سعر الشراء</label>
                    <input type="number" step="0.01" className="form-control" value={formData.cost_per_purchase_unit} onChange={e => setFormData({...formData, cost_per_purchase_unit: e.target.value})} required />
                  </div>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">وحدة الوصفة (الاستخدام، مثال: جرام، مل)</label>
                    <input type="text" className="form-control" value={formData.recipe_unit} onChange={e => setFormData({...formData, recipe_unit: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">معامل التحويل (مثال: 1000)</label>
                    <input type="number" step="0.01" className="form-control" value={formData.conversion_rate} onChange={e => setFormData({...formData, conversion_rate: e.target.value})} required />
                  </div>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">الكمية الافتتاحية (بوحدة الوصفة)</label>
                    <input type="number" step="0.01" className="form-control" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">الحد الخطر لنقص المخزون</label>
                    <input type="number" step="0.01" className="form-control" value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: e.target.value})} />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">نسبة التصافي % (Yield)</label>
                    <input type="number" step="1" className="form-control" value={formData.yield_percent} onChange={e => setFormData({...formData, yield_percent: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>إلغاء</button>
              <button className="btn btn-success" type="submit" form="inventoryForm">حفظ</button>
            </div>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>تسجيل مشتريات للصنف</h3>
              <button className="btn" onClick={() => setShowPurchaseModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <form id="purchaseForm" onSubmit={handlePurchaseSubmit}>
                <div className="form-group">
                  <label className="form-label">الكمية المشتراة (بوحدة الشراء)</label>
                  <input type="number" step="0.01" className="form-control" value={purchaseData.quantity_purchased} onChange={e => setPurchaseData({...purchaseData, quantity_purchased: parseFloat(e.target.value) || 0})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">سعر الوحدة الحالي (سيتم تحديث السعر في المخزون إن تغير)</label>
                  <input type="number" step="0.01" className="form-control" value={purchaseData.cost_per_purchase_unit} onChange={e => setPurchaseData({...purchaseData, cost_per_purchase_unit: parseFloat(e.target.value) || 0})} required />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowPurchaseModal(false)}>إلغاء</button>
              <button className="btn btn-success" type="submit" form="purchaseForm">حفظ وتسجيل</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
