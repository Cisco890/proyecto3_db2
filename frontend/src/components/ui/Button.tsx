import React from "react";

type Variant = "primary" | "secondary" | "danger";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

export function Button({
  children,
  variant = "primary",
  disabled,
  loading,
  type = "button",
  onClick,
  className = "",
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
