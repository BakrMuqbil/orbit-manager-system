export const globalFormSchema = {
    // 1. مخطط الباصات (مطابق لـ BusManager.jsx)
    bus: [
        { name: 'busNumber', label: 'رقم الباص', type: 'text', required: true },
        { name: 'initialMeter', label: 'عداد الميتار الحالي', type: 'number', required: true },
        { name: 'dailyRent', label: 'قيمة الإيجار اليومي', type: 'number', required: true }
    ],

    // 2. مخطط السائقين (مطابق لـ CardSlider.jsx)
    driver: [
        { name: 'name', label: 'اسم السائق', type: 'text', required: true },
        { name: 'phone', label: 'رقم الجوال', type: 'text', required: true },
        { name: 'guarantor', label: 'اسم الضمين', type: 'text', required: true },
        { name: 'receiveDate', label: 'تاريخ الاستلام', type: 'date', required: true },
        { name: 'busNumber', label: 'اختر المركبة', type: 'select', source: 'buses' },
        { name: 'currentMeter', label: 'رقم الميتار', type: 'number', required: true }
    ],

    // 3. مخطط سجل الحساب (مطابق لـ DriverLedger.jsx)
    ledger_entry: [
        { name: 'date', label: 'التاريخ', type: 'date', required: true },
        { name: 'currentMeter', label: 'رقم الميتار', type: 'number', required: true },
        { name: 'paidAmount', label: 'المبلغ المدفوع', type: 'number', required: true },
        { name: 'note', label: 'ملاحظات', type: 'text' }
    ],

    // 4. مخطط العمليات السريعة (الزر الجديد في الداشبورد)
    // ملف formSchemas.js

    quick_rent: [
        { name: 'driverId', label: 'اسم السائق', type: 'select', source: 'driversData' },
        // التعديل: التأكد من أن name هو busNumber ليتطابق مع دالة التعبئة التلقائية
        { name: 'busNumber', label: 'رقم المركبة', type: 'text', disabled: true }, 
        { name: 'currentMeter', label: 'آخر قراءة للعداد', type: 'number' },
        { name: 'paidAmount', label: 'المبلغ المدفوع', type: 'number', required: true }
    ],

    quick_oil: [
    { 
        name: 'busId', 
        label: 'اختر المركبة (الباص)', 
        type: 'select', 
        source: 'busesData' // تأكد أن المودال لديه وصول لبيانات الباصات
    },
    { name: 'currentMeter', label: 'القراءة الحالية للعداد', type: 'number', required: true },
    { name: 'paidAmount', label: 'تكلفة تغيير الزيت', type: 'number', required: true },
    { name: 'date', label: 'تاريخ التغيير', type: 'date' },
    { name: 'note', label: 'ملاحظات الصيانة', type: 'textarea' }
],

    // في ملف formSchemas.js
quick_repair: [
    { 
        name: 'busId', 
        label: 'اختر المركبة (الباص)', 
        type: 'select', 
        source: 'busesData' 
    },
    { name: 'date', label: 'تاريخ الإصلاح', type: 'date' },
    { name: 'cost', label: 'تكلفة الإصلاح', type: 'number', required: true },
    { name: 'note', label: 'تفاصيل العطل والإصلاح', type: 'textarea', required: true }
],

company: [
  { name: 'name', label: 'اسم الشركة', type: 'text' },
  { name: 'owner_name', label: 'اسم المالك', type: 'text' },
  { 
    name: 'package_type', 
    label: 'نوع الباقة', 
    type: 'select',
    // يجب أن يكون النوع select
    options: [
      { value: 'تجريبية', label: 'شهر تجريبي (مجاني)' },
      { value: '3 أشهر', label: '3 أشهر (30,000)' },
      { value: '6 أشهر', label: '6 أشهر (60,000)' },
      { value: 'سنة', label: 'سنة كاملة (100,000)' }
    ] 
  },
  { name: 'phone', label: 'رقم الجوال', type: 'text' },
  { name: 'address', label: 'العنوان', type: 'text' },
  { name: 'code', label: 'كود الشركة', type: 'text' },
],

users: [
  { 
    name: 'username', 
    label: 'اسم المستخدم', 
    type: 'text', 
    required: true 
  },
  { 
    name: 'password', 
    label: 'كلمة المرور', 
    type: 'text', // نص صريح كما طلبت
    required: true 
  },
  { 
    name: 'role', 
    label: 'رتبة المستخدم', 
    type: 'select', 
    required: true,
    options: [
      { value: 'super_admin', label: 'مدير نظام (Super Admin)' },
      { value: 'company_accountant', label: 'محاسب شركة (Accountant)' }
    ]
  },
  { 
    name: 'company_id', 
    label: 'الشركة المرتبطة', 
    type: 'select', 
    source: 'companiesData', // هذا المصدر سيتم جلب بياناته من API الشركات
    required: false, // اختياري لأنه سيكون NULL للسوبر أدمن
    // ملاحظة: سيظهر هذا الحقل في المودال فقط إذا كان الـ role هو محاسب
    // يمكنك التحكم في ظهوره من خلال الواجهة الأمامية لاحقاً
  }
],
send_announcement: [
    { 
      name: 'recipientId', 
      label: 'المستلم', 
      type: 'select', 
      dynamicOptions: 'companiesData', // التأكد من هذا المسمى
      required: true 
    },
    { name: 'message', label: 'نص التنبيه', type: 'textarea', required: true }
  ],




freeze_company: [
    { name: 'companyId', label: 'اختر الشركة', type: 'select', dynamicOptions: 'companiesData', required: true },
    { name: 'reason', label: 'سبب التجميد', type: 'textarea', required: true },
    { name: 'untilDate', label: 'تجميد حتى تاريخ', type: 'date' },
  ],

  // 3. مفتاح إدارة الصلاحيات (يجب إضافته)
  manage_permissions: [
    { 
      name: 'userId', 
      label: 'اختر المستخدم', 
      type: 'select', 
      dynamicOptions: 'usersData', // التأكد من هذا المسمى
      required: true 
    },
    { 
      name: 'role', 
      label: 'الصلاحية', 
      type: 'select', 
      options: [
        { value: 'admin', label: 'مدير فرع' },
        { value: 'accountant', label: 'محاسب' }
      ] 
    }
  ],


};
