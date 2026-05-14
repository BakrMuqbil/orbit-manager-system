import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudLoader } from '../../library/items.jsx';
import { apiRequest } from '../../utils/apiService';
import InputField from "@components/InputField/InputField";
import './login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // تحميل البيانات المحفوظة عند تحميل الصفحة
  useEffect(() => {
    const savedCompany = localStorage.getItem('remembered_company');
    const savedUsername = localStorage.getItem('remembered_username');
    const savedPassword = localStorage.getItem('remembered_password');
    const isRemembered = localStorage.getItem('rememberMe') === 'true';

    if (isRemembered && savedCompany && savedUsername && savedPassword) {
      setCompanyCode(savedCompany);
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleRememberChange = (e) => {
    const checked = e.target.checked;
    setRememberMe(checked);
    if (!checked) {
      // إذا ألغى المستخدم التذكر، نمسح البيانات فوراً
      localStorage.removeItem('remembered_company');
      localStorage.removeItem('remembered_username');
      localStorage.removeItem('remembered_password');
      localStorage.removeItem('rememberMe');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
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

        // حفظ أو مسح البيانات حسب خيار "تذكرني"
        if (rememberMe) {
          localStorage.setItem('remembered_company', companyCode);
          localStorage.setItem('remembered_username', username);
          localStorage.setItem('remembered_password', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('remembered_company');
          localStorage.removeItem('remembered_username');
          localStorage.removeItem('remembered_password');
          localStorage.removeItem('rememberMe');
        }

        setMessage({ text: '✅ تم تسجيل الدخول بنجاح! جاري التحويل...', type: 'success' });

        const role = localStorage.getItem('role');
        if (role === 'super_admin') {
          navigate('/home');
        } else {
          navigate('/home/dashboard');
        }
      }
    } catch (err) {
      console.error("Login Error:", err.message);
      setLoading(false);

      if (err.message.includes("401") || err.message.includes("400")) {
        setMessage({ text: '❌ بيانات الدخول غير صحيحة أو الشركة غير موجودة', type: 'error' });
      } else {
        setMessage({ text: `⚠️ خطأ في الاتصال: ${err.message}`, type: 'error' });
      }
    }
  };

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

            <div className="remember-me-wrapper">
              <label className="remember-me-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberChange}
                />
                <span>تذكير</span>
              </label>
            </div>

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