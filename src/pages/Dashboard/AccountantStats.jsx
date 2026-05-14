import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiCash, mdiOil, mdiWrench, mdiAccountGroup, mdiPlus } from '@mdi/js';
import { smartSave, smartGet } from '../../utils/apiService';
import './AccountantStats.css';
import UniversalModal from '../../components/UniversalModal';
import { CloudLoader } from '../../library/items.jsx';

const AccountantStats = () => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // الحالات (States)
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(0); // 0 = السنة بأكملها
  const [availableYears, setAvailableYears] = useState([currentYear]);
  
  const [stats, setStats] = useState({
    todayRevenue: 0,
    oilExpenses: 0,
    maintenanceExpenses: 0,
    totalDrivers: 0,
    totalSystemDebt: 0,
  });
  const [driversList, setDriversList] = useState([]);
  const [buses, setBuses] = useState([]);
  const [oilChanges, setOilChanges] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quickTask, setQuickTask] = useState('quick_rent');
  const [quickFormData, setQuickFormData] = useState({
    date: getTodayDate(),
    driverId: '',
    driverName: '',
    busNumber: '',
    busId: '',
    currentMeter: '',
    paidAmount: '',
    cost: '',
    oilInterval: 2000,
    dailyRent: '',
    note: '',
    type: 'rent',
  });

  // دالة مساعدة آمنة للتحويل إلى رقم
  const safeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

  // استخراج السنوات المتاحة من البيانات
  const extractYearsFromData = (ledgerData, oilData, repairsData) => {
    const yearsSet = new Set();
    [...ledgerData, ...oilData, ...repairsData].forEach(item => {
      const dateStr = item.date || item.changedate;
      if (dateStr) {
        const year = new Date(dateStr).getFullYear();
        if (!isNaN(year)) yearsSet.add(year);
      }
    });
    if (yearsSet.size === 0) yearsSet.add(currentYear);
    return Array.from(yearsSet).sort((a, b) => b - a);
  };

  // حساب تاريخ البداية والنهاية بناءً على السنة والشهر
  const getDateRange = (year, month) => {
    let fromDate, toDate;
    if (month === 0) { // السنة كاملة
      fromDate = `${year}-01-01`;
      toDate = `${year}-12-31`;
    } else { // شهر محدد
      const lastDay = new Date(year, month, 0).getDate();
      fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
      toDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    }
    return { fromDate, toDate };
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      // جلب كل البيانات المطلوبة بالتوازي
      const [drivers, ledgerData, busesData, oilData, repairsData] = await Promise.all([
        smartGet('driversData'),
        smartGet('ledger'),
        smartGet('buses'),
        smartGet('oil_changes'),
        smartGet('repairsData'),
      ]);

      // استخراج السنوات المتاحة وتحديث القائمة المنسدلة
      const years = extractYearsFromData(ledgerData, oilData, repairsData);
      setAvailableYears(years);
      if (!years.includes(filterYear)) {
        setFilterYear(years[0]);
      }

      // حساب الفترة بناءً على السنة والشهر المختارين
      const { fromDate, toDate } = getDateRange(filterYear, filterMonth);

      // 1. حساب إيرادات الفترة (المقبوضات)
      const filteredLedger = ledgerData.filter(
        (entry) => entry.date >= fromDate && entry.date <= toDate
      );
      const periodRevenue = filteredLedger.reduce((acc, curr) => acc + safeNumber(curr.paidAmount), 0);

      // 2. حساب مصاريف الزيت (من oil_changes) حسب الفترة
      const filteredOil = oilData.filter(
        (oil) => oil.changedate >= fromDate && oil.changedate <= toDate
      );
      const oilExpensesTotal = filteredOil.reduce((acc, curr) => acc + safeNumber(curr.amount), 0);

      // 3. حساب مصاريف الصيانة (من repairs) حسب الفترة
      const filteredRepairs = repairsData.filter(
        (rep) => rep.date >= fromDate && rep.date <= toDate
      );
      const maintenanceExpensesTotal = filteredRepairs.reduce((acc, curr) => acc + safeNumber(curr.cost), 0);

      // 4. حساب المديونية الكلية للنظام (دون فلترة زمنية، لأنها رصيد تراكمي)
      const totalSystemDebt = drivers.reduce((acc, driver) => {
        const driverEntries = ledgerData.filter((l) => String(l.driverId) === String(driver.id));
        const bus = busesData.find((b) => b.id === driver.busId);
        const dailyRent = bus ? safeNumber(bus.dailyRent) : 0;
        let driverDebt = 0;
        driverEntries.forEach((entry) => {
          if (entry.type === 'rent') {
            driverDebt += dailyRent - safeNumber(entry.paidAmount);
          } else if (entry.type === 'debt') {
            driverDebt += safeNumber(entry.paidAmount);
          } else if (entry.type === 'payment') {
            driverDebt -= safeNumber(entry.paidAmount);
          }
        });
        return acc + driverDebt;
      }, 0);

      // 5. معالجة بيانات السائقين مع أرصدتهم الحالية (أيضاً بدون فلترة زمنية)
      const processedDrivers = drivers.map((driver) => {
        const driverEntries = ledgerData.filter((l) => String(l.driverId) === String(driver.id));
        const bus = busesData.find((b) => b.id === driver.busId);
        const dailyRent = bus ? safeNumber(bus.dailyRent) : 0;
        let currentBalance = 0;
        driverEntries.forEach((entry) => {
          if (entry.type === 'rent') {
            currentBalance += dailyRent - safeNumber(entry.paidAmount);
          } else if (entry.type === 'debt') {
            currentBalance += safeNumber(entry.paidAmount);
          } else if (entry.type === 'payment') {
            currentBalance -= safeNumber(entry.paidAmount);
          }
        });
        return {
          ...driver,
          balance: currentBalance,
          status: currentBalance <= 0 ? 'محاسب' : 'مديون',
        };
      });

      // تحديث جميع الحالات دفعة واحدة
      setStats({
        todayRevenue: periodRevenue,
        oilExpenses: oilExpensesTotal,
        maintenanceExpenses: maintenanceExpensesTotal,
        totalDrivers: drivers.length,
        totalSystemDebt: totalSystemDebt,
      });
      setBuses(busesData);
      setDriversList(processedDrivers);
      setOilChanges(oilData);
      setRepairs(repairsData);
      setLoading(false);
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setLoading(false);
    }
  };

  // تحميل البيانات عند تغيير السنة أو الشهر
  useEffect(() => {
    loadAllData();
  }, [filterYear, filterMonth]);

  // تعبئة بيانات السائق تلقائياً عند اختياره
  useEffect(() => {
    if (quickFormData.driverId) {
      const selectedDriver = driversList.find((d) => String(d.id) === String(quickFormData.driverId));
      if (selectedDriver) {
        const selectedBus = buses.find((b) => String(b.busNumber) === String(selectedDriver.busNumber));
        setQuickFormData((prev) => ({
          ...prev,
          busNumber: selectedDriver.busNumber || '',
          busId: selectedBus?.id || '',
          currentMeter: selectedDriver.lastmeter || selectedDriver.initialMeter || '',
          paidAmount: selectedDriver.dailyRent || '',
          driverName: selectedDriver.name || '',
          dailyRent: selectedDriver.dailyRent || '',
        }));
      }
    }
  }, [quickFormData.driverId, driversList, buses]);

  const closeQuickModal = () => {
    setShowModal(false);
    setQuickTask('quick_rent');
    setQuickFormData({
      date: getTodayDate(),
      driverId: '',
      driverName: '',
      busNumber: '',
      busId: '',
      currentMeter: '',
      paidAmount: '',
      cost: '',
      oilInterval: 2000,
      dailyRent: '',
      note: '',
      type: 'rent',
    });
  };

  const handleQuickActionSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const selectedDriver = driversList.find((d) => String(d.id) === String(quickFormData.driverId));
      const selectedBus = buses.find((b) => String(b.id) === String(quickFormData.busId));

      if (quickTask === 'quick_rent') {
        if (!selectedDriver) throw new Error('السائق غير موجود');
        const rentData = {
          driverId: quickFormData.driverId,
          busId: selectedBus?.id || null,
          date: quickFormData.date || new Date().toISOString(),
          currentMeter: safeNumber(quickFormData.currentMeter),
          paidAmount: safeNumber(quickFormData.paidAmount),
          type: 'rent',
          note: quickFormData.note || '',
        };
        await smartSave('ledger', rentData);
      } else if (quickTask === 'quick_oil') {
        if (!selectedBus) throw new Error('المركبة غير موجودة');
        const oilData = {
          busId: selectedBus.id,
          date: quickFormData.date || new Date().toISOString(),
          currentMeter: safeNumber(quickFormData.currentMeter),
          paidAmount: safeNumber(quickFormData.paidAmount),
          note: quickFormData.note || 'تغيير زيت دوري',
        };
        await smartSave('oil_changes', oilData);
      } else if (quickTask === 'quick_repair') {
        if (!selectedBus) throw new Error('المركبة غير موجودة');
        const repairData = {
          busId: selectedBus.id,
          date: quickFormData.date || new Date().toISOString(),
          currentMeter: safeNumber(quickFormData.currentMeter),
          cost: safeNumber(quickFormData.cost),
          note: quickFormData.note || '',
        };
        await smartSave('repairsData', repairData);
      }

      alert('تمت العملية بنجاح');
      await loadAllData();
      closeQuickModal();
    } catch (err) {
      console.error('خطأ في الحفظ:', err);
      alert('فشل في الحفظ، تأكد من البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const formatStatValue = (value) => {
    const num = safeNumber(value);
    return num.toLocaleString();
  };

  // دالة للحصول على عنوان دخل الفترة
  const getRevenueTitle = () => {
    if (filterMonth === 0) return `دخل سنة ${filterYear}`;
    const monthNames = ['', 'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `دخل ${monthNames[filterMonth]} ${filterYear}`;
  };

  if (loading)
    return (
      <div className={`loader-overlay ${loading ? 'active' : ''}`}>
        <CloudLoader />
      </div>
    );

  return (
    <div className="dashboard-wrapper" dir="rtl">
      <header className="horizon-header">
        <div className="header-titles">
          <h2 className="header-main-title">لوحة التحكم الرئيسية</h2>
        </div>
        <div className="horizon-tools-container">
          <div className="horizon-filter-pill">
            <div className="date-input-item">
              
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                style={{
                  background: '#1b254b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '8px 12px',
                  color: '#ffffff',
                }}
              >
                <option value={0}>السنة بأكملها</option>
                <option value={1}>يناير</option>
                <option value={2}>فبراير</option>
                <option value={3}>مارس</option>
                <option value={4}>إبريل</option>
                <option value={5}>مايو</option>
                <option value={6}>يونيو</option>
                <option value={7}>يوليو</option>
                <option value={8}>أغسطس</option>
                <option value={9}>سبتمبر</option>
                <option value={10}>أكتوبر</option>
                <option value={11}>نوفمبر</option>
                <option value={12}>ديسمبر</option>
              </select>
            </div>
            <div className="date-input-item">
              
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                style={{
                  background: '#1b254b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '8px 12px',
                  color: '#ffffff',
                }}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="horizon-circle-add" onClick={() => setShowModal(true)}>
            <Icon path={mdiPlus} size={1} />
          </button>
          <button onClick={() => loadAllData()} className="refresh-icon-btn">
            🔄
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard
          title={getRevenueTitle()}
          value={formatStatValue(stats.todayRevenue)}
          color="success"
          iconPath={mdiCash}
        />
        <StatCard
          title="خرج الزيت"
          value={formatStatValue(stats.oilExpenses)}
          color="info"
          iconPath={mdiOil}
        />
        <StatCard
          title="خرج الإصلاحات"
          value={formatStatValue(stats.maintenanceExpenses)}
          color="warning"
          iconPath={mdiWrench}
        />
        <StatCard
          title="إجمالي السائقين"
          value={formatStatValue(stats.totalDrivers)}
          color="primary"
          iconPath={mdiAccountGroup}
        />
      </div>

      <div className="overview-section">
        <div className="overview-card">
          <div className="overview-content">
            <h3>إجمالي مديونية النظام المستحقة</h3>
            <h1 className={stats.totalSystemDebt > 0 ? 'text-danger' : 'text-success'}>
              {formatStatValue(stats.totalSystemDebt)} <small>ريال</small>
            </h1>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>السائق</th>
              <th>الباص</th>
              <th>الرصيد</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {driversList.map((driver) => (
              <tr key={driver.id}>
                <td>
                  <strong>{driver.name}</strong>
                </td>
                <td>#{driver.busNumber}</td>
                <td>{formatStatValue(driver.balance)} ريال</td>
                <td>
                  <span className={`pill ${driver.balance <= 0 ? 'paid' : 'debt'}`}>
                    {driver.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* المودال الموحد */}
      {showModal && (
        <UniversalModal
          isOpen={showModal}
          onClose={closeQuickModal}
          schemaKey={quickTask}
          title="مركز العمليات السريعة"
          formData={quickFormData}
          setFormData={setQuickFormData}
          onSave={handleQuickActionSave}
          loading={isSaving}
          dynamicData={{
            driversData: driversList,
            busesData: buses,
          }}
        >
          <div
            className="form-group"
            style={{
              marginBottom: '20px',
              borderColor: '#7551ff',
              paddingBottom: '15px',
            }}
          >
            <label
              style={{
                color: '#a3adc2',
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
              }}
            >
              نوع العملية
            </label>
            <select
              value={quickTask}
              onChange={(e) => setQuickTask(e.target.value)}
              style={{
                width: '100%',
                background: '#1b254b',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '0.95rem',
                transition: 'all 0.3s',
                boxSizing: 'borderBox',
                borderColor: '#7551ff',
              }}
            >
              <option value="quick_rent">💰 قبض إيجار يومي</option>
              <option value="quick_oil">🛢️ تغيير زيت / ميتار</option>
              <option value="quick_repair">🛠️ تسجيل إصلاحات</option>
            </select>
          </div>
        </UniversalModal>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color, iconPath }) => (
  <div className={`card-stat border-${color}`}>
    <div className="card-info">
      <p className="card-label">{title}</p>
      <h2 className="card-value">{value}</h2>
    </div>
    <div className={`card-icon ${color}`}>
      <Icon path={iconPath} size={1.2} />
    </div>
  </div>
);

export default AccountantStats;