import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { smartGet, smartSave, smartDelete } from '../../utils/apiService';
import './DriverLedger.css';
import UniversalModal from '../UniversalModal';
//import { CloudLoader } from '../../library/items.jsx';
import {CloudLoader, PageHeader, StatsCards ,TabsWithActions, DataTable} from '../../library/items';
import { printDriverLedgerPDF } from '../../utils/pdfGenerator';

const DriverLedger = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [activeSchema, setActiveSchema] = useState("ledger_entry");
  const [driver, setDriver] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, rent, debt_payment

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [isNewLedgerEntry, setIsNewLedgerEntry] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    driverId: "",
    busId: "",
    currentMeter: "",
    paidAmount: "",
    type: "rent",
    note: ""
  });
  
  

// تعريف الأعمدة
const ledgerColumns = [
  { key: 'date', label: 'التاريخ', render: (row) => formatDate(row.date) },
  { 
    key: 'type', 
    label: 'النوع', 
    render: (row) => {
      const { icon, label, badgeClass } = getTransactionDetails(row.type);
      return <span className={`transaction-badge ${badgeClass}`}>{icon} {label}</span>;
    }
  },
  { key: 'note', label: 'البيان / الملاحظة', render: (row) => row.note || '---' },
  { key: 'currentMeter', label: 'الميتار' },
  { 
    key: 'distance', 
    label: 'المسافة (كم)', 
    render: (row) => (
      <span className={row.distance > 200 ? "balance-debt" : "balance-ok"}>
        {row.distance} كم
      </span>
    )
  },
  { 
    key: 'dailyRent', 
    label: 'الإيجار', 
    render: (row) => `${Number(row.dailyRent || 0).toLocaleString()} ريال`
  },
  { 
    key: 'paidAmount', 
    label: 'المدفوع', 
    render: (row) => <span className="paid-val">{Number(row.paidAmount || 0).toLocaleString()} ريال</span>
  },
  { 
    key: 'netDay', 
    label: 'صافي اليوم', 
    render: (row) => {
      const net = Number(row.dailyRent || 0) - Number(row.paidAmount || 0);
      return <span className={net > 0 ? "balance-debt" : "balance-ok"}>{net.toLocaleString()} ريال</span>;
    }
  }
];


  // state للزيت
  const [oilCounterVal, setOilCounterVal] = useState(0);
  const [oilInterval, setOilInterval] = useState(2000);
  const [oilWarning, setOilWarning] = useState(2500);
