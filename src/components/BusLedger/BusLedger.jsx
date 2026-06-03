import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { smartGet, smartSave, smartDelete } from '../../utils/apiService'; 
import styles from './BusLedger.module.css'; 
import UniversalModal from '../UniversalModal'; 
import { CloudLoader, PageHeader, StatsCards ,TabsWithActions, DataTable} from '../../library/items';
import { printBusLedgerPDF } from '../../utils/pdfGenerator';
const BusLedger = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [driverName, setDriverName] = useState('');
  const [busesList, setBusesList] = useState([]);
  
  const [bus, setBus] = useState(null);
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
  

const busColumns = [
  { key: 'date', label: 'التاريخ', render: (row) => formatDate(row.date) },
  { 
    key: 'type', 
    label: 'النوع', 
    render: (row) => (
      <span className={`${styles.statusBadge} ${row.type === 'oil' ? styles.oilType : styles.repairType}`} >
        {row.label} </span>
    )
  },
  { key: 'note', label: 'البيان/الملاحظة', render: (row) => row.note || '---' },
  { 
    key: 'cost', 
    label: 'التكلفة', 
    render: (row) => <span className={styles.textSuccess}>{Number(row.cost).toLocaleString()} ريال</span>
  },
  { 
    key: 'meter', 
    label: 'العداد', 
    render: (row) => (
      <>
        <div style={{ fontWeight: '500' }}>{row.meter} كم</div>
        {row.type === 'oil' && row.diff > 0 && (
          <div style={{ fontSize: '0.85rem', color: '#00e676', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '12px' }}>↑</span>
            <span>{row.diff} كم مقطوعة</span>
          </div>
        )}
      </>
    )
  }
];

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

    
      // const sorted = busDrivers.sort((a, b) => new Date(b.receiveDate) - new Date(a.receiveDate));
        const sorted = [...busDrivers].sort((a, b) =>
          Date.parse(b.receiveDate) -
          Date.parse(a.receiveDate));
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
  // ✅ إصلاح مشكلة 13: توحيد دالة التصدير لتقرأ القسم النشط تلقائياً دون تشتيت المعاملات
  const exportFullPDF = (sectionType = null) => {
      const activeSection = sectionType || activeTab;
      printBusLedgerPDF(bus, fullHistory, activeSection, netProfit, oilHistory, repairHistory);
  };


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
<PageHeader
  backPath="/home/buses"
  title="سجل صيانة الباصات"
  rightContent={
    <ul className={styles.rightList}>
      <li>المالك:- {bus?.owner_name || 'غير محدد'}</li>
      <li>اسم السائق:- {driverName || 'غير مرتبط'}</li>
      <li>رقم المركبة:- {bus?.busNumber}</li>
    </ul>
  }
/>

      {/* قسم الملخص - Stats */}
<StatsCards cards={[
  {
    key: 'totalExpenses',
    label: 'إجمالي المنصرفات',
    value: `${(totalOil + totalRepair).toLocaleString()} ريال`,
    valueClass: styles.textDanger,
    onClick: () => setActiveTab('all'),
    activeBorder: activeTab === 'all',
  },
  {
    key: 'netProfit',
    label: 'صافي الربح',
    value: `${netProfit.toLocaleString()} ريال`,
    valueStyle: { color: netProfit >= 0 ? '#00e676' : '#ff5252' },
    // بدون onClick (في المثال الأصلي لم يكن له onClick)
  },
  {
    key: 'totalOil',
    label: 'إجمالي الزيت',
    value: `${totalOil.toLocaleString()} ريال`,
    valueStyle: { color: '#00b8d8' },
    onClick: () => setActiveTab('oil'),
    activeBorder: activeTab === 'oil',
  },
  {
    key: 'totalRepair',
    label: 'إجمالي الصيانة',
    value: `${totalRepair.toLocaleString()} ريال`,
    valueStyle: { color: '#ffab00' },
    onClick: () => setActiveTab('repair'),
    activeBorder: activeTab === 'repair',
  },
]} />
<TabsWithActions
  tabs={[
    { key: 'all', label: 'السجل الشامل' },
    { key: 'oil', label: 'سجل الزيت' },
    { key: 'repair', label: 'سجل الصيانة' }
  ]}
  activeTab={activeTab}
  onTabClick={(tabKey) => setActiveTab(tabKey)}
  actions={[
    { key: 'exportPdf', label: '🔧 تصدير PDF', onClick: () => exportFullPDF('repair'), className: 'export' },
    { key: 'exportOilPdf', label: '🛢 تصدير PDF', onClick: () => exportFullPDF('oil'), className: 'export' },
    { key: 'newOil', label: '🛢️ زيت جديد', onClick: () => { setModalType("quick_oil"); setShowModal(true); }, className: 'primary' },
    { key: 'newRepair', label: '🔧 صيانة جديدة', onClick: () => { setModalType("quick_repair"); setShowModal(true); }, className: 'warning' }
  ]}
/>

      {/* الجدول الديناميكي */}
      
      <DataTable
  columns={busColumns}
  data={getDisplayData()}
  emptyMessage="لا توجد سجلات في هذا القسم"
  renderActions={(row) => (
    <>
      <button className="edit-cell" onClick={() => handleEditClick(row)}>✏️</button>
      <button className="edit-cell" onClick={(e) => { e.stopPropagation(); deleteLedger(row); }}>🗑️</button>
    </>
  )}
  rowKey="id"
/>


      <UniversalModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        schemaKey={modalType}
        formData={newEntry} 
        setFormData={setNewEntry}
        onSave={handleSave}
        modalClassName={styles.busledgermodal}
      />
    </div>
  );
};

export default BusLedger;
