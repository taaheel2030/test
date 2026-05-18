import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import ActionButtons from '../components/ActionButtons';
import { SettingsContext } from '../App';

const Recipes = () => {
  const settings = useContext(SettingsContext);
  const [recipes, setRecipes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    selling_price: 0,
    instructions: '',
    image_url: '',
    ingredients: []
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentIngredient, setCurrentIngredient] = useState({ inventory_id: '', quantity_needed: 0 });

  const fetchData = () => {
    axios.get('/api/recipes').then(res => setRecipes(res.data));
    axios.get('/api/inventory').then(res => setInventory(res.data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addIngredient = () => {
    if (currentIngredient.inventory_id && currentIngredient.quantity_needed > 0) {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, currentIngredient]
      });
      setCurrentIngredient({ inventory_id: '', quantity_needed: 0 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = formData.image_url;
    
    if (selectedFile) {
      const uploadData = new FormData();
      uploadData.append('image', selectedFile);
      try {
        const uploadRes = await axios.post('/api/upload', uploadData);
        imageUrl = uploadRes.data.imageUrl;
      } catch (err) {
        alert('فشل رفع الصورة');
        return;
      }
    }

    axios.post('/api/recipes', { ...formData, image_url: imageUrl })
      .then(() => {
        fetchData();
        setShowModal(false);
        setFormData({ name: '', category: '', selling_price: 0, instructions: '', image_url: '', ingredients: [] });
        setSelectedFile(null);
      })
      .catch(err => {
        console.error(err);
        alert('حدث خطأ أثناء حفظ الوصفة. تأكد من اتصال الخادم وادخال جميع البيانات المطلوبة.');
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف الوصفة؟')) {
      axios.delete(`/api/recipes/${id}`).then(() => fetchData());
    }
  };

  const getInventoryName = (id) => {
    const item = inventory.find(i => i.id == id);
    return item ? item.name : '';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2>إدارة الوصفات (تكليف المنتج)</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <ActionButtons data={recipes} filename="Recipes_Export" />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> إضافة وصفة
          </button>
        </div>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>اسم الوصفة</th>
              <th>صورة المستند</th>
              <th>التصنيف</th>
              <th>سعر البيع</th>
              <th>التكلفة التقريبية</th>
              <th>التعليمات/الملاحظات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>
                  {r.image_url ? 
                    <a href={`${r.image_url}`} target="_blank" rel="noreferrer"><ImageIcon size={20} color="var(--primary-color)"/></a> 
                    : '-'}
                </td>
                <td>{r.category}</td>
                <td>{r.selling_price} {settings.currency}</td>
                <td>{r.estimated_cost} {settings.currency}</td>
                <td>{r.instructions?.substring(0, 30)}...</td>
                <td>
                  <button className="btn btn-danger" onClick={() => handleDelete(r.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>لا توجد وصفات</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>إضافة وصفة جديدة</h3>
              <button className="btn" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <form id="recipeForm" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">اسم الوصفة</label>
                  <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">التصنيف</label>
                    <input type="text" className="form-control" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
                  </div>
                  <div className="form-group" style={{flex: 1}}>
                    <label className="form-label">سعر البيع</label>
                    <input type="number" step="0.01" className="form-control" value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">مستند الوصفة (ملاحظات وطريقة التحضير)</label>
                  <textarea className="form-control" rows="3" value={formData.instructions} onChange={e => setFormData({...formData, instructions: e.target.value})}></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">صورة الوصفة (مستند إضافي)</label>
                  <input type="file" className="form-control" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} />
                </div>

                <div className="card" style={{ backgroundColor: '#F9FAFB', padding: '15px' }}>
                  <h4>المكونات</h4>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <select className="form-control" value={currentIngredient.inventory_id} onChange={e => setCurrentIngredient({...currentIngredient, inventory_id: e.target.value})}>
                      <option value="">اختر المكون...</option>
                      {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.recipe_unit})</option>)}
                    </select>
                    <input type="number" placeholder="الكمية" className="form-control" value={currentIngredient.quantity_needed} onChange={e => setCurrentIngredient({...currentIngredient, quantity_needed: e.target.value})} />
                    <button type="button" className="btn btn-success" onClick={addIngredient}>إضافة</button>
                  </div>
                  <ul style={{ marginTop: '10px', paddingRight: '20px' }}>
                      {formData.ingredients.map((ing, index) => {
                        const invItem = inventory.find(i => i.id.toString() === ing.inventory_id.toString());
                        return (
                          <li key={index} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{invItem ? invItem.name : 'صنف غير معروف'} - {ing.quantity_needed} {invItem ? invItem.recipe_unit : ''}</span>
                            <button type="button" className="btn btn-danger" style={{ padding: '2px 6px' }} onClick={() => {
                              const newIng = [...formData.ingredients];
                              newIng.splice(index, 1);
                              setFormData({ ...formData, ingredients: newIng });
                            }}>
                              <Trash2 size={14} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                </div>

              </form>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>إلغاء</button>
              <button className="btn btn-primary" type="submit" form="recipeForm">حفظ الوصفة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