// جلب آخر تاريخ لتغيير زيت الباص المرتبط بالسائق
const fetchLastOilChangeDate = async (busId) => {
  if (!busId) return null;
  try {
    const oilChanges = await smartGet("oil_changes", `busId=${busId}`);
    if (oilChanges && oilChanges.length > 0) {
      const sorted = oilChanges.sort((a, b) => new Date(b.changedate) - new Date(a.changedate));
      return new Date(sorted[0].changedate);
    }
  } catch (err) {
    console.error("خطأ في جلب تغييرات الزيت:", err);
  }
  return null;
};
  // جلب البيانات
  useEffect(() => {
    fetchData();
  }, [driverId]);

  useEffect(() => {
    if (isNewLedgerEntry && selectedDriver) {
      setNewEntry(prev => ({
        ...prev,
        driverId: selectedDriver.driver_id,
        busNumber: selectedDriver.busNumber || '',
        currentMeter: selectedDriver.lastmeter || selectedDriver.initialMeter || '',
        paidAmount: selectedDriver.dailyRent || '',
        date: new Date().toISOString().split('T')[0]
      }));
      setIsNewLedgerEntry(false);
    }
  }, [isNewLedgerEntry, selectedDriver]);

    const fetchData = async () => {
    try {
      setLoading(true);
      const drivers = await smartGet("driversData");
      const currentDriver = drivers.find(d => d.id.toString() === driverId.toString());
       
      if (!currentDriver) {
        console.warn("لم يتم العثور على بيانات السائق");
        setLoading(false);
        return;
      }
      setDriver(currentDriver);
      setSelectedDriver(currentDriver);

      const ledgerData = await smartGet("ledger", `driverId=${driverId}`);
      const sortedLedger = [...ledgerData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let previousMeter = Number(currentDriver?.initialMeter || 0);
      let runningBalance = Number(currentDriver?.opening_balance || 0);
      const processedData = [];

      // جلب آخر تاريخ تغيير زيت للباص
      const lastOilDate = await fetchLastOilChangeDate(currentDriver.busId);
      let totalDistanceSinceOil = 0;
      let lastOilMeter = previousMeter;

      if (lastOilDate) {
        // نبحث عن قراءة العداد عند آخر تغيير زيت (أقرب سجل بعد أو في نفس التاريخ)
        const oilChangeLedger = sortedLedger.find(entry => new Date(entry.date) >= lastOilDate);
        if (oilChangeLedger) lastOilMeter = Number(oilChangeLedger.currentMeter);
        previousMeter = lastOilMeter;
      }

      for (const entry of sortedLedger) {
        const currentMeter = Number(entry.currentMeter || 0);
        const paidAmount = Number(entry.paidAmount || 0);
        
        // 🚀 إصلاح مشكلة 28 المعمارية: نعتمد أولاً على القيمة التاريخية المثبتة rentAmount في قاعدة البيانات
        // وإذا لم تكن موجودة أو كانت صفر (للسجلات القديمة) نأخذ القيمة الافتراضية للباص كـ fallback لضمان ثبات العمليات الحسابية
        const rentAmount = (entry.type === 'debt' || entry.type === 'payment') 
          ? 0 
          : Number(entry.rentAmount || entry.dailyRent || currentDriver?.dailyRent || 0);

        let distance = 0;
        if (entry.type !== 'debt' && entry.type !== 'payment') {
          distance = currentMeter > previousMeter ? currentMeter - previousMeter : 0;
          previousMeter = currentMeter;
        }

        // حساب المسافة المقطوعة منذ آخر تغيير زيت فقط
        if (entry.type !== 'debt' && entry.type !== 'payment') {
          if (lastOilDate && new Date(entry.date) >= lastOilDate) {
            totalDistanceSinceOil += distance;
          } else if (!lastOilDate) {
            totalDistanceSinceOil += distance;
          }
        }

        if (entry.type === 'debt') runningBalance += paidAmount;
        else if (entry.type === 'payment') runningBalance -= paidAmount;
        else runningBalance += (rentAmount - paidAmount);

        processedData.push({
          ...entry,
          currentMeter,
          initialMeter: Number(currentDriver?.initialMeter || 0),
          dailyRent: rentAmount, // عرض القيمة التاريخية الثابتة في الجدول
          paidAmount,
          distance,
          cumulativeBalance: runningBalance
        });
      }

      setLedger(processedData.reverse());
      setOilCounterVal(totalDistanceSinceOil); // تعيين المسافة منذ آخر تغيير زيت
      setLoading(false);
    } catch (err) {
      console.error("خطأ في جلب بيانات السجل:", err);
      setLoading(false);
    }
  };

  
  // حساب إجمالي المدفوع للإيجار
const totalRentPaid = ledger
  .filter(entry => entry.type === 'rent' || entry.type === 'payment')
  .reduce((sum, entry) => sum + Number(entry.paidAmount || 0), 0);

  // حساب المسافة المجمعة للزيت
  

  const oilColorClass = oilCounterVal <= oilInterval ? "text-success" : "text-danger";

  // دالة الفلترة حسب التبويب النشط
  const getFilteredLedger = () => {
    if (activeTab === "all") return ledger;
    if (activeTab === "rent") return ledger.filter(entry => entry.type === "rent");
    if (activeTab === "debt_payment") return ledger.filter(entry => entry.type === "debt" || entry.type === "payment");
    return ledger;
  };

  // دالة مساعدة للحصول على الأيقونة والنص المعروض لنوع العملية
  const getTransactionDetails = (type) => {
    switch (type) {
      case 'rent':
        return { icon: '', label: 'إيجار', badgeClass: 'type-rent' };
      case 'debt':
        return { icon: '', label: 'دين', badgeClass: 'type-debt' };
      case 'payment':
        return { icon: '', label: 'سداد ', badgeClass: 'type-payment' };
      default:
        return { icon: '', label: type, badgeClass: '' };
    }
  };
  // التحقق من صحة قراءة العداد قبل حفظ الإيجار اليومي
  const validateMeterReading = (entryType, currentMeter) => {
  // فقط لعمليات الإيجار (نوع rent) نحتاج للتحقق
  if (entryType !== 'rent') return { valid: true };

  // الحصول على آخر قراءة مسجلة للعداد
  const lastMeter = Number(ledger[0]?.currentMeter || driver?.initialMeter || 0);

  // 1. التحقق من أن العداد الجديد أكبر أو يساوي آخر قراءة
  if (currentMeter < lastMeter) {
    return {
      valid: false,
      message: `رقم العداد الذي أدخلته (${currentMeter} كم) غير صحيح، وهو أقل من آخر قراءة مسجلة (${lastMeter} كم).`
    };
  }

  // 2. التحقق من أن المسافة المقطوعة منذ آخر تغيير زيت لا تتجاوز الحد المسموح (2000 كم)
  const distanceSinceLastOil = oilCounterVal + (currentMeter - lastMeter);
  if (distanceSinceLastOil > oilWarning) {
    return {
      valid: false,
      message: `المسافة المقطوعة للعداد الذي أدخلته ستتجاوز ${oilInterval} كم (الحد المسموح لتغيير الزيت). يرجى إنشاء سجل جديد لتغيير الزيت أولاً ثم متابعة تسجيل الإيجار.`
    };
  }

  return { valid: true };
};

    const handleAddEntry = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const currentBusId = driver?.busId || driver?.bus_id;
      const entryType = newEntry.type || "rent";
      let amount = Number(newEntry.paidAmount || 0);
      
      const currentMeter = Number(newEntry.currentMeter || 0);

      // ✅ التحقق من صحة العداد (فقط للإيجار)
      if (entryType === 'rent') {
        const validation = validateMeterReading(entryType, currentMeter);
        if (!validation.valid) {
          alert(validation.message);
          setIsSaving(false); // 🛠️ إصلاح مشكلة 6: إلغاء وضع الحفظ هنا لكي لا يعلق الزر في المودال عند فشل التحقق
          return; // منع الحفظ
        }
      }

      const dataToSave = {
        driverId: driverId,
        busId: currentBusId,
        date: newEntry.date || new Date().toISOString(),
        currentMeter: (entryType === 'debt' || entryType === 'payment')
          ? Number(ledger[0]?.currentMeter || driver?.initialMeter || 0)
          : Number(newEntry.currentMeter || 0),
        paidAmount: amount,
        type: entryType,
        note: newEntry.note || "",
        // 🚀 إصلاح مشكلة 28 المعمارية: إرسال قيمة الإيجار اللحظية ليتم حفظها وتثبيتها في قاعدة البيانات
        rentAmount: entryType === 'rent' ? Number(newEntry.rentAmount || driver?.dailyRent || 0) : 0
      };

      await smartSave("ledger", dataToSave, isEditing ? currentEntryId : null);
      await fetchData();
      handleCloseModal();
      
      const successMsg = entryType === 'debt' ? "تم تسجيل الدين بنجاح" :
        entryType === 'payment' ? "تم تسجيل السداد بنجاح" : "تم تسجيل العملية بنجاح";
      alert(successMsg);
    } catch (err) {
      console.error("Error saving entry:", err);
      alert("حدث خطأ أثناء الحفظ: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };


  const handleEditClick = (entry) => {
    setIsEditing(true);
    setCurrentEntryId(entry.id);
    if (entry.type === 'debt') setActiveSchema('debt_entry');
    else if (entry.type === 'payment') setActiveSchema('payment_entry');
    else setActiveSchema('ledger_entry');
    setNewEntry({
      date: entry.date,
      currentMeter: Number(entry.currentMeter),
      paidAmount: Number(entry.paidAmount),
      type: entry.type,
      note: entry.note || ""
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentEntryId(null);
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      currentMeter: "",
      paidAmount: "",
      note: "",
      type: "rent"
    });
  };

  const deleteLedger = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    try {
      await smartDelete("ledger", id);
      await fetchData();
      alert("تم حذف السجل بنجاح");
    } catch (err) {
      console.error("فشل الحذف:", err);
      alert("فشل الحذف");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return `${days[dateObj.getDay()]}-${String(dateObj.getDate()).padStart(2, "0")}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
  };

  // في DriverLedger.jsx


const exportPDF = () => {
  if (ledger.length === 0) {
    alert("لا توجد بيانات للتصدير");
    return;
  }
  const totalRentPaid = ledger
    .filter(entry => entry.type === 'rent' || entry.type === 'payment')
    .reduce((sum, entry) => sum + Number(entry.paidAmount || 0), 0);
  const totalDebt = Number(ledger[0]?.cumulativeBalance || driver?.opening_balance || 0);
  printDriverLedgerPDF(driver, ledger, totalRentPaid, totalDebt);
};

  if (loading) return (
    <div className={`loader-overlay ${loading ? 'active' : ''}`}>
      <CloudLoader />
    </div>
  );

  return (
    <div className="ledger-page" >
<PageHeader
  backPath="/home/drivers"
  title="سجل الحساب اليومي"
  rightContent={
    <ul>
      <li>الاسم: {driver.name}</li>
      <li>رقم الباص: {driver.busNumber}</li>
      <li>رقم الهاتف: {driver.phone}</li>
    </ul>
  }
/>

      {/* قسم الإحصائيات */}
<StatsCards cards={[
  {
    key: 'debt',
    label: 'المديونية الكلية',
    value: `${Number(ledger[0]?.cumulativeBalance || driver?.opening_balance || 0).toLocaleString()} ريال`,
    valueClass: 'text-danger',
    onClick: () => setActiveTab('debt_payment'),
    activeBorder: activeTab === 'debt_payment',
  },
  {
    key: 'totalPaid',
    label: 'إجمالي المدفوع للإيجار',
    value: `${totalRentPaid.toLocaleString()} ريال`,
    valueClass: 'text-success',
    onClick: () => setActiveTab('rent'),
    activeBorder: activeTab === 'rent',
  },
  {
    key: 'lastMeter',
    label: 'آخر ميتار',
    value: `${ledger[0]?.currentMeter || driver.initialMeter}`,
    // بدون onClick (لأنه في النص الأصلي لم يكن له حدث)
    activeBorder: false,
  },
  {
    key: 'distance',
    label: 'المسافة المقطوعة',
    value: oilCounterVal > oilInterval ? `⚠️ تحذير تجاوز ${oilCounterVal} كم` : `${oilCounterVal} كم`,
    valueClass: oilCounterVal > oilInterval ? 'text-danger' : 'text-success',
    // بدون onClick
  },
]} />

      {/* أزرار التبويبات */}
<TabsWithActions
  tabs={[
    { key: 'all', label: 'الكل' },
    { key: 'rent', label: 'الإيجار' },
    { key: 'debt_payment', label: 'ديون وسداد' }
  ]}
  activeTab={activeTab}
  onTabClick={(tabKey) => setActiveTab(tabKey)}
  actions={[
    { key: 'export', label: '📤 تصدير PDF', onClick: exportPDF, className: 'export' },
    { 
      key: 'debt', 
      label: 'إضافة دين', 
      onClick: () => {
        setActiveSchema("debt_entry");
        setNewEntry({ ...newEntry, type: 'debt', paidAmount: '' });
        setShowModal(true);
      }, 
      className: 'primary' 
    },
    { 
      key: 'payment', 
      label: 'سداد مديونية', 
      onClick: () => {
        setActiveSchema("payment_entry");
        setNewEntry({ ...newEntry, type: 'payment', paidAmount: '' });
        setShowModal(true);
      }, 
      className: 'primary' 
    },
    { 
      key: 'rent', 
      label: 'إيجار يومي', 
      onClick: () => {
        setActiveSchema("ledger_entry");
        setIsNewLedgerEntry(true);
        setNewEntry({ ...newEntry, type: 'rent', rentAmount: driver?.dailyRent || 0 });
        
        setShowModal(true);
      }, 
      className: 'primary' 
    }
  ]}
/>

      {/* الجدول */}
     <DataTable
  columns={ledgerColumns}
  data={getFilteredLedger()}
  emptyMessage="لا توجد سجلات في هذا القسم"
  renderActions={(row) => (
    <>
      <button className="edit-cell" onClick={() => handleEditClick(row)}>✏️</button>
      <button className="delete-cell" onClick={(e) => { e.stopPropagation(); deleteLedger(row.id); }}>🗑️</button>
    </>
  )}
  rowKey="id"
/>

      <UniversalModal
        isOpen={showModal}
        onClose={handleCloseModal}
        schemaKey={activeSchema}
        title={
          activeSchema === "debt_entry" ? "➕ إضافة دين/سلفة" :
            activeSchema === "payment_entry" ? "➕ سداد مديونية" :
              isEditing ? "📝 تعديل سجل" : "➕ إضافة سجل إيجار"
        }
        formData={newEntry}
        setFormData={setNewEntry}
        onSave={handleAddEntry}
        loading={isSaving}
        modalClassName="driver-ledger-modal"
      />
    </div>
  );
};

export default DriverLedger;