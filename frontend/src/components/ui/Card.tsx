import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function Card({ children, className = "", onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
