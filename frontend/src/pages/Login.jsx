import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/login', { username, password })
      .then(res => {
        onLogin(res.data.user);
      })
      .catch(err => {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: 'var(--primary-color)'
    }}>
      <div className="card" style={{ width: '400px', textAlign: 'center', padding: '40px' }}>
        <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>TAAHEEL Takeaway</h2>
        <h3 style={{ marginBottom: '30px' }}>تسجيل الدخول</h3>
        
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'right' }}>
            <label className="form-label">اسم المستخدم</label>
            <input 
              type="text" 
              className="form-control" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group" style={{ textAlign: 'right' }}>
            <label className="form-label">كلمة المرور</label>
            <input 
              type="password" 
              className="form-control" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '20px', padding: '12px', fontSize: '1.1rem' }}>
            دخول
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
