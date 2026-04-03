import React, { useEffect, useState } from 'react';
import { smartGet, smartSave, smartDelete } from '../../utils/apiService'; 
import styles from './UsersManager.module.css'; 
import UniversalModal from "../UniversalModal";
import { CloudLoader } from '../../library/items.jsx';
import Icon from '@mdi/react';
import { mdiPencil, mdiDelete, mdiAccountCircle, mdiDomain, mdiKeyVariant } from '@mdi/js';

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // الحالة الابتدائية للمستخدم الجديد
  const [newUser, setNewUser] = useState({
    username: '', 
    password: '', 
    role: 'company_accountant', 
    company_id: ''
  });

  // 1. جلب البيانات عند تحميل المكون
  const loadData = async () => {
    setLoading(true); 
    try {
      const usersData = await smartGet('users');
      setUsers(usersData);

      // جلب الشركات لتغذية القائمة المنسدلة في المودال
      const companiesData = await smartGet('companies');
      setCompanies(companiesData);
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. فتح مودال التعديل
  const handleEditClick = (user) => {
    setEditingUserId(user.id);
    setNewUser({ 
      ...user, 
      company_id: user.company_id || '' 
    });
    setIsModalOpen(true);
  };

  // 3. حفظ أو تحديث المستخدم
  const handleSaveUser = async () => {
    setIsSaving(true);
    try {
      // إذا كان سوبر أدمن، نرسل company_id كـ null
      const dataToSave = {
        ...newUser,
        company_id: newUser.role === 'super_admin' ? null : newUser.company_id
      };

      await smartSave('users', dataToSave, editingUserId);
      await loadData();
      handleCloseModal();
    } catch (err) {
      alert("فشل الحفظ: تأكد من أن اسم المستخدم غير مكرر");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. حذف مستخدم
  const handleDeleteUser = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    try {
      await smartDelete('users', id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert("فشل الحذف");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUserId(null);
    setNewUser({ username: '', password: '', role: 'company_accountant', company_id: '' });
  };

  return (
    <div className={styles['list-wrapper']} dir="rtl">
      <header className={styles['list-header']}>
        <h2 className={styles['title']}>إدارة مستخدمي النظام</h2>
        <div> 
          <span className={styles['count']}>{users.length} مستخدم</span>
        </div>
      </header>

      <div className={styles.verticalStack}>
        {loading && (
          <CloudLoader message="جاري التحميل..." customClass={styles.userLoader} />
        )}

        {!loading && (
          <div className={styles['cards-container']}>
            {users.map((user) => (
              <div key={user.id} className={styles['user-main-card']}>
                <div className={styles['avatar-top-section']}>
                  <div className={styles['user-circle-icon']}>
                    <Icon path={mdiAccountCircle} size={2} color={user.role === 'super_admin' ? "#4433ff" : "#3182ce"} />
                  </div>
                </div>

                <div className={styles['card-details-body']}>
                  <h3 className={styles['user-full-name']}>{user.username}</h3>
                  
                  <div className={styles['info-grid']}>
                    <div className={styles['info-row-item']}>
                      <Icon path={mdiKeyVariant} size={0.7} color="#718096" />
                      <span className={styles['item-label']}>كلمة المرور:</span>
                      <span className={styles['item-value']}>{user.password}</span>
                    </div>
                  </div>
                  
                  <div className={styles['horizontal-divider']}></div>
                  
                  <div className={styles['footer-company-info']}>
                    <span className={`${styles['status-pill']} ${user.role === 'super_admin' ? styles['badge-admin'] : styles['badge-accountant']}`}>
                      {user.role === 'super_admin' ? 'مدير نظام' : 'محاسب شركة'}
                    </span>
                    
                    {user.company_name && (
                      <div className={styles['company-tag']}>
                        <Icon path={mdiDomain} size={0.6} color="#718096" />
                        <span>{user.company_name}</span>
                        {user.company_code && <span className={styles['company-code']}>({user.company_code})</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles['card-footer-actions']}>
                  <div className={styles['btns-group']}>
                    <button className={styles['action-circle-btn-dele']} onClick={() => handleDeleteUser(user.id)}>
                      <Icon path={mdiDelete} size={0.8} color="#e53e3e" />
                    </button>
                    <button className={styles['action-circle-btn']} onClick={() => handleEditClick(user)}>
                      <Icon path={mdiPencil} size={0.8} color="#f4f7fe" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className={styles['floating-plus-btn']} onClick={() => setIsModalOpen(true)}>+</button>

      <UniversalModal 
    isOpen={isModalOpen} 
    onClose={handleCloseModal}
    schemaKey="users" 
    title={editingUserId ? "تعديل مستخدم" : "إضافة مستخدم"}
    formData={newUser} 
    setFormData={setNewUser}
    // تأكد من استخدام الاسم dynamicData ليتوافق مع استقبال المودال له
    dynamicData={{ companiesData: companies }} 
    onSave={handleSaveUser}
    loading={isSaving}
/>

    </div>
  );
};

export default UsersManager;
