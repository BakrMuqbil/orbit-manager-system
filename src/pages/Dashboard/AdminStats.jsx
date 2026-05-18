import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import {
  mdiDomain, mdiAccountGroup, mdiBus,
  mdiBullhorn, mdiShieldLock, mdiAlertOctagon, mdiTimerSand
} from '@mdi/js';
import { smartGet } from '../../utils/apiService';
import UniversalModal from '../../components/UniversalModal';
import { CloudLoader, getSubscriptionStatus } from '../../library/items.jsx';
import styles from './AdminStats.module.css';

const AdminStats = () => {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTask, setActiveTask] = useState('');
  const [formData, setFormData] = useState({});
  const [adminData, setAdminData] = useState({
    companies: [],
    users: [],
    totals: { totalCompanies: 0, totalUsers: 0, totalBuses: 0 }
  });
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);

  const fetchAdminDashboard = async () => {
    try {
      setLoading(true);
      const [companies, users, buses] = await Promise.all([
        smartGet('companies'),
        smartGet('users'),
        smartGet('buses')
      ]);

      // حساب الشركات المنتهية والمنتهية قريباً
      const expired = companies.filter(c => {
        if (!c.subscription_expiry) return false;
        return new Date(c.subscription_expiry) < new Date();
      }).length;

      const expiringSoon = companies.filter(c => {
        if (!c.subscription_expiry) return false;
        const diff = Math.ceil((new Date(c.subscription_expiry) - new Date()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= 7;
      }).length;

      setExpiredCount(expired);
      setExpiringSoonCount(expiringSoon);

      setAdminData({
        companies: companies || [],
        users: users || [],
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

  const openAction = (taskType) => {
    setActiveTask(taskType);
    setFormData({});
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      
      alert("تم تنفيذ العملية بنجاح");
      setShowModal(false);
      fetchAdminDashboard();
    } catch (error) {
      alert("حدث خطأ أثناء التنفيذ");
    }
  };

  if (loading) return <div className={styles.loaderCenter}><CloudLoader /></div>;

  return (
    <div className={styles.adminWrapper} dir="rtl">
      <header className={styles.adminHeader}>
        <div className={styles.headerTitle}>
          <h2>لوحة المراقبة العليا</h2>
          <p>إدارة الشركات والنظام العام</p>
        </div>
        <button onClick={fetchAdminDashboard} className={styles.refreshBtn}>🔄 تحديث</button>
      </header>

      {/* الكروت العلوية - تم إضافة كارت الشركات المنتهية والمنتهية قريباً */}
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
        <AdminStatCard
          title="شركات منتهية"
          value={expiredCount.toLocaleString('en-US')}
          icon={mdiAlertOctagon}
          colorClass={styles.danger}
        />
        <AdminStatCard
          title="تنتهي قريباً (7 أيام)"
          value={expiringSoonCount.toLocaleString('en-US')}
          icon={mdiTimerSand}
          colorClass={styles.warning}
        />
      </div>

      <div className={styles.performanceSection}>
        {/* جدول الشركات مع تحسين حالة الاشتراك */}
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
                      <td style={{ direction: 'ltr', textAlign: 'right' }}>
                        {company.subscription_expiry ? new Date(company.subscription_expiry).toLocaleDateString('en-US') : '---'}
                      </td>
                      <td>
                        <span style={{ background: status.bg, color: status.color, padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                          {status.text}
                        </span>
                      </td>
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
            companiesData: [{ id: 'all', name: '📢 إرسال للكل' }, ...adminData.companies],
            usersData: adminData.users || []
          }}
        />
      )}
    </div>
  );
};

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