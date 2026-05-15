// src/utils/pdfGenerator.js

/**
 * دالة لطباعة أي عنصر HTML محدد
 * @param {string} elementId - id العنصر المراد طباعته
 * @param {string} title - عنوان التقرير (يظهر في رأس الطباعة)
 */
export const printElement = (elementId, title = 'تقرير') => {
  const originalTitle = document.title;
  document.title = title;

  const printContent = document.getElementById(elementId);
  if (!printContent) {
    console.error(`العنصر ذو id "${elementId}" غير موجود`);
    return;
  }

  const WinPrint = window.open('', '', 'width=900,height=650');
  WinPrint.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif;
          padding: 20px;
          background: white;
          color: black;
        }
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #4318ff;
          padding-bottom: 10px;
        }
        .print-header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .print-header p {
          color: #666;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .summary {
          margin-top: 20px;
          text-align: center;
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      ${printContent.outerHTML}
    </body>
    </html>
  `);
  WinPrint.document.close();
  WinPrint.focus();
  WinPrint.print();
  WinPrint.close();
  document.title = originalTitle;
};

/**
 * تقرير سجل السائق (DriverLedger)
 * يقوم بإنشاء HTML مؤقت للطباعة ثم طباعته
 */
// دالة مساعدة لتنسيق التاريخ مثل الصفحة الأصلية
const formatDateForPrint = (dateString) => {
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
  return `${days[dateObj.getDay()]}-${String(dateObj.getDate()).padStart(2, "0")}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
};

// دالة ترجمة نوع العملية إلى نص عربي
const getTransactionTypeLabel = (type) => {
  switch (type) {
    case 'rent': return ' إيجار يومي';
    case 'debt': return ' دين / سلفة';
    case 'payment': return ' سداد مديونية';
    default: return type || '---';
  }
};

export const printDriverLedgerPDF = (driver, ledger, totalRentPaid, totalDebt) => {
  // بناء جدول HTML من بيانات ledger
  let tableRows = '';
  ledger.forEach(entry => {
    tableRows += `
      <tr>
        <td>${formatDateForPrint(entry.date)}</td>
        <td>${getTransactionTypeLabel(entry.type)}</td>
        <td>${entry.note || '---'}</td>
        <td>${entry.currentMeter || 0}</td>
        <td>${entry.distance || 0}</td>
        <td>${Number(entry.dailyRent || 0).toLocaleString()}</td>
        <td>${Number(entry.paidAmount || 0).toLocaleString()}</td>
        <td>${((entry.dailyRent || 0) - (entry.paidAmount || 0)).toLocaleString()}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <div class="print-header">
      <h1>سجل الحساب اليومي للسائق: ${driver.name}</h1>
      <p>المركبة: ${driver.busNumber || 'غير مرتبط'} | تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
    </div>
    <table dir="rtl">
      <thead>
        <tr>
          <th>التاريخ</th>
          <th>نوع العملية</th>
          <th>البيان / الملاحظة</th>
          <th>الميتار (كم)</th>
          <th>المسافة (كم)</th>
          <th>الإيجار (ريال)</th>
          <th>المدفوع (ريال)</th>
          <th>صافي اليوم (ريال)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <div class="summary">
      <p>💰 إجمالي المدفوع للإيجار: ${totalRentPaid.toLocaleString()} ريال</p>
      <p>📊 إجمالي المديونية: ${totalDebt.toLocaleString()} ريال</p>
    </div>
    <div class="footer">
      تقرير تلقائي من نظام Orbit
    </div>
  `;

  // فتح نافذة طباعة
  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <title>تقرير السائق ${driver.name}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif; padding: 20px; }
        .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4318ff; padding-bottom: 10px; }
        .print-header h1 { font-size: 24px; margin-bottom: 5px; }
        .print-header p { color: #666; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        th { background-color: #f2f2f2; }
        .summary { margin-top: 20px; text-align: center; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>${htmlContent}</body>
    </html>
  `);
  win.document.close();
  win.print();
};
/**
 * تقرير سجل المركبة (BusLedger)
 */
export const printBusLedgerPDF = (bus, fullHistory, totalOil, totalRepair) => {
  let tableRows = '';
  fullHistory.forEach(item => {
    tableRows += `
      <tr>
        <td>${formatDateForPrint(item.date) || ''}</td>
        <td>${item.type === 'oil' ? '🛢️ تغيير زيت' : '🔧 إصلاح/صيانة'}</td>
        <td>${item.note || '---'}</td>
        <td>${Number(item.cost || 0).toLocaleString()}</td>
        <td>${item.meter || 0}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <div class="print-header">
      <h1>سجل صيانة المركبة #${bus.busNumber}</h1>
      <p>إجمالي المنصرفات: ${(totalOil + totalRepair).toLocaleString()} ريال | تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
    </div>
    <table>
      <thead>
        <tr><th>التاريخ</th><th>النوع</th><th>البيان</th><th>التكلفة (ريال)</th><th>العداد (كم)</th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <div class="summary">
      <p>🛢️ إجمالي الزيت: ${totalOil.toLocaleString()} ريال</p>
      <p>🔧 إجمالي الصيانة: ${totalRepair.toLocaleString()} ريال</p>
      <p>💰 إجمالي المنصرفات: ${(totalOil + totalRepair).toLocaleString()} ريال</p>
    </div>
    <div class="footer">تقرير تلقائي من نظام Orbit</div>
  `;

  const win = window.open('', '_blank');
  win.document.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head><title>تقرير المركبة ${bus.busNumber}</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif; padding: 20px; }
      .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4318ff; padding-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
      th { background-color: #f2f2f2; }
      .summary { margin-top: 20px; text-align: center; font-weight: bold; }
      .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
    </style>
    </head>
    <body>${htmlContent}</body>
    </html>
  `);
  win.document.close();
  win.print();
};

// تصدير الدوال
export default { printDriverLedgerPDF, printBusLedgerPDF };