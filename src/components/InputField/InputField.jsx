import React, { useState } from 'react';

const InputField = ({ type, placeholder, icon, onChange, options = [], value = '' }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false);

  // إذا كان type هو 'select'، نعرض قائمة منسدلة
  if (type === 'select') {
    return (
      <div className="input-wrapper">
        <select
          className="input-field"
          onChange={onChange}
          value={value}
          required={false}
        >
          <option value="" disabled>اختر المنطقة</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.name}>
              {opt.name} ({opt.region})
            </option>
          ))}
        </select>
        <i className="material-symbols-rounded">{icon}</i>
      </div>
    );
  }

  // النوع العادي (text, email, password, tel, etc.)
  return (
    <div className="input-wrapper">
      <input
        type={isPasswordShown ? 'text' : type}
        placeholder={placeholder}
        className="input-field"
        onChange={onChange}
        value={value}
        required={false}
      />
      <i className="material-symbols-rounded">{icon}</i>
      {type === 'password' && (
        <i onClick={() => setIsPasswordShown(prevState => !prevState)} className="material-symbols-rounded eye-icon">
          {isPasswordShown ? 'visibility' : 'visibility_off'}
        </i>
      )}
    </div>
  );
};

export default InputField;