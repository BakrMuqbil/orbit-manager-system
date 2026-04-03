import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { 
  mdiDomain, mdiAccountGroup, mdiBus, 
  mdiBullhorn, mdiShieldLock, mdiAlertOctagon 
} from '@mdi/js';
import { smartGet } from '../../utils/apiService';
import UniversalModal from '../../components/UniversalModal';
import { CloudLoader } from '../../library/items.jsx';
import styles from './AdminStats.module.css';

const AdminStats = () => {
  // 1. الحالات (States)
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTask, setActiveTask] = useState('');
  const [formData, setFormData] = useState({});
  const [adminData, setAdminData] = useState({
    companies: [],
    totals: { totalCompanies: 0, totalUsers: 0, totalBuses: 0 }
  });

  // 2. جلب البيانات من السيرفر
  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      const [companies, users, buses] = await Promise.all([
        smartGet('companies'),
        smartGet('users'),
        smartGet('buses')
      ]);

      setAdminData({
        companies: companies || [],
        totals: {
          totalCompanies: companies?.length || 0,
          totalUsers: users?.length || 0,
          totalBuses: buses?.length || 0
        }
      });
    } catch (err) {
      console.error("Admin Data Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  // 3. دالة حساب حالة الاشتراك (إصلاح خطأ Acode + أرقام إنجليزية)
  const getSubscriptionStatus = (expiryDate) => {
    if (!expiryDate) return { text: 'غير محدد', class: styles.expired };
    
    const today = new Date().getTime(); 
    const expiry = new Date(expiryDate).getTime(); 
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'منتهي', class: styles.expired };
    if (diffDays <= 7) return { text: 'أوشك', class: styles.expiring };
    return { text: 'نشط', class: styles.active };
  };

  // 4. معالجة الإجراءات السريعة
  const openAction = (taskType) => {
    setActiveTask(taskType);
    setFormData({}); 
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      console.log(`Executing: ${activeTask}`, formData);
      // هنا تضع منطق الـ API الخاص بكل عملية
      alert("تم تنفيذ العملية بنجاح");
      setShowModal(false);
      fetchAdminDashboard(); // تحديث البيانات
    } catch (error) {
      alert("حدث خطأ أثناء التنفيذ");
    }
  };

  if (loading) return <div className={styles.loaderCenter}><CloudLoader /></div>;

  return (
    <div className={styles.adminWrapper} dir="rtl">
      {/* الهيدر */}
      <header className={styles.adminHeader}>
        <div className={styles.headerTitle}>
          <h2>لوحة المراقبة العليا</h2>
          <p>إدارة الشركات والنظام العام</p>
        </div>
        <button onClick={fetchAdminDashboard} className={styles.refreshBtn}>🔄 تحديث</button>
      </header>

      {/* الكروت العلوية (الأرقام بالإنجليزية) */}
      <div className={styles.statsGrid}>
        <AdminStatCard 
          title="إجمالي الشركات" 
          value={adminData.totals.totalCompanies.toLocaleString('en-US')} 
          icon={mdiDomain} 
          colorClass={styles.neonBlue} 
        />
        <AdminStatCard 
          title="إجمالي المستخدمين" 
          value={adminData.totals.totalUsers.toLocaleString('en-US')} 
          icon={mdiAccountGroup} 
          colorClass={styles.neonPurple} 
        />
        <AdminStatCard 
          title="إجمالي الأسطول" 
          value={adminData.totals.totalBuses.toLocaleString('en-US')} 
          icon={mdiBus} 
          colorClass={styles.neonCyan} 
        />
      </div>

      <div className={styles.performanceSection}>
        {/* جدول الشركات */}
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <h3>حالة اشتراكات الشركات</h3>
          </div>
          <div className={styles.tableResponsive}>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>اسم الشركة</th>
                  <th>نوع الباقة</th>
                  <th>تاريخ الانتهاء</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {adminData.companies.map(company => {
                  const status = getSubscriptionStatus(company.subscription_expiry);
                  return (
                    <tr key={company.id}>
                      <td><strong>{company.name}</strong></td>
                      <td>{company.package_type || 'Basic'}</td>
                      <td style={{direction: 'ltr', textAlign: 'right'}}>
                        {new Date(company.subscription_expiry).toLocaleDateString('en-US')}
                      </td>
                      <td><span className={`${styles.statusPill} ${status.class}`}>{status.text}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* أزرار العمليات السريعة */}
        <div className={styles.mainCard}>
          <div className={styles.cardHeader}>
            <h3>إجراءات سريعة</h3>
          </div>
          <div className={styles.quickActions}>
            <button className={styles.actionBtn} onClick={() => openAction('send_announcement')}>
              <Icon path={mdiBullhorn} size={0.8} /> إرسال تنبيه عام
            </button>
            <button className={styles.actionBtn} onClick={() => openAction('manage_permissions')}>
              <Icon path={mdiShieldLock} size={0.8} /> إدارة الصلاحيات
            </button>
            <button 
            className={styles.actionBtn} 
            style={{ color: '#ee5d50' }} 
            onClick={() => openAction('freeze_company')}
          >
            <Icon path={mdiAlertOctagon} size={0.8} /> تجميد حساب شركة
          </button>
          </div>
        </div>
      </div>

      {/* المودال العالمي لجميع العمليات */}
      {showModal && (

<UniversalModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  schemaKey={activeTask}
  formData={formData}
  setFormData={setFormData}
  onSave={handleSave}
  title="إجراء إداري سريع"
  dynamicData={{
    // 1. بيانات الشركات (تستخدم في التنبيهات والتجميد)
    companiesData: [
      { id: 'all', name: '📢 إرسال للكل' }, 
      ...adminData.companies
    ],
    // 2. بيانات المستخدمين (تستخدم في إدارة الصلاحيات)
    // تأكد أنك جلبت users من السيرفر في دالة fetchAdminDashboard
    usersData: adminData.users || [] 
  }}
/>

      )}
    </div>
  );
};

// مكون الكارت الصغير (Component داخل الملف)
const AdminStatCard = ({ title, value, icon, colorClass }) => (
  <div className={styles.statCard}>
    <div>
      <p className={styles.statLabel}>{title}</p>
      <h2 className={styles.statValue}>{value}</h2>
    </div>
    <div className={`${styles.iconBox} ${colorClass}`}>
      <Icon path={icon} size={1.2} />
    </div>
  </div>
);

export default AdminStats;
