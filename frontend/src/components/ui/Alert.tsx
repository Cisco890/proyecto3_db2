import React from "react";

type Variant = "error" | "warning" | "info" | "success";

type Props = {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const styles: Record<Variant, { container: string; icon: string }> = {
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "text-red-500",
  },
  warning: {
    container: "bg-amber-50 border-amber-200 text-amber-800",
    icon: "text-amber-500",
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "text-blue-500",
  },
  success: {
    container: "bg-emerald-50 border-emerald-200 text-emerald-800",
    icon: "text-emerald-500",
  },
};

const icons: Record<Variant, string> = {
  error: "✕",
  warning: "⚠",
  info: "ℹ",
  success: "✓",
};

export function Alert({ variant = "info", title, children, className = "" }: Props) {
  const s = styles[variant];
  return (
    <div className={`flex gap-3 rounded-lg border p-4 ${s.container} ${className}`}>
      <span className={`mt-0.5 text-base font-bold ${s.icon}`}>
        {icons[variant]}
      </span>
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
