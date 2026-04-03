import React, { useState } from 'react';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { globalFormSchema } from '../constants/formSchemas';

import { CloudLoader } from '../library/items.jsx';
import './UniversalModal.css';

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
}) => {
  if (!isOpen) return null;

  const fields = globalFormSchema[schemaKey] || [];

  const handleChange = (name, value) => {
    console.log("🔍 فحص المودال - الحقل:", name, "القيمة:", value, "المصادر المتوفرة:", Object.keys(dynamicData));
    console.log(`تغيير في الحقل: ${name} ، القيمة الجديدة: ${value}`);
    let updatedData = { ...formData, [name]: value };
    
    if (name === 'role') {
        if (value === 'super_admin') {
            // تصفير الشركة تماماً عند اختيار سوبر أدمن
            updatedData = {
                ...updatedData,
                role: value,
                company_id: null 
            };
        }
    }
    
    if (name === 'company_id') {
        updatedData = {
            ...updatedData,
            company_id: value 
        };
    }
    
    // --- 🟢 المنطق الخاص بالشركات والباقات (New) ---
    if (name === 'package_type') {
        console.log("📦 تم اختيار باقة:", value);
        
        let months = 0;
        let amount = 0;

        // تحديد القيم بناءً على نوع الباقة المختارة
        switch (value) {
            case 'تجريبية': months = 1; amount = 0; break;
            case '3 أشهر': months = 3; amount = 30000; break;
            case '6 أشهر': months = 6; amount = 60000; break;
            case 'سنة': months = 12; amount = 100000; break;
            default: months = 0; amount = 0;
        }

        // حساب تاريخ الانتهاء تلقائياً في الواجهة (للعرض فقط قبل الحفظ)
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + months);
        
        // تحديث البيانات في المودال فوراً
        updatedData = {
            ...updatedData,
            subscription_amount: amount,
            subscription_expiry: expiryDate.toISOString().split('T')[0], // تنسيق YYYY-MM-DD
            status: 'نشط'
        };
    }

    // المنطق الخاص بالربط التلقائي عند اختيار السائق (driverId)
    // نستخدم driversData كمصدر للبيانات في الداشبورد
    if (name === 'driverId' && dynamicData.driversData) {
      const selectedDriver = dynamicData.driversData.find(
        (d) => String(d.id) === String(value)
      );

      if (selectedDriver) {
        console.log("🟢 تم العثور على السائق بنجاح:", selectedDriver);
        updatedData = {
          ...updatedData,
          busId: selectedDriver.busId || selectedDriver.bus_id,
          busNumber: selectedDriver.busNumber || '',
          currentMeter: selectedDriver.lastMeter || selectedDriver.startMeter || '',
          driverName: selectedDriver?.name ||'',
        };
      }
    }

        // 2. المنطق الخاص بالمركبة (تغيير زيت / إصلاحات)
    if (name === 'busId' && dynamicData.busesData) {
      // فحص دقيق: تحويل القيمة القادمة (001) إلى رقم (1) ليتطابق مع ID قاعدة البيانات
      const busSearchId = Number(value); 

      const selectedBus = dynamicData.busesData.find(
        (b) => Number(b.id) === busSearchId
      );

      if (selectedBus) {
        console.log("🚌 نجح الـ Auto-fill للمركبة:", selectedBus);
        updatedData = {
          ...updatedData,
          // تأكد من مسمى العداد في جدولك (initialMeter)
          currentMeter: selectedBus.initialMeter || selectedBus.initialMeter || '',
          busNumber: selectedBus.busNumber || ''
        };
      } else {
        console.log("❌ لم يتم العثور على باص برقم ID:", busSearchId);
      }
    }

    setFormData(updatedData);
  };

  return (
  <div className='universal-modal-overlay' onClick={onClose}>
    <div
      className='universal-modal-content'
      onClick={(e) => e.stopPropagation()}
      dir='rtl'
      style={{ position: 'relative' }} 
    >
      
      {/* مؤشر التحميل (Loader) */}
      {loading && (
        <div className="floatingLoaderOverlay">
          <CloudLoader message="جاري حفظ التغييرات" />
        </div>
      )}

      {/* رأس المودال */}
      <div className='modal-header'>
        <h3>{title}</h3>
        <button className='close-x-btn' onClick={onClose}>
          <Icon path={mdiClose} size={0.8} />
        </button>
      </div>

      <div className='modal-body'>
        {/* إظهار أي عناصر إضافية ممررة كـ children */}
        {children}

        {/* رسم الحقول ديناميكياً من السكيما */}
        {fields.map((field) => {
          
          // --- خاصية الإخفاء البصري ---
          // إذا كان الحقل هو 'company_id' وكان المستخدم 'super_admin'، يتم تخطي رسم الحقل
          if (field.name === 'company_id' && formData.role === 'super_admin') {
            return null;
          }

          return (
            <div key={field.name} className='smart-input-group'>
              <label>{field.label}</label>

              {field.type === 'select' ? (
                <select
    value={formData[field.name] || ''}
    onChange={(e) => handleChange(field.name, e.target.value)}
    required={field.required}
  >
    <option value=''>-- اختر {field.label} --</option>
    
    {/* 1. التحقق من وجود خيارات ثابتة (Static Options) */}
    {field.options ? (
      field.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))
    ) : (
      /* 2. التحقق من وجود خيارات ديناميكية (Dynamic Options) */
      /* قمنا بإضافة فحص لـ field.dynamicOptions ليتوافق مع السكيما الخاصة بك */
      (dynamicData[field.dynamicOptions] || dynamicData[field.source])?.map((item) => {
        let label = item.name || item.username || item.label;
        
        if (field.dynamicOptions === 'busesData' || field.name === 'busNumber') {
          label = `باص رقم ${item.busNumber || item.id}`;
        }
        
        return (
          <option key={item.id || item.value} value={item.id || item.value}>
            {label}
          </option>
        );
      })
    )}
  </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={field.label}
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
      <div className='modal-footer'>
        <button 
          className='confirm-btn' 
          onClick={(e) => onSave(e)}
          disabled={loading}
        >
          {loading ? "انتظر..." : "حفظ التغيرات"}
        </button>
        
        <button className='cancel-btn' onClick={onClose} disabled={loading}>
          إلغاء
        </button>
      </div>
    </div>
  </div>
);


};

export default UniversalModal;
