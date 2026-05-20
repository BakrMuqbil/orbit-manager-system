import React, { useCallback } from 'react';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { globalFormSchema } from '../constants/formSchemas';
import { CloudLoader } from '../library/items.jsx';
import './UniversalModal.css';

/* 
 * UniversalModal - مكون عام لإنشاء نماذج ديناميكية بناءً على مخطط (schema)
 * @param {boolean} loading - حالة التحميل أثناء الحفظ
 * @param {boolean} isOpen - فتح/إغلاق المودال
 * @param {function} onClose - دالة الإغلاق
 * @param {string} schemaKey - مفتاح المخطط المستخدم من globalFormSchema
 * @param {object} formData - بيانات النموذج الحالية
 * @param {function} setFormData - دالة تحديث بيانات النموذج
 * @param {function} onSave - دالة الحفظ
 * @param {ReactNode} children - محتوى إضافي (عادةً عناصر مخصصة أعلى النموذج)
 * @param {string} title - عنوان المودال
 * @param {object} dynamicData - بيانات ديناميكية للقوائم المنسدلة (مثل السائقين، الباصات، الشركات)
  */
const UniversalModal = ({
  loading,
  isOpen,
  onClose,
  schemaKey,
  formData,
  setFormData,
  onSave,
  children,
  title,
  dynamicData = {},
  modalClassName = '',
}) => {
  // إذا كان المودال مغلقاً، لا نعرض أي شيء
  if (!isOpen) return null;

  // الحقول المستخدمة في هذا المودال بناءً على المخطط (schema)
  const fields = globalFormSchema[schemaKey] || [];

  // ----- دوال مساعدة لتحديث البيانات حسب المنطق الخاص -----

  /**
   * تحديث بيانات الباقة (package_type) وحساب المبلغ وتاريخ الانتهاء تلقائياً
   */
  const handlePackageTypeChange = (value, currentData) => {
    console.log("📦 تم اختيار باقة:", value);

    let months = 0;
    let amount = 0;

    switch (value) {
      case 'تجريبية':
        months = 1;
        amount = 0;
        break;
      case '3 أشهر':
        months = 3;
        amount = 30000;
        break;
      case '6 أشهر':
        months = 6;
        amount = 60000;
        break;
      case 'سنة':
        months = 12;
        amount = 100000;
        break;
      default:
        months = 0;
        amount = 0;
    }

    // حساب تاريخ الانتهاء (اليوم + عدد الأشهر)
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    return {
      ...currentData,
      subscription_amount: amount,
      subscription_expiry: expiryDate.toISOString().split('T')[0], // YYYY-MM-DD
      status: 'نشط',
    };
  };

  /**
   * عند اختيار دور (role) المستخدم: إذا كان super_admin، نمسح company_id
   */
  const handleRoleChange = (value, currentData) => {
    if (value === 'super_admin') {
      return { ...currentData, role: value, company_id: null };
    }
    return { ...currentData, role: value };
  };

  /**
   * عند اختيار سائق (driverId) في المودال الخاص بالإيجار السريع،
   * نقوم بملء الحقول المرتبطة به تلقائياً (busId, busNumber, currentMeter, driverName)
   */
  const handleDriverChange = (value, currentData) => {
    const drivers = dynamicData.driversData;
    if (!drivers) return currentData;

    const selectedDriver = drivers.find((d) => String(d.id) === String(value));
    if (selectedDriver) {
      console.log("🟢 تم العثور على السائق:", selectedDriver);
      return {
        ...currentData,
        busId: selectedDriver.busId || selectedDriver.bus_id,
        busNumber: selectedDriver.busNumber || '',
        currentMeter: selectedDriver.lastMeter || selectedDriver.startMeter || '',
        driverName: selectedDriver.name || '',
      };
    }
    return currentData;
  };

  /**
   * عند اختيار مركبة (busId) في المودال الخاص بالزيت أو الإصلاحات،
   * نقوم بملء الحقول المرتبطة بها (currentMeter, busNumber)
   */
  const handleBusChange = (value, currentData) => {
    const buses = dynamicData.busesData;
    if (!buses) return currentData;

    // تحويل القيمة إلى رقم (لأن ID المركبة يكون رقماً)
    const busSearchId = Number(value);
    const selectedBus = buses.find((b) => Number(b.id) === busSearchId);

    if (selectedBus) {
      console.log("🚌 نجح الملء التلقائي للمركبة:", selectedBus);
      return {
        ...currentData,
        currentMeter: selectedBus.initialMeter || '',
        busNumber: selectedBus.busNumber || '',
      };
    }
    console.log("❌ لم يتم العثور على مركبة برقم ID:", busSearchId);
    return currentData;
  };

  /**
   * معالج التغيير العام لأي حقل في النموذج
   * يطبق المنطق الخاص بناءً على اسم الحقل
   */
  const handleChange = (name, value) => {
    console.log(`🔍 تغيير في الحقل: ${name} = ${value}`);

    let updatedData = { ...formData, [name]: value };

    // تطبيق المنطق الخاص حسب نوع الحقل
    if (name === 'package_type') {
      updatedData = handlePackageTypeChange(value, updatedData);
    } else if (name === 'role') {
      updatedData = handleRoleChange(value, updatedData);
    } else if (name === 'driverId') {
      updatedData = handleDriverChange(value, updatedData);
    } else if (name === 'busId') {
      updatedData = handleBusChange(value, updatedData);
    }

    setFormData(updatedData);
  };

  /**
   * تحديد مصدر البيانات للقائمة المنسدلة (سواء كان ثابت options أو ديناميكي source/dynamicOptions)
   */
  const getSelectOptions = (field) => {
    // 1. خيارات ثابتة (مثل قائمة الباقات)
    if (field.options) {
      return field.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ));
    }

    // 2. خيارات ديناميكية من dynamicData (مثل قائمة السائقين أو الباصات)
    const dataSource =
      dynamicData[field.dynamicOptions] || dynamicData[field.source] || [];

    return dataSource.map((item) => {
      let label = item.name || item.username || item.label;

      // تخصيص عرض الباصات: "باص رقم X"
      if (field.dynamicOptions === 'busesData' || field.name === 'busNumber') {
        label = `باص رقم ${item.busNumber || item.id}`;
      }

      return (
        <option key={item.id || item.value} value={item.id || item.value}>
          {label}
        </option>
      );
    });
  };

  // ----- عرض المودال -----
  return (
    <div className="universal-modal-overlay" onClick={onClose}>
      <div className={`universal-modal-content ${modalClassName}`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{ position: 'relative' }}
      >
        {/* مؤشر التحميل أثناء الحفظ */}
        {loading && (
          <div className="floatingLoaderOverlay">
            <CloudLoader message="جاري حفظ التغييرات" />
          </div>
        )}

        {/* رأس المودال */}
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-x-btn" onClick={onClose}>
            <Icon path={mdiClose} size={0.8} />
          </button>
        </div>

        {/* جسم المودال: يحتوي على عناصر إضافية (children) ثم الحقول الديناميكية */}
        <div className="modal-body">
          {children}

          {fields.map((field) => {
            // إخفاء حقل company_id إذا كان المستخدم سوبر أدمن (لا يحتاج لاختيار شركة)
            if (field.name === 'company_id' && formData.role === 'super_admin') {
              return null;
            }

            return (
              <div key={field.name} className="smart-input-group">
                <label>{field.label}</label>

                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">-- اختر {field.label} --</option>
                    {getSelectOptions(field)}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.label}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    disabled={field.disabled}
                    placeholder={field.label}
                    required={field.required}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* أزرار التحكم في أسفل المودال */}
        <div className="modal-footer">
          <button
            className="confirm-btn"
            onClick={(e) => onSave(e)}
            disabled={loading}
          >
            {loading ? 'انتظر...' : 'حفظ التغيرات'}
          </button>

          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversalModal;