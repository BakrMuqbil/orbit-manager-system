import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../assets/images/logo.png'; 
import profileImg from "../../assets/images/profile-img.jpg"

const Sidebar = () => {
  const navigate = useNavigate();
  // جلب الدور لتحديد ما يظهر في القائمة
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username') || 'مستخدم';

  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      // تنظيف كل البيانات المخزنة لضمان الأمان
      localStorage.clear();
      navigate('/'); 
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="logo" />
        <h2>CodingLab</h2>
      </div>

      <ul className="sidebar-links">
              {role === 'super_admin' && (
          <>
            <h4>
              <span>الإدارة العليا</span>
              <div className="menu-separator"></div>
            </h4>
            <li>
          <NavLink to="/home" className={({ isActive }) => isActive ? 'active' : ''}><span className="material-symbols-outlined">home</span>home</NavLink>
        </li>
            <li>
              <NavLink to="/home/CompaniesManager">
                <span className="material-symbols-outlined">domain</span>إدارة الشركات
              </NavLink>
            </li>
            <li>
              <NavLink to="/home/reports">
                <span className="material-symbols-outlined">analytics</span>التقارير العامة
              </NavLink>
            </li>
            <li>
          <NavLink to="/home/UsersManager" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="material-symbols-outlined">groups</span>
          </NavLink>
        </li>
          </>
        )}
        <h4>
          <span>القائمة الرئيسية</span>
          <div className="menu-separator"></div>
          
        </h4>
        
        {/* روابط مشتركة للجميع */}
        <li>
          <NavLink to="/home/dashboard" className={({ isActive}) => isActive ? 'active' : ''}>
            <span className="material-symbols-outlined">dashboard</span>الرئيسية
          </NavLink>
        </li>

        {/* روابط تظهر فقط للمحاسب أو الأدمن حسب الحاجة */}
        <li>
          <NavLink to="/home/buses" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="material-symbols-outlined">directions_bus</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/home/drivers" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="material-symbols-outlined">groups</span>
          </NavLink>
        </li>

        {/* قسم خاص بالسوبر أدمن فقط */}


        <h4>
          <span>الحساب</span>
          <div className="menu-separator"></div>
        </h4>
        <li>
          <a href="#" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>تسجيل الخروج
          </a>
        </li>
      </ul>

      <div className="user-account">
        <div className="user-profile">
          <img src={profileImg} alt="Profile" />
          <div className="user-detail">
            <h3>{username}</h3>
            <span>{role === 'super_admin' ? 'مدير النظام' : 'محاسب شركة'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
