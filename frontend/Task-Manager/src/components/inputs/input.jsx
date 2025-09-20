import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const Input = ({value, onChange, label, placeholder, type}) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
    };

    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {label}
        </label>

        <div className="input-box">
        <input
          type={type === "password" ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          value={value}
          onChange={(e) => onChange(e)}
        />

        {type === "password" && (
          <button type="button" onClick={toggleShowPassword} className="text-blue-500 transition hover:text-blue-600">
            {showPassword ? (
              <FaRegEye size={20} />
            ) : (
              <FaRegEyeSlash size={20} className="text-slate-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );   
};

export default Input;
