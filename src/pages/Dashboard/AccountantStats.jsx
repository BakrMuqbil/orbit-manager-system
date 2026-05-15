import React, { useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiCash, mdiOil, mdiWrench, mdiAccountGroup, mdiPlus } from '@mdi/js';
import { smartSave, smartGet } from '../../utils/apiService';
import { getSubscriptionStatus } from '../../library/items.jsx';
import './AccountantStats.css';
import UniversalModal from '../../components/UniversalModal';
import { CloudLoader } from '../../library/items.jsx';

const AccountantStats = () => {
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);
  const [filterMonth, setFilterMonth] = useState(0);
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

  // حالة التنبيه بالاشتراك
  const [subscriptionAlert, setSubscriptionAlert] = useState(null);

  const safeNumber = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  };

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

  const getDateRange = (year, month) => {
    let fromDate, toDate;
    if (month === 0) {
      fromDate = `${year}-01-01`;
      toDate = `${year}-12-31`;
    } else {
      const lastDay = new Date(year, month, 0).getDate();
      fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
      toDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    }
    return { fromDate, toDate };
  };

  // جلب بيانات الشركة للمحاسب الحالي لعرض التنبيه
  const fetchCompanySubscription = async () => {
    try {
      const companies = await smartGet('companies');
      // نحتاج إلى company_id الخاص بالمستخدم الحالي، لكنه غير متاح مباشرة هنا.
      // بدلاً من ذلك، يمكننا افتراض أن المحاسب لديه شركة واحدة فقط (الأولى في القائمة)
      // أو يمكننا تعديل الـ API لإرجاع company_id مع بيانات المستخدم.
      // سنتبع طريقة آمنة: جلب كل الشركات وعرض التنبيه إذا وجدت شركة واحدة فقط (حالة المحاسب العادي).
      if (companies && companies.length === 1) {
        const myCompany = companies[0];
        const status = getSubscriptionStatus(myCompany.subscription_expiry);
        if (status.text.includes('منتهي')) {
          setSubscriptionAlert({ type: 'error', message: '⚠️ انتهى اشتراك شركتك. يرجى التواصل مع المدير لتجديد الاشتراك.' });
        } else if (status.text.includes('ينتهي')) {
          setSubscriptionAlert({ type: 'warning', message: `⚠️ تنبيه: ${status.text} متبقي على انتهاء اشتراك شركتك. يرجى تجديده قريباً.` });
        } else {
          setSubscriptionAlert(null);
        }
      } else {
        // في حالة تعدد الشركات (نادر للمحاسب)، نبحث عن الشركة المرتبطة بالمستخدم
        // يمكن تحسينها لاحقاً بجلب user data
        setSubscriptionAlert(null);
      }
    } catch (err) {
      console.error('خطأ في جلب حالة الاشتراك:', err);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [drivers, ledgerData, busesData, oilData, repairsData] = await Promise.all([
        smartGet('driversData'),
        smartGet('ledger'),
        smartGet('buses'),
        smartGet('oil_changes'),
        smartGet('repairsData'),
      ]);

      const years = extractYearsFromData(ledgerData, oilData, repairsData);
      setAvailableYears(years);
      if (!years.includes(filterYear)) {
        setFilterYear(years[0]);
      }

      const { fromDate, toDate } = getDateRange(filterYear, filterMonth);

      const filteredLedger = ledgerData.filter(entry => entry.date >= fromDate && entry.date <= toDate);
      const periodRevenue = filteredLedger.reduce((acc, curr) => acc + safeNumber(curr.paidAmount), 0);

      const filteredOil = oilData.filter(oil => oil.changedate >= fromDate && oil.changedate <= toDate);
      const oilExpensesTotal = filteredOil.reduce((acc, curr) => acc + safeNumber(curr.amount), 0);

      const filteredRepairs = repairsData.filter(rep => rep.date >= fromDate && rep.date <= toDate);
      const maintenanceExpensesTotal = filteredRepairs.reduce((acc, curr) => acc + safeNumber(curr.cost), 0);

      const totalSystemDebt = drivers.reduce((acc, driver) => {
        const driverEntries = ledgerData.filter(l => String(l.driverId) === String(driver.id));
        const bus = busesData.find(b => b.id === driver.busId);
        const dailyRent = bus ? safeNumber(bus.dailyRent) : 0;
        let driverDebt = 0;
        driverEntries.forEach(entry => {
          if (entry.type === 'rent') driverDebt += dailyRent - safeNumber(entry.paidAmount);
          else if (entry.type === 'debt') driverDebt += safeNumber(entry.paidAmount);
          else if (entry.type === 'payment') driverDebt -= safeNumber(entry.paidAmount);
        });
        return acc + driverDebt;
      }, 0);

      const processedDrivers = drivers.map(driver => {
        const driverEntries = ledgerData.filter(l => String(l.driverId) === String(driver.id));
        const bus = busesData.find(b => b.id === driver.busId);
        const dailyRent = bus ? safeNumber(bus.dailyRent) : 0;
        let currentBalance = 0;
        driverEntries.forEach(entry => {
          if (entry.type === 'rent') currentBalance += dailyRent - safeNumber(entry.paidAmount);
          else if (entry.type === 'debt') currentBalance += safeNumber(entry.paidAmount);
          else if (entry.type === 'payment') currentBalance -= safeNumber(entry.paidAmount);
        });
        return { ...driver, balance: currentBalance, status: currentBalance <= 0 ? 'محاسب' : 'مديون' };
      });

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

      // بعد جلب البيانات، نتحقق من حالة الاشتراك
      await fetchCompanySubscription();
    } catch (err) {
      console.error('خطأ في جلب البيانات:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [filterYear, filterMonth]);

  useEffect(() => {
    if (quickFormData.driverId) {
      const selectedDriver = driversList.find(d => String(d.id) === String(quickFormData.driverId));
      if (selectedDriver) {
        const selectedBus = buses.find(b => String(b.busNumber) === String(selectedDriver.busNumber));
        setQuickFormData(prev => ({
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
      const selectedDriver = driversList.find(d => String(d.id) === String(quickFormData.driverId));
      const selectedBus = buses.find(b => String(b.id) === String(quickFormData.busId));

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

  const formatStatValue = (value) => safeNumber(value).toLocaleString();

  const getRevenueTitle = () => {
    if (filterMonth === 0) return `دخل سنة ${filterYear}`;
    const monthNames = ['', 'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `دخل ${monthNames[filterMonth]} ${filterYear}`;
  };

  if (loading) return <div className="loader-overlay active"><CloudLoader /></div>;

  return (
    <div className="dashboard-wrapper" dir="rtl">
      {/* شريط تحذير الاشتراك */}
      {subscriptionAlert && (
        <div style={{
          backgroundColor: subscriptionAlert.type === 'error' ? '#ff4d4d' : '#ffab00',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold',
          direction: 'rtl'
        }}>
          {subscriptionAlert.message}
        </div>
      )}

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
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][m - 1]}</option>
                ))}
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
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
          <button className="horizon-circle-add" onClick={() => setShowModal(true)}>
            <Icon path={mdiPlus} size={1} />
          </button>
          <button onClick={() => loadAllData()} className="refresh-icon-btn">🔄</button>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard title={getRevenueTitle()} value={formatStatValue(stats.todayRevenue)} color="success" iconPath={mdiCash} />
        <StatCard title="خرج الزيت" value={formatStatValue(stats.oilExpenses)} color="info" iconPath={mdiOil} />
        <StatCard title="خرج الإصلاحات" value={formatStatValue(stats.maintenanceExpenses)} color="warning" iconPath={mdiWrench} />
        <StatCard title="إجمالي السائقين" value={formatStatValue(stats.totalDrivers)} color="primary" iconPath={mdiAccountGroup} />
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
            <tr><th>السائق</th><th>الباص</th><th>الرصيد</th><th>الحالة</th></tr>
          </thead>
          <tbody>
            {driversList.map(driver => (
              <tr key={driver.id}>
                <td><strong>{driver.name}</strong></td>
                <td>#{driver.busNumber}</td>
                <td>{formatStatValue(driver.balance)} ريال</td>
                <td><span className={`pill ${driver.balance <= 0 ? 'paid' : 'debt'}`}>{driver.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
          dynamicData={{ driversData: driversList, busesData: buses }}
        >
          <div className="form-group" style={{ marginBottom: '20px', borderColor: '#7551ff', paddingBottom: '15px' }}>
            <label style={{ color: '#a3adc2', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>نوع العملية</label>
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