import React from 'react';
// استيراد المكونات الخاصة بكل رتبة
import AccountantStats from './AccountantStats';
import AdminStats from './AdminStats'; // تأكد من أن اسم الملف AdminStats.jsx
import "./Dashboard.css";
const Dashboard = () => {
  // جلب الرتبة من التخزين المحلي لتحديد الواجهة المناسبة
  const role = localStorage.getItem('role');

  return (
    <>
      {role === 'super_admin' ? (
        /* إذا كان المستخدم مدير نظام، عرض لوحة المراقبة العليا */
        <AdminStats />
      ) : (
        /* إذا كان محاسباً، عرض لوحة العمليات اليومية */
        <AccountantStats />
      )}
    </>
  );
};

export default Dashboard;
