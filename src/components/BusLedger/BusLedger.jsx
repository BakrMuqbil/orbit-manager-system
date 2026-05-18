import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { smartGet, smartSave, smartDelete } from '../../utils/apiService'; 
import styles from './BusLedger.module.css'; 
import UniversalModal from '../UniversalModal'; 
import { CloudLoader } from '../../library/items';
import { printBusLedgerPDF } from '../../utils/pdfGenerator';
const BusLedger = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [driverName, setDriverName] = useState('');
  const [busesList, setBusesList] = useState([]);
  
  const [bus, setBus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("quick_oil"); 
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'oil', 'repair'

  // البيانات المعالجة
  const [oilHistory, setOilHistory] = useState([]);
  const [netProfit, setNetProfit] = useState(0);
  const [repairHistory, setRepairHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
const [currentEntryId, setCurrentEntryId] = useState(null);

  const [newEntry, setNewEntry] = useState({
    busId: busId,
    driverId:'',
    date: new Date().toISOString().split("T")[0],
    currentMeter: "",
    busNumber: '',
    paidAmount: "",
    dailyRent:'',
    owner_name:'',
    cost:"",
    note: ""
  });

  useEffect(() => {
    fetchBusData();
  }, [busId]);
  
  const fetchBusData = async () => {
  try {
    setLoading(true);

    // 1. جلب بيانات الباصات
    const buses = await smartGet("buses");
    const currentBus = buses.find(b => b.id.toString() === busId.toString());
    setBus(currentBus);
    
    // 2. جلب بيانات السائقين (لتحديد السائق المرتبط)
    const driversData = await smartGet("driversData").catch(() => []);
    
    // البحث عن السائق الذي busId يساوي id الباص الحالي
    const busDrivers = driversData.filter(d => d.busId === currentBus?.id);
    let currentDriver = null;
    if (busDrivers.length > 0) {
      // نأخذ أحدث سائق حسب receiveDate (آخر تاريخ استلام)
      const sorted = busDrivers.sort((a, b) => new Date(b.receiveDate) - new Date(a.receiveDate));
      currentDriver = sorted[0];
    }
    setDriverName(currentDriver?.name || '');


    // 2. جلب سجلات الزيت والصيانة والـ ledger بالتوازي
    
    
    
      // جلب سجلات الزيت والصيانة بالباص (هذه الـ APIs تدعم busId)
      const [oilData, repairData] = await Promise.all([
        smartGet("oil_changes", `busId=${busId}`).catch(() => []),
        smartGet("repairsData", `busId=${busId}`).catch(() => [])
      ]);

      // ✅ جلب سجلات ledger بواسطة driverId الخاص بالسائق الحالي فقط (لأن API ledger لا يدعم busId)
      let ledgerData = [];
      if (currentDriver?.id) {
        ledgerData = await smartGet("ledger", `driverId=${currentDriver.id}`).catch(() => []);
      }

    // 3. معالجة بيانات الزيت
    let processedOil = oilData.map(o => {
      const actualMeter = Number(o.currentMeter || o.totaldistance || o.meter || 0);
      return {
        ...o,
        type: 'oil',
        label: 'تغيير زيت',
        cost: Number(o.amount || o.paidAmount || 0),
        meter: actualMeter,
        date: o.changedate || o.changedate || o.date
      };
    }).sort((a, b) => a.meter - b.meter);

    // 4. حساب المسافة المقطوعة (diff)
    processedOil = processedOil.map((item, index, array) => {
      const tripDistance = index > 0 ? (item.meter - array[index - 1].meter) : 0;
      return { ...item, diff: tripDistance };
    });

    // 5. معالجة بيانات الصيانة
    const processedRepair = repairData.map(r => ({
      ...r,
      type: 'repair',
      label: 'إصلاح/صيانة',
      cost: Number(r.cost || 0),
      meter: Number(r.currentMeter || 0),
      date: r.date,
      diff: 0
    }));

    // 6. الترتيب التنازلي حسب التاريخ
    const sortByDateDesc = (data) => [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const finalOilHistory = sortByDateDesc(processedOil);
    const finalRepairHistory = sortByDateDesc(processedRepair);
    const finalFullHistory = sortByDateDesc([...processedOil, ...processedRepair]);

    // ✅ حساب إجمالي الزيت والصيانة من المصفوفات النهائية
    const totalOilLocal = finalOilHistory.reduce((sum, item) => sum + item.cost, 0);
    const totalRepairLocal = finalRepairHistory.reduce((sum, item) => sum + item.cost, 0);

    // ✅ حساب إيرادات الإيجار من ledgerData
    const rentIncome = ledgerData
      .filter(entry => entry.type === 'rent')
      .reduce((sum, entry) => sum + Number(entry.paidAmount || 0), 0);

    // ✅ حساب صافي الربح
    const calculatedNetProfit = rentIncome - (totalOilLocal + totalRepairLocal);
    setNetProfit(calculatedNetProfit);

    // تحديث الحالات
    setOilHistory(finalOilHistory);
    setRepairHistory(finalRepairHistory);
    setFullHistory(finalFullHistory);

   
    setLoading(false);
  } catch (err) {
    console.error("❌ خطأ في معالجة البيانات:", err);
    setLoading(false);
  }
};
const handleSave = async (e) => {
  if (e) e.preventDefault();
  try {
    const isOil = modalType === "quick_oil";
    const endpoint = isOil ? "oil_changes" : "repairsData";

    // معالجة الأرقام لضمان عدم وجود NaN
    const fixNum = (val) => {
      const n = parseInt(val, 10);
      return isNaN(n) ? 0 : n;
    };

    const finalCost = fixNum(newEntry.paidAmount || newEntry.cost || 0);
    const finalMeter = fixNum(newEntry.currentMeter || 0);

    // تجهيز البيانات حسب متطلبات السيرفر لكل نوع
    const dataToSave = isOil
      ? {
          busId: parseInt(busId),
          date: newEntry.date,
          currentMeter: finalMeter,
          paidAmount: finalCost,
          note: newEntry.note,
        }
      : {
          busId: parseInt(busId),
          date: newEntry.date,
          cost: finalCost,
          currentMeter: finalMeter,
          note: newEntry.note,
        };

    // استخدام smartSave: إذا وجد id سيقوم بعمل PUT، وإلا سيعمل POST
    await smartSave(endpoint, dataToSave, isEditing ? currentEntryId : null);
    
    await fetchBusData();
    handleCloseModal(); // دالة لتنظيف الحالة وإغلاق المودال
    alert(isEditing ? "تم التعديل بنجاح" : "تم الإضافة بنجاح");
  } catch (err) {
    console.error("❌ فشل الحفظ:", err);
    alert("فشل الحفظ: تأكد من الاتصال بالسيرفر");
  }
};

  const handleEditClick = (entry) => {
  setIsEditing(true);
  setCurrentEntryId(entry.id);
  // تحديد نوع المودال بناءً على نوع السجل
  setModalType(entry.type === 'oil' ? "quick_oil" : "quick_repair");
  
  setNewEntry({
    busId: busId,
    date: new Date(entry.date).toISOString().split("T")[0],
    currentMeter: entry.meter,
    paidAmount: entry.type === 'oil' ? entry.cost : "",
    cost: entry.type === 'repair' ? entry.cost : "",
    note: entry.note || ""
  });
  setShowModal(true);
};


  const deleteLedger = async (entry) => {
  const confirmMsg = entry.type === 'oil' 
    ? "هل أنت متأكد من حذف سجل تغيير الزيت؟ سيؤثر هذا على حساب المسافات." 
    : "هل أنت متأكد من حذف سجل الصيانة؟";

  if (!window.confirm(confirmMsg)) return;

  try {
    const endpoint = entry.type === 'oil' ? "oil_changes" : "repairsData";
    await smartDelete(endpoint, entry.id);
    
    // تحديث الواجهة فوراً
    await fetchBusData();
    alert("تم الحذف بنجاح");
  } catch (err) {
    console.error("❌ فشل الحذف:", err);
    alert("حدث خطأ أثناء الحذف");
  }
};


  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    const days = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت"
    ];
    return `${days[dateObj.getDay()]}-${String(dateObj.getDate()).padStart(
      2,
      "0"
    )}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
  };
// دالة لطباعة تقرير مخصص حسب النوع (type)

// استبدال دوال exportFilteredPDF (للزيت والصيانة)


// في BusLedger.jsx


const exportFullPDF = () => {
  if (fullHistory.length === 0) {
    alert("لا توجد سجلات للتصدير");
    return;
  }
  printBusLedgerPDF(bus, fullHistory, totalOil, totalRepair);
};

// يمكنك إضافة زر جديد "طباعة التقرير كامل" واستدعاء exportFullPDF
const handleCloseModal = () => {
    // 1. إغلاق المودال برمجياً
    setShowModal(false);

    // 2. إعادة ضبط حالة التعديل (مهم جداً للتمييز بين POST و PUT في المرة القادمة)
    if (typeof setIsEditing === 'function') setIsEditing(false);
    if (typeof setCurrentEntryId === 'function') setCurrentEntryId(null);

    // 3. تصفير الـ State الخاص بالحقول لإرجاع الفورم فارغاً
    setNewEntry({
        busId: busId, // نحافظ على ID الباص الحالي لأنه ثابت في هذه الصفحة
        date: new Date().toISOString().split("T")[0], // تاريخ اليوم كافتراضي
        currentMeter: "",
        paidAmount: "",
        cost: "",
        note: ""
    });

    // 4. (اختياري) إذا كنت تريد إعادة نوع المودال للوضع الافتراضي
    // setModalType("quick_oil"); 
};


  if (loading) return <div className={`${styles['loader-overlay']} ${loading ? styles.active : ''}`}>
  <CloudLoader />
</div>

  const totalOil = oilHistory.reduce((sum, item) => sum + item.cost, 0);
  const totalRepair = repairHistory.reduce((sum, item) => sum + item.cost, 0);

  // دالة لاختيار البيانات بناءً على التبويب النشط
  const getDisplayData = () => {
    if (activeTab === 'oil') return oilHistory;
    if (activeTab === 'repair') return repairHistory;
    return fullHistory;
  };

  return (
    <div className={styles.ledgerPage} >
    
      <header className={styles.headerCard} >
        <div className={styles.headerleft}>
          <button className="back-link" onClick={() => navigate('/home/buses')}>← العودة</button>
        </div>
        
        <div className={styles.headercenter}>
          <h1>سجل صيانة الباصات</h1>
        </div>
         <div className={styles.headerright}>
           <ul>
  <li> المالك:- {bus?.owner_name || 'غير محدد'}</li>
  <li> اسم السائق:- {driverName || 'غير مرتبط'}</li>
  <li> رقم المركبة:- {bus?.busNumber}</li>
</ul>
        </div>
        
        
      </header>

      {/* قسم الملخص - Stats */}
      <div className={styles.summarySection}>
        <div className={styles.statBox} onClick={() => setActiveTab('all')} style={{cursor: 'pointer', border: activeTab === 'all' ? '1px solid #4318ff' : ''}}>
          <span>إجمالي المنصرفات</span>
          <h2 className={styles.textDanger}>{(totalOil + totalRepair).toLocaleString()} ريال</h2>
        </div>
        <div className={styles.statBox}>
  <span>صافي الربح</span>
  <h2 style={{ color: netProfit >= 0 ? '#00e676' : '#ff5252' }}>
    {netProfit.toLocaleString()} ريال
  </h2>
</div>
        <div className={styles.statBox} onClick={() => setActiveTab('oil')} style={{cursor: 'pointer', border: activeTab === 'oil' ? '1px solid #00b8d8' : ''}}>
          <span>إجمالي الزيت</span>
          <h2 style={{color: '#00b8d8'}}>{totalOil.toLocaleString()} ريال</h2>
        </div>
        <div className={styles.statBox} onClick={() => setActiveTab('repair')} style={{cursor: 'pointer', border: activeTab === 'repair' ? '1px solid #ffab00' : ''}}>
          <span>إجمالي الصيانة</span>
          <h2 style={{color: '#ffab00'}}>{totalRepair.toLocaleString()} ريال</h2>
        </div>
      </div>

      {/* أزرار التحويل بين الجداول */}
      <div className={styles.tabsContainer}>
      
       <div className={styles.tabssection} >
        <button className={activeTab === 'all' ? styles.activeTab : ''} onClick={() => setActiveTab('all')}>السجل الشامل</button>
        <button className={activeTab === 'oil' ? styles.activeTab : ''} onClick={() => setActiveTab('oil')}>سجل الزيت</button>
        <button className={activeTab === 'repair' ? styles.activeTab : ''} onClick={() => setActiveTab('repair')}>سجل الصيانة</button>
        </div>
        
        <div className={styles.headerActions}>
        <button className="export-btn" onClick={() => exportFullPDF('repair')}>🔧  تصدير PDF</button>
        <button className="export-btn" onClick={() => exportFullPDF('oil')}>🛢 تصدير PDF</button>
           <button className={styles.actionBtn} style={{background: '#4318ff'}} onClick={() => { setModalType("quick_oil"); setShowModal(true); }}>🛢️ زيت جديد</button>
           <button className={styles.actionBtn} style={{background: '#ffab00'}} onClick={() => { setModalType("quick_repair"); setShowModal(true); }}>🔧 صيانة جديدة</button>
        </div>
        
      </div>

      {/* الجدول الديناميكي */}
      <div className={styles.tableWrapper}>
        <table className={styles.ledgerTable}>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>النوع</th>
              <th>البيان/الملاحظة</th>
              <th>التكلفة</th>
              <th>العداد</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {getDisplayData().map((item, index) => (
              <tr key={index}>
                <td>{formatDate(item.date)}</td>
                <td>
                  <span className={`${styles.statusBadge} ${item.type === 'oil' ? styles.oilType : styles.repairType}`}>
                    {item.label}
                  </span>
                </td>
                <td>{item.note || '---'}</td>
                <td className={styles.textSuccess}>{Number(item.cost).toLocaleString()} ريال</td>
               <td>
  {/* عرض العداد الإجمالي الحالي */}
  <div style={{ fontWeight: '500' }}>
    {item.meter} كم
  </div>
  
  {/* عرض الفرق (المسافة المقطوعة) فقط إذا كان نوع العملية زيت وهناك فرق محسب */}
  {item.type === 'oil' && item.diff > 0 ? (
    <div style={{ 
      fontSize: '0.85rem', 
      color: '#00e676', 
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      <span style={{ fontSize: '12px' }}>↑</span>
      <span>{item.diff} كم مقطوعة</span>
    </div>
  ) : (
    item.type === 'oil' && <span style={{ color: '#666', fontSize: '11px' }}>---</span>
  )}
              </td>
             <td>
                <button className="edit-cell" onClick={() => handleEditClick(item)}>✏️</button>&nbsp;&nbsp;
                <button className="edit-cell" onClick={(e) => { e.stopPropagation(); deleteLedger(item); }}>🗑️</button>
              </td>


              </tr>
            ))}
            {getDisplayData().length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '30px'}}>لا توجد سجلات في هذا القسم</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <UniversalModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        schemaKey={modalType}
        formData={newEntry} 
        setFormData={setNewEntry}
        onSave={handleSave}
      />
    </div>
  );
};

export default BusLedger;
