import React from 'react';

export default function FormField({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  readOnly = false,
  required = false,
  error = null,
  placeholder = '',
  fullWidth = false,
}) {
  const isPopulated = value !== null && value !== undefined && value !== '';

  const commonProps = {
    value: value ?? '',
    onChange: readOnly ? undefined : (e) => onChange?.(e.target.value),
    readOnly,
    required,
    disabled: readOnly,
    placeholder: placeholder || `Enter ${label.toLowerCase()}`,
  };

  return (
    <div className={`field-group${fullWidth ? ' full-col' : ''}`}>
      <label className="field-label">
        {label}
        {required && <span className="required">*</span>}
      </label>

      {type === 'select' ? (
        <select
          className={`field-select${isPopulated ? ' populated' : ''}${error ? ' error' : ''}`}
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={readOnly}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
      ) : type === 'radio' ? (
        <div className="radio-group">
          {options.map((opt) => (
            <div className="radio-option" key={opt.value}>
              <input
                type="radio"
                id={`${label}-${opt.value}`}
                name={label}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange?.(opt.value)}
                disabled={readOnly}
              />
              <label htmlFor={`${label}-${opt.value}`}>
                {opt.icon && <span>{opt.icon}</span>}
                {opt.label}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <input
          type={type}
          className={`field-input${isPopulated && !readOnly ? ' populated' : ''}${error ? ' error' : ''}`}
          {...commonProps}
          style={readOnly ? { background: 'var(--gray-50)', color: 'var(--gray-600)' } : {}}
        />
      )}

      {error && (
        <span className="field-error">
          ⚠ {error}
        </span>
      )}
    </div>
  );
}
