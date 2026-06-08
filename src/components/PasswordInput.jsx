import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ value, onChange, placeholder = '••••••••', autoComplete = 'current-password' }) {
  const [show, setShow] = useState(false);

  return (
    <div className="auth-password-wrap">
      <input
        className="auth-input auth-input-password"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        autoComplete={autoComplete}
        dir="ltr"
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setShow(p => !p)}
        aria-label={show ? 'הסתר סיסמה' : 'הצג סיסמה'}
        tabIndex={-1}
      >
        {show ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}
