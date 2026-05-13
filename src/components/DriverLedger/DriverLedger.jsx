import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
// استيراد الدوال الذكية الجديدة
import { smartGet, smartSave, smartDelete } from '../../utils/apiService'; 
import './DriverLedger.css';
import UniversalModal from '../UniversalModal'; 
import { CloudLoader } from '../../library/items.jsx';

const DriverLedger = () => {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const [activeSchema, setActiveSchema] = useState("ledger_entry");
  const [driver, setDriver] = useState(null);
  const [ledger, setLedger] = useState([]);
  
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

  // state للزيت
  const [oilCounterVal, setOilCounterVal] = useState(0);
  const [oilInterval, setOilInterval] = useState(2000);

  // جلب البيانات
  useEffect(() => {
    fetchData();
  }, [driverId]);
  
  useEffect(() => {
    if (isNewLedgerEntry && selectedDriver) {
      console.log("Auto-fill سجل جديد للسائق:", selectedDriver);
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

      // 1. جلب بيانات السائقين للحصول على الرصيد الافتتاحي والقيمة اليومية للإيجار
      const drivers = await smartGet("driversData");
      const currentDriver = drivers.find(
        (d) => d.id.toString() === driverId.toString()
      );
      
      if (!currentDriver) {
          console.warn("لم يتم العثور على بيانات السائق");
          setLoading(false);
          return;
      }

      setDriver(currentDriver);
      setSelectedDriver(currentDriver);

      // 2. جلب سجل الحركات (Ledger) الخاص بهذا السائق
      const ledgerData = await smartGet("ledger", `driverId=${driverId}`);

      // الترتيب حسب التاريخ لضمان تسلسل العمليات بشكل منطقي
      const sortedLedger = [...ledgerData].sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return dateA - dateB;
      });

      let previousMeter = Number(currentDriver?.initialMeter || 0);
      
      // تبدأ الحسبة من الرصيد الافتتاحي (صندوق الديون القديمة)
      let runningBalance = Number(currentDriver?.opening_balance || 0);

      const processedData = sortedLedger.map((entry) => {
        const currentMeter = Number(entry.currentMeter || 0);
        const paidAmount = Number(entry.paidAmount || 0);
        
        // تحديد قيمة الإيجار بناءً على نوع العملية
        const rentAmount = (entry.type === 'debt' || entry.type === 'payment') 
          ? 0 
          : Number(currentDriver?.dailyRent || 0);

        // حساب المسافة فقط لعمليات الإيجار (rent)
        let distance = 0;
        if (entry.type !== 'debt' && entry.type !== 'payment') {
          distance = currentMeter > previousMeter ? currentMeter - previousMeter : 0;
          previousMeter = currentMeter;
        }

        // تحديث الصندوق التراكمي بناءً على النوع
        if (entry.type === 'debt') {
          runningBalance += paidAmount;
        } else if (entry.type === 'payment') {
          runningBalance -= paidAmount;
        } else {
          runningBalance += (rentAmount - paidAmount);
        }

        const currentData = {
          ...entry,
          currentMeter,
          initialMeter: Number(currentDriver?.initialMeter || 0),
          dailyRent: rentAmount,
          paidAmount,
          distance,
          cumulativeBalance: runningBalance
        };

        return currentData;
      });

      // عكس المصفوفة ليكون التاريخ الأحدث في أعلى الجدول عند العرض
      setLedger(processedData.reverse());
      setLoading(false);
    } catch (err) {
      console.error("خطأ في جلب بيانات السجل:", err);
      setLoading(false);
    }
  };

  // حساب المسافة المجمعة للزيت
  useEffect(() => {
    if (ledger.length > 0) {
      let totalDistance = ledger.reduce((sum, entry) => {
        const distance = Number(entry.distance || 0);
        return sum + distance;
      }, 0);
      setOilCounterVal(totalDistance);
    }
  }, [ledger]);

  // تحديد اللون لعرض المسافة
  const oilColorClass = oilCounterVal <= oilInterval ? "text-success" : "text-danger";

  // إضافة سجل جديد
  const handleAddEntry = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const currentBusId = driver?.busId || driver?.bus_id;
      const entryType = newEntry.type || "rent";
      let amount = Number(newEntry.paidAmount || 0);

      const dataToSave = {
        driverId: driverId,
        busId: currentBusId,
        date: newEntry.date || new Date().toISOString(),
        currentMeter: (entryType === 'debt' || entryType === 'payment')
          ? Number(ledger[0]?.currentMeter || driver?.initialMeter || 0)
          : Number(newEntry.currentMeter || 0),
        paidAmount: amount,
        type: entryType,
        note: newEntry.note || ""
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
    // تعيين نوع المودال بناءً على نوع السجل
    if (entry.type === 'debt') {
      setActiveSchema('debt_entry');
    } else if (entry.type === 'payment') {
      setActiveSchema('payment_entry');
    } else {
      setActiveSchema('ledger_entry');
    }
    setNewEntry({
      date: entry.date,
      currentMeter: Number(entry.currentMeter),
      paidAmount: Number(entry.paidAmount),
      type: entry.type,      // حفظ النوع الأصلي
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
      await fetchData();  // إعادة جلب البيانات لحساب الأرصدة من جديد
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

  const exportPDF = () => {
    if (ledger.length === 0) {
      alert("لا توجد بيانات للتصدير");
      return;
    }
    const doc = new jsPDF("p", "pt", "a4");
    doc.text(`Driver Report: ${driver.name}`, 40, 50);
    autoTable(doc, {
      startY: 120,
      head: [["Date", "Meter", "Dist", "Rent", "Paid", "Balance"]],
      body: ledger.map((item) => [
        item.date,
        item.currentMeter,
        `${item.distance} KM`,
        item.dailyRent,
        item.paidAmount,
        item.cumulativeBalance
      ])
    });
    doc.save(`Report_${driver.name}.pdf`);
  };

  if (loading) return (
    <div className={`loader-overlay ${loading ? 'active' : ''}`}>
      <CloudLoader />
    </div>
  );

  return (
    <div className="ledger-page" dir="rtl">
      <header className="ledger-header-card">
        <div className="right-side">
          <button className="back-link" onClick={() => navigate('/home/drivers')}>← العودة</button>
          <h1>سجل الحساب اليومي</h1>
          <h3>{driver.name} | مركبة #{driver.busNumber}</h3>
        </div>
        <div className="left-side">
          <button className="export-btn" onClick={exportPDF}>📤 تصدير PDF</button>
          
          <button className="debt-btn"
            onClick={() => {
              setActiveSchema("debt_entry");
              setNewEntry({ ...newEntry, type: 'debt', paidAmount: '' });
              setShowModal(true);
            }}>+ إضافة دين</button>

          <button className="payment-btn" onClick={() => {
              setActiveSchema("payment_entry");
              setNewEntry({ ...newEntry, type: 'payment', paidAmount: '' });
              setShowModal(true);
            }}>+ سداد مديونية</button>
           
          <button className="add-entry-btn" onClick={() => {
              setActiveSchema("ledger_entry");
              setIsNewLedgerEntry(true);
              setShowModal(true);
            }}>+ إيجار يومي</button>
        </div>
      </header>

      <div className="summary-section">
        <div className="stat-box">
          <span>المديونية الكلية</span>
          <h2 className="text-danger">
            {Number(ledger[0]?.cumulativeBalance || driver?.opening_balance || 0).toLocaleString()} ريال
          </h2>
        </div>
        <div className="stat-box">
          <span>آخر ميتار</span>
          <h2>{ledger[0]?.currentMeter || driver.initialMeter}</h2>
        </div>
        <div className="stat-box">
          <span>المسافه المقطوعة</span>
          <h2 className={oilColorClass}>
            {oilCounterVal <= oilInterval
              ? `${oilCounterVal} كم`
              : `تجاوز ${oilCounterVal - oilInterval} كم`}
          </h2>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>الميتار</th>
              <th>المسافة</th>
              <th>الإيجار</th>
              <th>المدفوع</th>
              <th>صافي اليوم</th>  {/* تم تغيير العنوان */}
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.date)}</td>
                <td>{entry.currentMeter}</td>
                <td className={entry.distance > 200 ? "balance-debt" : "balance-ok"}>
                  {entry.distance} كم
                </td>
                <td>{Number(entry.dailyRent || 0).toLocaleString()} ريال</td>
                <td className="paid-val">{Number(entry.paidAmount || 0).toLocaleString()} ريال</td>
                <td className={(Number(entry.dailyRent) - Number(entry.paidAmount)) > 0 ? "balance-debt" : "balance-ok"}>
                  {Number(entry.dailyRent) - Number(entry.paidAmount)} ريال
                </td>
                <td>
                  <button 
                    className="edit-cell" 
                    onClick={() => handleEditClick(entry)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', margin: '0 4px', color: '#4f46e5' }}
                  >✏️</button>
                  <button 
                    className="edit-cell" 
                    onClick={(e) => { e.stopPropagation(); deleteLedger(entry.id); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', margin: '0 4px', color: '#ef4444' }}
                  >🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
      />
    </div>
  );
};

export default DriverLedger;