import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'cashier',
    permissions: []
  });

  const availablePermissions = [
    { id: 'inventory', label: 'المخزون' },
    { id: 'recipes', label: 'الوصفات' },
    { id: 'sales', label: 'المبيعات' },
    { id: 'waste', label: 'الهالك' },
    { id: 'reports', label: 'التقارير' },
    { id: 'users', label: 'المستخدمين' }
  ];

  const fetchUsers = () => {
    axios.get('/api/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePermissionChange = (perm) => {
    if (formData.permissions.includes(perm)) {
      setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
    } else {
      setFormData({ ...formData, permissions: [...formData.permissions, perm] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/users', formData)
      .then(() => {
        fetchUsers();
        setShowModal(false);
        setFormData({ username: '', password: '', role: 'cashier', permissions: [] });
      })
      .catch(err => alert('حدث خطأ أثناء حفظ المستخدم.'));
  };

  const handleDelete = (id) => {
    if (window.confirm('هل أنت متأكد من حذف المستخدم؟')) {
      axios.delete(`/api/users/${id}`)
        .then(() => fetchUsers())
        .catch(err => alert('حدث خطأ.'));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>إدارة المستخدمين والصلاحيات</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> مستخدم جديد
        </button>
      </div>

      <div className="card table-container">
        <table>
          <thead>
            <tr>
              <th>اسم المستخدم</th>
              <th>الدور (Role)</th>
              <th>الصلاحيات</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const perms = JSON.parse(u.permissions || '[]');
              return (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.role === 'admin' ? 'مدير' : 'كاشير / مستخدم'}</td>
                  <td>
                    {perms.includes('all') ? 'صلاحيات كاملة' : perms.map(p => availablePermissions.find(a => a.id === p)?.label).join('، ')}
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button className="btn btn-danger" onClick={() => handleDelete(u.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>إضافة مستخدم جديد</h3>
              <button className="btn" onClick={() => setShowModal(false)}>X</button>
            </div>
            <div className="modal-body">
              <form id="userForm" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">اسم المستخدم</label>
                  <input type="text" className="form-control" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">كلمة المرور</label>
                  <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">الدور</label>
                  <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="cashier">مستخدم عادي / كاشير</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                
                {formData.role !== 'admin' && (
                  <div className="form-group">
                    <label className="form-label">الصلاحيات</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {availablePermissions.map(perm => (
                        <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.permissions.includes(perm.id)} 
                            onChange={() => handlePermissionChange(perm.id)} 
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {formData.role === 'admin' && (
                   <p style={{ color: 'var(--success-color)', fontSize: '0.9rem' }}>المدير لديه صلاحيات كاملة تلقائياً.</p>
                )}
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>إلغاء</button>
              <button className="btn btn-primary" type="submit" form="userForm">حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
