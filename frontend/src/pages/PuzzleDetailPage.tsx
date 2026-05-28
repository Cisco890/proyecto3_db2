import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getPuzzleById, getPiecesByPuzzle, getConnectionsByPuzzle } from "../api/puzzleApi";
import { imageUrl } from "../api/client";
import type { Puzzle, Piece, Connection } from "../types/puzzle";
import { PageHeader } from "../components/layout/PageHeader";
import { PuzzleSummary } from "../components/puzzle/PuzzleSummary";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { LoadingState } from "../components/ui/LoadingState";

export function PuzzleDetailPage() {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const navigate = useNavigate();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puzzleId) return;
    Promise.all([
      getPuzzleById(puzzleId),
      getPiecesByPuzzle(puzzleId),
      getConnectionsByPuzzle(puzzleId),
    ])
      .then(([p, pcs, conns]) => {
        setPuzzle(p);
        setPieces(pcs);
        setConnections(conns);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [puzzleId]);

  if (loading) return <LoadingState message="Cargando rompecabezas..." />;
  if (error) return <Alert variant="error" title="Error">{error}</Alert>;
  if (!puzzle) return null;

  const available = pieces.filter((p) => p.disponible);
  const missing = pieces.filter((p) => !p.disponible);

  const enriched: Puzzle = {
    ...puzzle,
    piezas_disponibles: available.length,
    piezas_faltantes: missing.length,
    total_conexiones: connections.length,
  };

  return (
    <div>
      <PageHeader
        title={puzzle.nombre}
        subtitle={puzzle.tematica}
        actions={
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="secondary">← Volver</Button>
            </Link>
            <Button onClick={() => navigate(`/puzzles/${puzzleId}/armado`)}>
              Armar rompecabezas
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <Card className="overflow-hidden">
            {puzzle.imagen_url ? (
              <img
                src={imageUrl(puzzle.imagen_url)}
                alt={puzzle.nombre}
                className="w-full object-cover max-h-64"
              />
            ) : (
              <div className="flex items-center justify-center h-48 bg-slate-100 text-5xl text-slate-300">
                🧩
              </div>
            )}
          </Card>
          <PuzzleSummary puzzle={enriched} />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Piezas</h2>
            {pieces.length === 0 ? (
              <p className="text-sm text-slate-400">Sin piezas registradas.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pieces
                  .slice()
                  .sort((a, b) => a.numero - b.numero)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium text-slate-800">
                        Pieza {p.numero}
                      </span>
                      <Badge variant={p.disponible ? "disponible" : "faltante"}>
                        {p.disponible ? "Disponible" : "Faltante"}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 mb-3">Conexiones</h2>
            {connections.length === 0 ? (
              <p className="text-sm text-slate-400">Sin conexiones registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                      <th className="pb-2 pr-4">Pieza origen</th>
                      <th className="pb-2 pr-4">Punto</th>
                      <th className="pb-2 pr-4">Pieza destino</th>
                      <th className="pb-2">Punto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {connections.map((c, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 text-slate-700">
                          Pieza {c.numero_origen}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge>{c.conexion_pieza1}</Badge>
                        </td>
                        <td className="py-2 pr-4 text-slate-700">
                          Pieza {c.numero_destino}
                        </td>
                        <td className="py-2">
                          <Badge>{c.conexion_pieza2}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
