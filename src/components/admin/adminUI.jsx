import { useState } from "react";
import {
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export const inputClass =
  "w-full bg-gray-50 rounded-lg px-3.5 py-2.5 text-sm outline-none border border-transparent focus:border-slate-300 focus:bg-white transition-colors";

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "Enter password",
  required = false,
  disabled = false,
  minLength,
  autoComplete = "new-password",
}) {
  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={
          showPassword
            ? "text"
            : "password"
        }
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        autoComplete={autoComplete}
        className={`${inputClass} pr-11`}
      />

      <button
        type="button"
        onClick={() =>
          setShowPassword(
            (current) => !current,
          )
        }
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={
          showPassword
            ? "Hide password"
            : "Show password"
        }
        title={
          showPassword
            ? "Hide password"
            : "Show password"
        }
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  size = "md",
}) {
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
    full: "max-w-[95vw]",
  };

  const modalWidth =
    sizeClasses[size] || sizeClasses.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`max-h-[90vh] w-full ${modalWidth} overflow-y-auto rounded-2xl bg-white shadow-xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="font-bold text-gray-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>

      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  const normalizedStatus = String(
    status || "inactive",
  ).toLowerCase();

  const isActive = normalizedStatus === "active";

  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full ${isActive
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-500"
        }`}
    >
      {normalizedStatus.charAt(0).toUpperCase() +
        normalizedStatus.slice(1)}
    </span>
  );
}

export function SectionHeader({
  title,
  count,
  onAdd,
  addLabel,
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          {title}
        </h2>

        <p className="text-sm text-gray-400">
          {count} total records
        </p>
      </div>

      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      )}
    </div>
  );
}

export function RowActions({
  onEdit,
  onDelete,
}) {
  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit record"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete record"
          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}