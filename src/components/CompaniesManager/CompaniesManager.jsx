import React, { useState, useEffect } from 'react';
import { smartGet, smartSave, smartDelete } from '../../utils/apiService'; 
import UniversalModal from '../UniversalModal'; 
import { CloudLoader } from '../../library/items.jsx';
import styles from './CompaniesManager.module.css'; 

const CompaniesManager = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // الحالة الابتدائية المحدثة
    const [newCompany, setNewCompany] = useState({ 
    name: '', 
    code: '', 
    owner_name: '', 
    phone: '', 
    address: '', 
    package_type: 'تجريبية', // قيمة افتراضية لتجنب الـ NULL
    subscription_amount: 0, 
    subscription_expiry: '', 
    status: 'نشط' 
});


    const loadCompanies = async () => {
        setLoading(true); 
        try {
            const data = await smartGet('companies');
            setCompanies(data);
        } catch (err) { 
            console.error("Error loading companies:", err); 
            
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCompanies(); 
    }, []);

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await smartSave('companies', newCompany, editingId);
            loadCompanies();
            handleCloseModal();
            
        } catch (err) { 
            alert("خطأ في حفظ الشركة: تأكد من صحة البيانات وكود الشركة");
            console.log("بيانات الشركة ♦"
          ,newCompany)
        }
        finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (company) => {
          
        try {
          setEditingId(company.id);
        setNewCompany({ ...company });
        setShowModal(true);
        console.log("بيانات الشركة ♦"
          ,company)
        } catch (err) {
          alert("خطأ في حفظ الشركة: تأكد من صحة البيانات وكود الشركة");
        }
        
    };

    const handleDelete = async (id) => {
        if (!window.confirm("هل أنت متأكد من حذف هذه الشركة نهائياً؟")) return;
        setIsSaving(true)
        try {
            await smartDelete('companies', id);
            setCompanies(prev => prev.filter(c => c.id !== id));
        } catch (err) { alert("خطأ في الحذف"); }
        finally {
            setIsSaving(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setNewCompany({ 
            name: '', code: '', owner_name: '', phone: '', address: '', 
            package_type: 'تجريبية', status: 'نشط' 
        });
    };

    return (
        <div className={styles.listWrapper} dir="rtl">
            <header className={styles.listHeader}>
                <h2 className={styles.title}>إدارة الشركات </h2>
                <div>
                    <span className={styles.count}>{companies.length} شركة</span>
                </div>
                <button className={styles.saveBtn} onClick={() => setShowModal(true)}>+</button>
            </header>

            <div className={styles.verticalStack}>
{loading && (
<CloudLoader message="loading"
customClass={styles.companyLoader}/>)
                    
                  
                }

                {!loading && (
                    <div className={styles.verticalStack}>
                        {companies.map(company => (
                            <div key={company.id} className={styles.companyCard}>
                                <div className={styles.cardBody}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h3 style={{ margin: 0 }}>{company.name}</h3>
                                        <span className={styles.packageBadge}>
                                            {company.package_type || 'باقة غير محددة'}
                                        </span>
                                    </div>
                                    
                                    <div className={styles.subInfo}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                                            <span style={{ color: '#00f2fe', fontWeight: 'bold' }}>👤 المالك: {company.owner_name || '---'}</span>
                                            <span>📞 الجوال: {company.phone || '---'}</span>
                                            <span>📍 العنوان: {company.address || '---'}</span>
                                            <span>🔑 الكود: <code style={{ background: '#1a1a1a', padding: '2px 5px', borderRadius: '4px' }}>{company.code}</code></span>
                                        </div>

                                        {/* صندوق بيانات الاشتراك المحدث */}
                                        <div style={{ 
                                            background: 'rgba(255, 255, 255, 0.03)', 
                                            padding: '12px', 
                                            borderRadius: '10px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '10px'
                                        }}>
                                            <div>
                                                <small style={{ color: '#718096', display: 'block' }}>تاريخ الاشتراك</small>
                                                <span style={{ fontSize: '0.9rem' }}>
                                                    {company.subscription_date ? new Date(company.subscription_date).toLocaleDateString('en-us') : '---'}
                                                </span>
                                            </div>
                                            <div>
                                                <small style={{ color: '#718096', display: 'block' }}>تاريخ الانتهاء</small>
                                                <span style={{ fontSize: '0.9rem', color: '#ff4d4d', fontWeight: 'bold' }}>
                                                    {company.subscription_expiry ? new Date(company.subscription_expiry).toLocaleDateString('en-us') : '---'}
                                                </span>
                                            </div>
                                            <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', marginTop: '5px' }}>
                                                <small style={{ color: '#718096' }}>المبلغ المدفوع: </small>
                                                <span style={{ color: '#48bb78', fontWeight: 'bold' }}>
                                                    {Number(company.subscription_amount || 0).toLocaleString()} ريال
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardFooter}>
                                    <div className={styles.buttonGroup}>
                                        {/* زر التعديل / تجديد الاشتراك */}
                                        <button className={styles.actionIconBtn} onClick={() => handleEdit(company)} title="تعديل أو تجديد">
                                            <svg width="25px" height="30px" viewBox="0 0 24 24" fill="#f3f0f0"><path d="M5 19h1.425L16.2 9.225L14.775 7.8L5 17.575zm-1 2q-.425 0-.712-.288T3 20v-2.425q0-.4.15-.763t.425-.637L16.2 3.575q.3-.275.663-.425t.762-.15t.775.15t.65.45L20.425 5q.3.275.437.65T21 6.4q0 .4-.138.763t-.437.662l-12.6 12.6q-.275.275-.638.425t-.762.15z"/></svg>
                                        </button>
                                        <button className={styles.actionIconBtn} onClick={() => handleDelete(company.id)} title="حذف">
                                            <svg height="30px" viewBox="0 -960 960 960" width="25px" fill="#992B15"><path d="M267.33-120q-27.5 0-47.08-19.58-19.58-19.59-19.58-47.09V-740H160v-66.67h192V-840h256v33.33h192V-740h-40.67v553.33q0 27-19.83 46.84Q719.67-120 692.67-120H267.33Z"/></svg>
                                        </button>
                                    </div>
                                    <button 
                                        className={styles.statusToggleBtn} 
                                        style={{ background: company.status === 'نشط' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(255, 77, 77, 0.1)', color: company.status === 'نشط' ? '#48bb78' : '#ff4d4d' }}
                                    >
                                        {company.status || 'نشط'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <UniversalModal 
                isOpen={showModal} 
                onClose={handleCloseModal}
                schemaKey="company" 
                title={editingId ? "تعديل بيانات الشركة" : "تسجيل شركة واشتراك جديد"}
                formData={newCompany} 
                setFormData={setNewCompany}
                onSave={handleSave}
                loading={isSaving}
            />
        </div>
    );
};

export default CompaniesManager;
