import { useId } from 'react';

function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  id: idProp,
  ...props
}) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {label}
          {required && (
            <span className="ml-1 text-rose-500" aria-hidden="true">*</span>
          )}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={[
          'w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all duration-150',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          // Light mode
          'border border-slate-300 bg-white text-slate-900',
          // Dark mode
          'dark:border-white/10 dark:bg-slate-950/40 dark:text-white',
          // Focus states (keyboard-only ring)
          'focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30',
          'dark:focus-visible:border-emerald-400/60 dark:focus-visible:ring-2 dark:focus-visible:ring-emerald-400/20',
          // Error state
          error ? 'border-rose-500 dark:border-rose-400' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default FormInput;
