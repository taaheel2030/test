import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Minus, Trash2, Printer, Lock } from 'lucide-react';
import { SettingsContext } from '../App';

const Sales = ({ user }) => {
  const settings = useContext(SettingsContext);
  const [recipes, setRecipes] = useState([]);
  const [cart, setCart] = useState([]);
  
  // Shift Management
  const [activeShift, setActiveShift] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [startingCash, setStartingCash] = useState(0);
  const [endingCash, setEndingCash] = useState(0);
  const [shiftClosing, setShiftClosing] = useState(false);

  // V2 POS Features
  const [orderType, setOrderType] = useState('takeaway');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    // Check if user has active shift
    if (user && user.id) {
      axios.get(`/api/shifts/active/${user.id}`)
        .then(res => {
          if (res.data) {
            setActiveShift(res.data);
          } else {
            setShowShiftModal(true);
          }
        });
    }

    axios.get('/api/recipes').then(res => setRecipes(res.data));
  }, [user]);

  const handleOpenShift = (e) => {
    e.preventDefault();
    axios.post('/api/shifts/open', { user_id: user.id, starting_cash: startingCash })
      .then(res => {
        setActiveShift(res.data);
        setShowShiftModal(false);
      });
  };

  const handleCloseShift = (e) => {
    e.preventDefault();
    axios.post(`/api/shifts/close/${activeShift.id}`, { ending_cash_actual: endingCash })
      .then(res => {
        alert(`تم إغلاق الوردية.\nالنقد المتوقع: ${res.data.expected}\nالنقد الفعلي: ${endingCash}`);
        setActiveShift(null);
        setShiftClosing(false);
        setShowShiftModal(true);
      });
  };

  const addToCart = (recipe) => {
    const existing = cart.find(item => item.recipe_id === recipe.id);
    if (existing) {
      updateQuantity(recipe.id, 1);
    } else {
      setCart([...cart, { recipe_id: recipe.id, name: recipe.name, price: recipe.selling_price, quantity: 1, total_price: recipe.selling_price }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map(item => {
      if (item.recipe_id === id) {
        const newQ = item.quantity + change;
        if (newQ < 1) return item;
        return { ...item, quantity: newQ, total_price: newQ * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.recipe_id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (tax / 100);
  const netTotal = afterDiscount + taxAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return alert('السلة فارغة');
    if (!activeShift) return alert('الرجاء فتح وردية أولاً');

    const payload = {
      items: cart,
      user_id: user.id,
      shift_id: activeShift.id,
      order_type: orderType,
      discount: discountAmount,
      tax: taxAmount,
      net_total: netTotal
    };

    axios.post('/api/sales', payload)
      .then(() => {
        // Trigger print after success
        window.print();
        setCart([]);
        setDiscount(0);
        setOrderType('takeaway');
      })
      .catch(err => {
        console.error(err);
        alert('حدث خطأ أثناء الدفع');
      });
  };

  if (!activeShift && showShiftModal && !shiftClosing) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
        <h3>فتح وردية كاشير جديدة</h3>
        <form onSubmit={handleOpenShift} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label className="form-label">النقد في الدرج (بداية اليوم)</label>
            <input type="number" className="form-control" value={startingCash} onChange={e => setStartingCash(e.target.value)} required min="0" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>فتح الوردية</button>
        </form>
      </div>
    );
  }

  if (shiftClosing) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
        <h3>إغلاق الوردية</h3>
        <form onSubmit={handleCloseShift} style={{ marginTop: '20px' }}>
          <div className="form-group">
            <label className="form-label">إجمالي النقد الفعلي بالدرج الآن</label>
            <input type="number" className="form-control" value={endingCash} onChange={e => setEndingCash(e.target.value)} required min="0" />
          </div>
          <button type="submit" className="btn btn-danger" style={{ width: '100%' }}>تأكيد الإغلاق</button>
          <button type="button" className="btn" onClick={() => setShiftClosing(false)} style={{ width: '100%', marginTop: '10px' }}>إلغاء</button>
        </form>
      </div>
    );
  }

  return (
    <div className="pos-container" style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 100px)' }}>
      {/* 80mm Print Receipt Template (Hidden by default, visible only on print) */}
      <div className="print-receipt" style={{ display: 'none' }}>
        <h2 style={{ textAlign: 'center' }}>TAAHEEL Takeaway</h2>
        <p style={{ textAlign: 'center' }}>تاريخ: {new Date().toLocaleString('ar-EG')}</p>
        <p style={{ textAlign: 'center' }}>الكاشير: {user?.username}</p>
        <p style={{ textAlign: 'center' }}>نوع الطلب: {orderType}</p>
        <hr style={{ borderTop: '1px dashed #000' }}/>
        <table style={{ width: '100%', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'right' }}>الصنف</th>
              <th style={{ textAlign: 'center' }}>كمية</th>
              <th style={{ textAlign: 'left' }}>إجمالي</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, idx) => (
              <tr key={idx}>
                <td style={{ textAlign: 'right' }}>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'left' }}>{item.total_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr style={{ borderTop: '1px dashed #000' }}/>
        <p style={{ textAlign: 'left' }}>المجموع: {subtotal.toFixed(2)}</p>
        {discount > 0 && <p style={{ textAlign: 'left' }}>الخصم: {discountAmount.toFixed(2)}</p>}
        {tax > 0 && <p style={{ textAlign: 'left' }}>الضريبة: {taxAmount.toFixed(2)}</p>}
        <h3 style={{ textAlign: 'left' }}>الصافي: {netTotal.toFixed(2)} {settings.currency}</h3>
        <p style={{ textAlign: 'center', marginTop: '10px' }}>شكراً لزيارتكم!</p>
      </div>

      <div className="pos-products no-print" style={{ flex: 2, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>نقطة البيع (POS)</h2>
          {activeShift && (
            <button className="btn btn-danger" onClick={() => setShiftClosing(true)}>
              <Lock size={16} /> إغلاق الوردية
            </button>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          {recipes.map(recipe => (
            <div 
              key={recipe.id} 
              className="card" 
              style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s', padding: '15px' }}
              onClick={() => addToCart(recipe)}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h4 style={{ marginBottom: '10px' }}>{recipe.name}</h4>
              <p style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{recipe.selling_price} {settings.currency}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pos-cart card no-print" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
          <ShoppingCart size={24} color="var(--primary-color)" />
          <h3 style={{ margin: 0 }}>سلة الطلبات</h3>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <select className="form-control" value={orderType} onChange={e => setOrderType(e.target.value)}>
            <option value="takeaway">تيك أوي (Takeaway)</option>
            <option value="dine_in">صالة (Dine-in)</option>
            <option value="delivery">توصيل (Delivery)</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '50px' }}>
              السلة فارغة
            </div>
          ) : (
            cart.map(item => (
              <div key={item.recipe_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px dashed #eee' }}>
                <div>
                  <strong>{item.name}</strong>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.total_price} {settings.currency}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button className="btn" style={{ padding: '4px 8px' }} onClick={() => updateQuantity(item.recipe_id, -1)}><Minus size={14}/></button>
                  <span style={{ fontWeight: 'bold' }}>{item.quantity}</span>
                  <button className="btn" style={{ padding: '4px 8px' }} onClick={() => updateQuantity(item.recipe_id, 1)}><Plus size={14}/></button>
                  <button className="btn btn-danger" style={{ padding: '4px 8px', marginLeft: '10px' }} onClick={() => removeFromCart(item.recipe_id)}><Trash2 size={14}/></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '20px', borderTop: '2px solid var(--border-color)', paddingTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>المجموع:</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
            <span>خصم (%):</span>
            <input type="number" className="form-control" style={{ width: '80px', padding: '5px' }} value={discount} onChange={e => setDiscount(e.target.value)} min="0" max="100"/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
            <span>ضريبة (%):</span>
            <input type="number" className="form-control" style={{ width: '80px', padding: '5px' }} value={tax} onChange={e => setTax(e.target.value)} min="0" max="100"/>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px' }}>
            <span>الصافي:</span>
            <span style={{ color: 'var(--success-color)' }}>{netTotal.toFixed(2)} {settings.currency}</span>
          </div>

          <button 
            className="btn btn-success" 
            style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '1.1rem' }}
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            <Printer size={20} style={{ marginLeft: '10px' }} />
            الدفع وطباعة الفاتورة
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
