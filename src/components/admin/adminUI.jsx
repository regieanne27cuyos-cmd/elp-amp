import React from "react";
import {
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export const inputClass =
  "w-full bg-gray-50 rounded-lg px-3.5 py-2.5 text-sm outline-none border border-transparent focus:border-slate-300 focus:bg-white transition-colors";

export function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-md",
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-xl ${maxWidth}`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-bold text-gray-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">{children}</div>
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
  disabled = false,
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-slate-700 hover:bg-gray-50 rounded-lg disabled:opacity-50"
        aria-label="Edit"
      >
        <Pencil className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
        aria-label="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}