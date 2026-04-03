import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 1. تعديل المسار ليطابق مجلد services
import { CloudLoader } from '../../library/items.jsx'; // تأكد من المسار الصحيح للملف

import { apiRequest } from '../../utils/apiService';
import InputField from "@components/InputField/InputField";
import './login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState(''); 
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
        // حذفنا الـ setTimeout (3 ثواني) الزائد ليعمل حسب سرعة السيرفر
        const res = await apiRequest('login', 'POST', {
            username,
            password,
            companyCode
        });

        if (res && res.token) {
            localStorage.setItem('token', res.token);
            localStorage.setItem('role', res.role);
            localStorage.setItem('company_id', res.company_id);
            localStorage.setItem('username', username);

            setMessage({ text: '✅ تم تسجيل الدخول بنجاح! جاري التحويل...', type: 'success' });

            // التوجيه الفوري
            const role = localStorage.getItem('role');
            if (role === 'super_admin') {
                navigate('/home');
            } else {
                navigate('/home/dashboard');
            }
            
            // ملاحظة: لا نضع setLoading(false) هنا لضمان بقاء اللودر حتى تختفي الصفحة
        }
    } catch (err) {
        console.error("Login Error:", err.message);
        // نغلق اللودر فقط في حالة الخطأ ليتمكن المستخدم من المحاولة مجدداً
        setLoading(false); 
        
        if (err.message.includes("401") || err.message.includes("400")) {
            setMessage({ text: '❌ بيانات الدخول غير صحيحة أو الشركة غير موجودة', type: 'error' });
        } else {
            setMessage({ text: `⚠️ خطأ في الاتصال: ${err.message}`, type: 'error' });
        }
    }
};


  // باقي الكود (Return) يبقى كما هو دون أي تغيير
  return (
    <main className="login-page">
      <div className="login-content-wrapper">
        <div className="login-container">
          <h2 className="form-title">تسجيل الدخول</h2>
           <div className={`loader-overlay ${loading ? 'active' : ''}`}>
        <CloudLoader />
      </div>

          <form onSubmit={handleLogin} className="login-form">
            <InputField
              type="text"
              placeholder="كود الشركة"
              icon="deployed_code_account"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value)}
              required={false}
            />
            <InputField
              type="text"
              placeholder="اسم المستخدم"
              icon="contacts_product"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <InputField
              type="password"
              placeholder="كلمة المرور"
              icon="password_2_off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>

            {message.text && (
              <p style={{ 
                color: message.type === 'error' ? '#ff4d4d' : '#2ecc71', 
                textAlign: 'center',
                marginTop: '15px',
                fontWeight: 'bold'
              }}>
                {message.text}
              </p>
            )}
          </form>

          <p className="signup-prompt">
            ليس لديك حساب؟ <a href="#" className="signup-link">سجل الآن</a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
