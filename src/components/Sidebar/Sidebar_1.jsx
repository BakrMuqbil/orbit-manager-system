import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css'; // استخدام CSS Modules
import logo from '../../assets/images/Orbit.png'; 
import profileImg from "../../assets/images/profile-img.jpg";

const Sidebar = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username') || 'مستخدم';

  const handleLogout = () => {
    if (window.confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      localStorage.clear();
      navigate('/'); 
    }
  };

  const NavItem = ({ to, icon, label }) => (
    <li className={styles.navItem}>
      <NavLink to={to} className={({ isActive }) => isActive ? `${styles.link} ${styles.linkActive}` : styles.link}>
        <span className="material-symbols-outlined">{icon}</span>
      </NavLink>
      <span className={styles.tooltip}>{label}</span>
    </li>
  );

  return (
    <aside className={styles.sidebarContainer}>
      <div className={styles.logoSection}>
        <img src={logo} alt="logo" />
      </div>

      <ul className={styles.navLinks}>
        <NavItem to="/home/dashboard" icon="dashboard" label="الرئيسية" />
        
        {/* الخط الفاصل */}
        <div className={styles.menuSeparator}></div>

        {role === 'super_admin' && (
          <>
            <NavItem to="/home/CompaniesManager" icon="domain" label="إدارة الشركات" />
            <NavItem to="/home/reports" icon="analytics" label="التقارير" />
            <NavItem to="/home/UsersManager" icon="manage_accounts" label="المستخدمين" />
            <div className={styles.menuSeparator}></div>
          </>
        )}

        <NavItem to="/home/buses" icon="directions_bus" label="الحافلات" />
        <NavItem to="/home/drivers" icon="groups" label="السائقين" />
      </ul>

      <div className={styles.userSection}>
        <div className={styles.navItem}>
          <img src={profileImg} alt="Profile" className={styles.profileImg} />
          <span className={styles.tooltip}>{username}</span>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <span className="material-symbols-outlined" style={{color: '#ee5d50', marginTop: '15px'}}>logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
