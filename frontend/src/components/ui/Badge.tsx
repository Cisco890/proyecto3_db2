type Variant =
  | "disponible"
  | "faltante"
  | "completo"
  | "parcial"
  | "bloqueado"
  | "default";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

const variants: Record<Variant, string> = {
  disponible: "bg-emerald-100 text-emerald-700",
  faltante: "bg-red-100 text-red-700",
  completo: "bg-emerald-100 text-emerald-700",
  parcial: "bg-amber-100 text-amber-700",
  bloqueado: "bg-red-100 text-red-700",
  default: "bg-slate-100 text-slate-600",
};

export function Badge({ children, variant = "default" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
