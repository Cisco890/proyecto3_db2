import { useNavigate } from "react-router-dom";
import type { Puzzle } from "../../types/puzzle";
import { imageUrl } from "../../api/client";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

type Props = { puzzle: Puzzle };

export function PuzzleCard({ puzzle }: Props) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="h-40 bg-slate-100 overflow-hidden">
        {puzzle.imagen_url ? (
          <img
            src={imageUrl(puzzle.imagen_url)}
            alt={puzzle.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-slate-300">
            🧩
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <h3 className="font-semibold text-slate-900 text-base leading-tight">
            {puzzle.nombre}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{puzzle.tematica}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <span className="font-medium">{puzzle.total_piezas}</span> piezas totales
          </span>
          {puzzle.piezas_disponibles !== undefined && (
            <Badge variant="disponible">{puzzle.piezas_disponibles} disponibles</Badge>
          )}
          {puzzle.piezas_faltantes !== undefined && puzzle.piezas_faltantes > 0 && (
            <Badge variant="faltante">{puzzle.piezas_faltantes} faltantes</Badge>
          )}
        </div>

        <div className="mt-auto pt-2">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate(`/puzzles/${puzzle.id}`)}
          >
            Ver detalle
          </Button>
        </div>
      </div>
    </Card>
  );
}
