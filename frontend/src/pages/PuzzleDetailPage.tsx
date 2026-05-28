import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPuzzleById,
  getPiecesByPuzzle,
  getConnectionsByPuzzle,
} from "../api/puzzleApi";
import { imageUrl } from "../api/client";
import type { Puzzle, Piece, Connection } from "../types/puzzle";
import { PageHeader } from "../components/layout/PageHeader";
import { PuzzleSummary } from "../components/puzzle/PuzzleSummary";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!puzzleId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, pcs, conns] = await Promise.all([
          getPuzzleById(puzzleId!),
          getPiecesByPuzzle(puzzleId!),
          getConnectionsByPuzzle(puzzleId!),
        ]);
        setPuzzle(p);
        setPieces(pcs);
        setConnections(conns);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el rompecabezas."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [puzzleId]);

  if (loading) return <LoadingState message="Cargando rompecabezas..." />;

  if (error || !puzzle) {
    return (
      <Alert variant="error">
        {error ?? "No se encontró el rompecabezas solicitado."}
      </Alert>
    );
  }

  const sortedPieces = [...pieces].sort((a, b) => a.numero - b.numero);

  return (
    <div className="space-y-8">
      <PageHeader
        title={puzzle.nombre}
        subtitle={puzzle.tematica}
        actions={
          <Button
            variant="primary"
            onClick={() => navigate(`/puzzles/${puzzle.id}/armado`)}
          >
            Comenzar armado
          </Button>
        }
      />

      {/* Image + Summary */}
      <div className="grid gap-6 sm:grid-cols-2 items-start">
        <Card className="overflow-hidden">
          {puzzle.imagen_url && !imageError ? (
            <img
              src={imageUrl(puzzle.imagen_url)}
              alt={puzzle.nombre}
              className="w-full h-56 object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-56 items-center justify-center bg-slate-100 text-slate-400 text-sm">
              {puzzle.imagen_url
                ? "No se pudo cargar la imagen general del rompecabezas."
                : "Sin imagen registrada."}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <PuzzleSummary puzzle={puzzle} />
          <div className="text-xs text-slate-400 space-y-1 px-1">
            <p>
              <span className="font-medium text-slate-600">ID:</span> {puzzle.id}
            </p>
            {puzzle.imagen_url && (
              <p className="truncate">
                <span className="font-medium text-slate-600">Imagen:</span>{" "}
                {puzzle.imagen_url}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pieces table */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Piezas</h2>
        {sortedPieces.length === 0 ? (
          <Alert variant="info">
            Este rompecabezas todavía no tiene piezas registradas.
          </Alert>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPieces.map((piece) => (
                  <tr
                    key={piece.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {piece.numero}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {piece.id}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={piece.disponible ? "disponible" : "faltante"}
                      >
                        {piece.disponible ? "Disponible" : "Faltante"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Connections table */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Conexiones
        </h2>
        {connections.length === 0 ? (
          <Alert variant="info">
            Este rompecabezas todavía no tiene conexiones registradas.
          </Alert>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Pieza origen</th>
                  <th className="px-4 py-3">Conexión</th>
                  <th className="px-4 py-3">Pieza destino</th>
                  <th className="px-4 py-3">Conexión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {connections.map((conn, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      Pieza {conn.numero_origen}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        #{conn.conexion_pieza1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      Pieza {conn.numero_destino}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        #{conn.conexion_pieza2}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {/* Bottom CTA */}
      <div className="flex justify-end border-t border-slate-100 pt-6">
        <Button
          variant="primary"
          onClick={() => navigate(`/puzzles/${puzzle.id}/armado`)}
        >
          Comenzar armado →
        </Button>
      </div>
    </div>
  );
}