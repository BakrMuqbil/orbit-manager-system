import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { smartGet, smartSave } from '../../utils/apiService'; 
import styles from './BusLedger.module.css'; 
import UniversalModal from '../UniversalModal'; 

const BusLedger = () => {
  const { busId } = useParams();
  const navigate = useNavigate();

  const [bus, setBus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("quick_oil"); 
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'oil', 'repair'

  // البيانات المعالجة
  const [oilHistory, setOilHistory] = useState([]);
  const [repairHistory, setRepairHistory] = useState([]);
  const [fullHistory, setFullHistory] = useState([]);

  const [newEntry, setNewEntry] = useState({
    busId: busId,
    date: new Date().toISOString().split("T")[0],
    currentMeter: "",
    busNumber: '',
    paidAmount: "",
    dailyRent:'',
    cost:"",
    note: ""
  });

  useEffect(() => {
    fetchBusData();
  }, [busId]);

  const fetchBusData = async () => {
    try {
      setLoading(true);
      
      // 1. جلب بيانات الباصات وتحديد الباص الحالي
      const buses = await smartGet("buses");
      const currentBus = buses.find(b => b.id.toString() === busId.toString());
      setBus(currentBus);

      // 2. جلب سجلات الزيت والصيانة بالتوازي
      const [oilData, repairData] = await Promise.all([
        smartGet("oil_changes", `busId=${busId}`).catch(() => []),
        smartGet("repairsData", `busId=${busId}`).catch(() => [])
      ]);
      console.log("📦 البيانات القادمة من السيرفر (oilData):", oilData);

      // 3. معالجة بيانات الزيت (ترتيب تصاعدي أولاً لضمان صحة الحساب الرقمي)
      let processedOil = oilData.map(o => {
        // توحيد مسمى العداد من currentMeter (الظاهر في الكونسول) أو المسميات الأخرى
        const actualMeter = Number(o.currentMeter || o.totaldistance || o.meter || 0);
        
        return { 
          ...o, 
          type: 'oil', 
          label: 'تغيير زيت',
          cost: Number(o.amount || o.paidAmount || 0),
          meter: actualMeter, 
          date: o.changedate || o.changedate || o.date 
        };
      }).sort((a, b) => a.meter - b.meter); // الترتيب من الأقل عدداً للأكثر

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

      // 6. وظيفة الترتيب التنازلي (الأحدث فوق) مع حل مشكلة Arithmetic Operation في Acode
      const sortByDateDesc = (data) => [...data].sort((a, b) => {
        const dateB = new Date(b.date).getTime();
        const dateA = new Date(a.date).getTime();
        return dateB - dateA; // استخدام getTime() يمنع الخطأ البرمجي تماماً
      });

      // 7. تجهيز المصفوفات النهائية للعرض
      const finalOilHistory = sortByDateDesc(processedOil);
      const finalRepairHistory = sortByDateDesc(processedRepair);
      const finalFullHistory = sortByDateDesc([...processedOil, ...processedRepair]);

      // --- منطقة الاختبار (الآن ستظهر الأرقام الحقيقية) ---
      console.log("--------------------------------");
      console.log("🔍 فحص بيانات الزيت النهائية (الترتيب: الأحدث أولاً):");
      finalOilHistory.forEach((item, index) => {
          console.log(`سجل ${index + 1}: العداد = ${item.meter} ، المسافة المقطوعة (diff) = ${item.diff}`);
      });
      console.log("--------------------------------");

      // 8. تحديث الحالة لمرة واحدة لكل مصفوفة
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

    // دالة الأمان لمنع NaN وتحويل الفراغ إلى 0
    const fixNum = (val) => {
      const n = parseInt(val, 10);
      return isNaN(n) ? 0 : n;
    };

    const finalCost = fixNum(newEntry.paidAmount || newEntry.cost || 0);
    const finalMeter = fixNum(newEntry.currentMeter || 0);

    const dataToSave = isOil
      ? {
          // مطابقة تماماً لما يقرأه السيرفر
          busId: parseInt(busId),
          date: newEntry.date || new Date().toISOString().split("T")[0],
          currentMeter: finalMeter,
          paidAmount: finalCost,
          note: String(newEntry.note || "تغيير زيت دوري"),
        }
      : {
          // الصيانة كما هي تعمل الآن
          busId: parseInt(busId),
          date: newEntry.date || new Date().toISOString().split("T")[0],
          cost: finalCost,
          currentMeter: finalMeter,
          note: String(newEntry.note || ""),
        };

    console.log("🚀 جاري الحفظ بالبيانات:", dataToSave);

    await smartSave(endpoint, dataToSave);
    await fetchBusData();
    setShowModal(false);

    // تنظيف الحالة
    setNewEntry({
      busId: busId,
      date: new Date().toISOString().split("T")[0],
      currentMeter: "",
      paidAmount: "",
      dailyRent: "",
      cost: "",
      note: "",
    });

    alert("تم الحفظ بنجاح");
  } catch (err) {
    console.error("❌ فشل الحفظ:", err);
    alert("فشل الحفظ: يرجى إدخال أرقام صحيحة");
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
const exportFilteredPDF = (filterType) => {
  const doc = new jsPDF("p", "pt", "a4");
  const busName = bus?.busNumber || "Bus";
  
  // 1. تصفية البيانات بناءً على النوع المختار
  const filteredData = fullHistory.filter(item => item.type === filterType);
  
  
  // تحديد عنوان التقرير بناءً على النوع
  const reportTitle = filterType === 'oil' ? 'Oil Change History Report' : 'General Repairs Report';
  

  // 2. إعداد الهيدر
  doc.setFontSize(20);
  doc.setTextColor(11, 20, 55); // تنسيق Navy الفاخر
  
  
  doc.text(reportTitle, 40, 50);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Bus: ${busName} | Records: ${filteredData.length}`, 40, 75);
  
  // 3. تحويل البيانات المفلترة إلى مصفوفة للجدول
  const tableBody = filteredData.map((item) => [
    new Date(item.date).toLocaleDateString("en-US"),
    `${item.meter?.toLocaleString()} KM`,
    filterType === 'oil' ? `${item.diff?.toLocaleString() || 0} KM` : "---", // المسافة تظهر فقط للزيت
    `${Number(item.cost).toLocaleString()} YR`,
    item.note || "No notes"
  ]);

  // 4. إنشاء الجدول
  autoTable(doc, {
    startY: 100,
    head: [["Date", "Meter Reading", "Trip Dist", "Cost", "Description"]],
    body: tableBody,
    headStyles: { fillColor: [11, 20, 55] }, // لون Navy الملكي
    alternateRowStyles: { fillColor: [245, 247, 251] },
  });
  const finalY = doc.lastAutoTable.finalY; // هذا يعطيك آخر نقطة وصل لها الجدول

doc.setFontSize(12);
doc.setTextColor(0);

// إضافة إجمالي التكلفة في اليمين
const totalCost = filteredData.reduce((sum, item) => sum + Number(item.cost), 0);
doc.text(`Total Cost: ${totalCost.toLocaleString()} YR`, 550, finalY + 30, { align: "right" });

// إضافة خانة التوقيع في اليمين
doc.text("Signature: ________________",50, finalY + 70);


  // 5. حفظ الملف باسم النوع
  doc.save(`${filterType}_Report_${busName}.pdf`);
};

  if (loading) return <div className="loader">جاري التحميل...</div>;

  const totalOil = oilHistory.reduce((sum, item) => sum + item.cost, 0);
  const totalRepair = repairHistory.reduce((sum, item) => sum + item.cost, 0);

  // دالة لاختيار البيانات بناءً على التبويب النشط
  const getDisplayData = () => {
    if (activeTab === 'oil') return oilHistory;
    if (activeTab === 'repair') return repairHistory;
    return fullHistory;
  };

  return (
    <div className={styles.ledgerPage} dir="rtl">
      <header className={styles.headerCard}>
        <div className="right-side">
          <button className={styles.backLink} onClick={() => navigate('/home/buses')}>← العودة</button>
          <h1>سجل صيانة المركبة</h1>
          <h3>مركبة 
          #{bus?.busNumber}</h3>
        </div>
        
        <div className={styles.headerActions}>
        <button className="export-btn" onClick={() => exportFilteredPDF('repair')}>🔧  تصدير PDF</button>
        <button className="export-btn" onClick={() => exportFilteredPDF('oil')}>🛢 تصدير PDF</button>
           <button className={styles.actionBtn} onClick={() => { setModalType("quick_oil"); setShowModal(true); }}>🛢️ زيت جديد</button>
           <button className={styles.actionBtn} style={{background: '#ffab00'}} onClick={() => { setModalType("quick_repair"); setShowModal(true); }}>🔧 صيانة جديدة</button>
        </div>
      </header>

      {/* قسم الملخص - Stats */}
      <div className={styles.summarySection}>
        <div className={styles.statBox} onClick={() => setActiveTab('all')} style={{cursor: 'pointer', border: activeTab === 'all' ? '1px solid #4318ff' : ''}}>
          <span>إجمالي المنصرفات</span>
          <h2 className={styles.textDanger}>{(totalOil + totalRepair).toLocaleString()} ريال</h2>
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
        <button className={activeTab === 'all' ? styles.activeTab : ''} onClick={() => setActiveTab('all')}>السجل الشامل</button>
        <button className={activeTab === 'oil' ? styles.activeTab : ''} onClick={() => setActiveTab('oil')}>سجل الزيت</button>
        <button className={activeTab === 'repair' ? styles.activeTab : ''} onClick={() => setActiveTab('repair')}>سجل الصيانة</button>
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
