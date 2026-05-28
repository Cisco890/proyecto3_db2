import type { Puzzle } from "../../types/puzzle";
import { Badge } from "../ui/Badge";

type Props = { puzzle: Puzzle };

export function PuzzleSummary({ puzzle }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat label="Total de piezas" value={puzzle.total_piezas} />
      {puzzle.piezas_disponibles !== undefined && (
        <StatBadge
          label="Disponibles"
          value={puzzle.piezas_disponibles}
          badge="disponible"
        />
      )}
      {puzzle.piezas_faltantes !== undefined && (
        <StatBadge
          label="Faltantes"
          value={puzzle.piezas_faltantes}
          badge={puzzle.piezas_faltantes > 0 ? "faltante" : "disponible"}
        />
      )}
      {puzzle.total_conexiones !== undefined && (
        <Stat label="Conexiones" value={puzzle.total_conexiones} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatBadge({
  label,
  value,
  badge,
}: {
  label: string;
  value: number;
  badge: "disponible" | "faltante";
}) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <div className="flex justify-center mt-1">
        <Badge variant={badge}>{label}</Badge>
      </div>
    </div>
  );
}
