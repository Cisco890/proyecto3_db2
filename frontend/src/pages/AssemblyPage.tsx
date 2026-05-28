import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPuzzleById, getPiecesByPuzzle, generateAssembly } from "../api/puzzleApi";
import type { Puzzle, Piece } from "../types/puzzle";
import type { AssemblyResult, AssemblyStep } from "../types/assembly";
import { formatStatus, formatPieces } from "../utils/formatters";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { ProgressBar } from "../components/ui/ProgressBar";
import { LoadingState } from "../components/ui/LoadingState";

export function AssemblyPage() {
  const { puzzleId } = useParams<{ puzzleId: string }>();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState("");
  const [result, setResult] = useState<AssemblyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!puzzleId) return;
    Promise.all([getPuzzleById(puzzleId), getPiecesByPuzzle(puzzleId)])
      .then(([p, pcs]) => {
        setPuzzle(p);
        setPieces(pcs);
        const first = pcs.find((pc) => pc.disponible);
        if (first) setSelectedPiece(first.id);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setPageLoading(false));
  }, [puzzleId]);

  async function handleAssemble() {
    if (!puzzleId || !selectedPiece) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generateAssembly(puzzleId, selectedPiece);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al generar armado.");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) return <LoadingState message="Cargando datos..." />;
  if (!puzzle) return <Alert variant="error">Rompecabezas no encontrado.</Alert>;

  const availablePieces = pieces.filter((p) => p.disponible);

  return (
    <div>
      <PageHeader
        title={`Armar: ${puzzle.nombre}`}
        subtitle="Selecciona la pieza inicial y genera las instrucciones de armado."
        actions={
          <Link to={`/puzzles/${puzzleId}`}>
            <Button variant="secondary">← Volver al detalle</Button>
          </Link>
        }
      />

      <Card className="p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Pieza inicial
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={selectedPiece}
              onChange={(e) => setSelectedPiece(e.target.value)}
            >
              {availablePieces.length === 0 && (
                <option value="">Sin piezas disponibles</option>
              )}
              {availablePieces
                .slice()
                .sort((a, b) => a.numero - b.numero)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    Pieza {p.numero}
                  </option>
                ))}
            </select>
          </div>
          <Button
            onClick={handleAssemble}
            loading={loading}
            disabled={!selectedPiece || availablePieces.length === 0}
          >
            Generar armado
          </Button>
        </div>
      </Card>

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {result && (
        <div className="flex flex-col gap-6">
          <ResultSummary result={result} />

          {result.steps.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Instrucciones paso a paso
              </h2>
              <div className="flex flex-col gap-4">
                {result.steps.map((step) => (
                  <StepCard key={step.step_number} step={step} />
                ))}
              </div>
            </div>
          )}

          {result.unresolved_connections.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-slate-900 mb-3">
                Conexiones no realizadas
              </h2>
              <ul className="space-y-1 text-sm text-slate-600">
                {result.unresolved_connections.map((u, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-red-400">✕</span>
                    Pieza {u.from_piece} (punto {u.from_connection}) — Pieza{" "}
                    {u.to_piece} (punto {u.to_connection})
                    {u.reason && (
                      <span className="text-slate-400 text-xs">· {u.reason}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSummary({ result }: { result: AssemblyResult }) {
  const statusVariant: Record<string, "completo" | "parcial" | "bloqueado"> = {
    complete: "completo",
    partial: "parcial",
    blocked: "bloqueado",
  };
  const lastStep = result.steps[result.steps.length - 1];
  const percent = lastStep?.progress_percent ?? (result.status === "complete" ? 100 : 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Resultado del armado</h2>
        <Badge variant={statusVariant[result.status] ?? "default"}>
          {formatStatus(result.status)}
        </Badge>
      </div>

      <ProgressBar percent={percent} label={`${result.placed_pieces.length} de ${result.total_available} piezas disponibles colocadas`} />

      <p className="text-sm text-slate-600 mt-4">{result.summary}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Piezas colocadas</p>
          <p className="font-medium text-slate-800">{formatPieces(result.placed_pieces)}</p>
        </div>
        {result.missing_pieces.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Piezas faltantes</p>
            <p className="font-medium text-red-600">{formatPieces(result.missing_pieces)}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function StepCard({ step }: { step: AssemblyStep }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Paso {step.step_number}
        </span>
        <span className="text-xs text-slate-400">{step.progress}</span>
      </div>

      {step.warning && (
        <Alert variant="warning" className="mb-3">
          {step.warning}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Pieza base</p>
          <p className="font-semibold text-slate-800">Pieza {step.base_piece}</p>
          <p className="text-xs text-slate-500">Punto de conexión: {step.base_connection}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-0.5">Nueva pieza</p>
          <p className="font-semibold text-slate-800">Pieza {step.new_piece}</p>
          <p className="text-xs text-slate-500">Punto de conexión: {step.new_connection}</p>
        </div>
      </div>

      <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-800 mb-3">
        {step.instruction}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
          {step.diagram}
        </span>
        <ProgressBar percent={step.progress_percent} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {step.placed_pieces.map((n) => (
          <span key={n} className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">
            {n}
          </span>
        ))}
        {step.pending_pieces.map((n) => (
          <span key={n} className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
            {n}
          </span>
        ))}
        {step.missing_pieces.map((n) => (
          <span key={n} className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-500">
            {n} ✕
          </span>
        ))}
      </div>
    </Card>
  );
}
