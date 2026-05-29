import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { imageUrl } from "../api/client";
import { generateAssembly, getPiecesByPuzzle, getPuzzleById } from "../api/puzzleApi";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert } from "../components/ui/Alert";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { LoadingState } from "../components/ui/LoadingState";
import { ProgressBar } from "../components/ui/ProgressBar";
import type { AssemblyResult, AssemblyStep } from "../types/assembly";
import type { Piece, Puzzle } from "../types/puzzle";
import { formatPieces, formatStatus } from "../utils/formatters";

const statusVariant: Record<
  AssemblyResult["status"],
  "completo" | "parcial" | "bloqueado"
> = {
  complete: "completo",
  partial: "parcial",
  blocked: "bloqueado",
};

function sortPiecesByNumber(pieces: Piece[]): Piece[] {
  return [...pieces].sort((a, b) => a.numero - b.numero);
}

function buildInitialPlacedPieces(result: AssemblyResult, pieces: Piece[]): number[] {
  const startPiece = pieces.find((piece) => piece.id === result.start_piece_id);
  return startPiece ? [startPiece.numero] : result.placed_pieces;
}

function currentPlacedPieces(
  result: AssemblyResult | null,
  step: AssemblyStep | null,
  pieces: Piece[]
): number[] {
  if (!result) return [];
  if (step) return step.placed_pieces;
  return buildInitialPlacedPieces(result, pieces);
}

function currentPendingPieces(
  result: AssemblyResult | null,
  step: AssemblyStep | null,
  pieces: Piece[]
): number[] {
  if (!result) return sortPiecesByNumber(pieces.filter((piece) => piece.disponible)).map((p) => p.numero);
  if (step) return step.pending_pieces;

  const placed = new Set(buildInitialPlacedPieces(result, pieces));
  return sortPiecesByNumber(pieces)
    .filter((piece) => piece.disponible && !placed.has(piece.numero))
    .map((piece) => piece.numero);
}

function getFinalMessage(status: AssemblyResult["status"]): string {
  if (status === "complete") {
    return "Armado completado. Todas las piezas disponibles fueron colocadas correctamente.";
  }
  if (status === "partial") {
    return "Armado parcial completado. Se colocaron las piezas alcanzables y se conservaron aparte las faltantes.";
  }
  return "No se pudo continuar el armado desde la pieza seleccionada. Selecciona otra pieza inicial o revisa las conexiones registradas.";
}

export function AssemblyPage() {
  const { puzzleId } = useParams<{ puzzleId: string }>();
  const navigate = useNavigate();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedStartPieceId, setSelectedStartPieceId] = useState("");
  const [assemblyResult, setAssemblyResult] = useState<AssemblyResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [reviewedSteps, setReviewedSteps] = useState<Set<number>>(new Set());
  const [pageLoading, setPageLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  useEffect(() => {
    if (!puzzleId) return;

    async function loadPageData() {
      setPageLoading(true);
      setError(null);
      try {
        const [puzzleData, pieceData] = await Promise.all([
          getPuzzleById(puzzleId!),
          getPiecesByPuzzle(puzzleId!),
        ]);
        const sortedPieces = sortPiecesByNumber(pieceData);
        const firstAvailablePiece = sortedPieces.find((piece) => piece.disponible);

        setPuzzle(puzzleData);
        setPieces(sortedPieces);
        setSelectedStartPieceId(firstAvailablePiece?.id ?? "");
        setImageError(false);
        setIsImagePreviewOpen(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar el rompecabezas."
        );
      } finally {
        setPageLoading(false);
      }
    }

    loadPageData();
  }, [puzzleId]);

  useEffect(() => {
    if (!isImagePreviewOpen) return;

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsImagePreviewOpen(false);
      }
    }

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isImagePreviewOpen]);

  const availablePieces = useMemo(
    () => sortPiecesByNumber(pieces.filter((piece) => piece.disponible)),
    [pieces]
  );

  const missingPieces = useMemo(
    () => sortPiecesByNumber(pieces.filter((piece) => !piece.disponible)),
    [pieces]
  );

  const currentStep = assemblyResult?.steps[currentStepIndex] ?? null;
  const placedPieces = currentPlacedPieces(assemblyResult, currentStep, pieces);
  const pendingPieces = currentPendingPieces(assemblyResult, currentStep, pieces);
  const visibleMissingPieces =
    assemblyResult?.missing_pieces ?? missingPieces.map((piece) => piece.numero);
  const progressPercent = assemblyResult
    ? currentStep?.progress_percent ??
      (assemblyResult.total_available > 0
        ? (placedPieces.length / assemblyResult.total_available) * 100
        : 0)
    : 0;
  const progressLabel = assemblyResult
    ? currentStep?.progress ??
      `${placedPieces.length} de ${assemblyResult.total_available} piezas disponibles colocadas`
    : `0 de ${availablePieces.length} piezas disponibles colocadas`;
  const isLastStep =
    !!assemblyResult &&
    (assemblyResult.steps.length === 0 ||
      currentStepIndex === assemblyResult.steps.length - 1);

  function resetAssemblyProgress() {
    setAssemblyResult(null);
    setCurrentStepIndex(0);
    setReviewedSteps(new Set());
    setError(null);
  }

  async function handleGenerateAssembly() {
    if (!puzzleId || !selectedStartPieceId) return;

    setGenerating(true);
    setError(null);
    try {
      const result = await generateAssembly(puzzleId, selectedStartPieceId);
      setAssemblyResult(result);
      setCurrentStepIndex(0);
      setReviewedSteps(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar el armado.");
      setAssemblyResult(null);
      setCurrentStepIndex(0);
      setReviewedSteps(new Set());
    } finally {
      setGenerating(false);
    }
  }

  function handleMarkCurrentStep() {
    if (!currentStep) return;
    setReviewedSteps((previous) => {
      const next = new Set(previous);
      next.add(currentStep.step_number);
      return next;
    });
  }

  if (pageLoading) return <LoadingState message="Cargando guia de armado..." />;

  if (error && !puzzle) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!puzzle) {
    return <Alert variant="error">Rompecabezas no encontrado.</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Guia de armado: ${puzzle.nombre}`}
        subtitle="Usa una pieza inicial disponible y sigue una instruccion a la vez."
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate(`/puzzles/${puzzle.id}`)}
          >
            Volver al detalle
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-2">
          {error}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <main className="space-y-6">
          <Card className="p-5">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_14rem]">
              <div>
                <label
                  htmlFor="start-piece"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Selecciona la pieza inicial
                </label>
                <p className="mt-1 text-sm text-slate-500">
                  Solo se muestran piezas disponibles para evitar iniciar desde una pieza faltante.
                </p>
                <select
                  id="start-piece"
                  className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={selectedStartPieceId}
                  onChange={(event) => {
                    setSelectedStartPieceId(event.target.value);
                    resetAssemblyProgress();
                  }}
                  disabled={availablePieces.length === 0 || generating}
                >
                  {availablePieces.length === 0 && (
                    <option value="">Sin piezas disponibles</option>
                  )}
                  {availablePieces.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      Pieza {piece.numero}
                    </option>
                  ))}
                </select>

                {missingPieces.length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    Faltantes fuera del selector:{" "}
                    <span className="font-medium text-red-600">
                      {formatPieces(missingPieces.map((piece) => piece.numero))}
                    </span>
                  </p>
                )}
              </div>

              <div className="flex flex-col justify-end gap-3">
                {availablePieces.length === 0 ? (
                  <Alert variant="warning">
                    No hay piezas disponibles para iniciar el armado.
                  </Alert>
                ) : (
                  <Button
                    className="w-full"
                    disabled={!selectedStartPieceId || generating}
                    loading={generating}
                    onClick={handleGenerateAssembly}
                  >
                    Generar instrucciones
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <ProgressPanel
            result={assemblyResult}
            progressLabel={progressLabel}
            progressPercent={progressPercent}
            placedCount={placedPieces.length}
            missingCount={visibleMissingPieces.length}
          />
{assemblyResult && assemblyResult.steps.length > 0 && (
            <Card className="p-5 border-amber-200 bg-amber-50">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-3">
                Antes de empezar
              </p>
              <ul className="space-y-2 text-sm text-amber-900">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold">1.</span>
                  <span>
                    Coloca todas las piezas con el <span className="font-semibold">dibujo hacia arriba</span>. Ninguna pieza debe estar volteada.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold">2.</span>
                  <span>
                    Cada pieza tiene <span className="font-semibold">puntos de ensamble numerados</span> en sus bordes. El número de conexión indica cuál borde debes unir con el de la otra pieza.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-bold">3.</span>
                  <span>
                    En cada paso, la <span className="font-semibold">pieza base ya debe estar colocada</span> antes de agregar la nueva pieza.
                  </span>
                </li>
              </ul>
            </Card>
          )}
          {assemblyResult ? (
            <Card className="p-5">
              {currentStep ? (
                <CurrentStepCard
                  step={currentStep}
                  reviewed={reviewedSteps.has(currentStep.step_number)}
                />
              ) : (
                <BlockedState selectedStartPieceId={selectedStartPieceId} pieces={pieces} />
              )}

              <StepControls
                currentStep={currentStep}
                currentStepIndex={currentStepIndex}
                totalSteps={assemblyResult.steps.length}
                reviewed={!!currentStep && reviewedSteps.has(currentStep.step_number)}
                onPrevious={() => setCurrentStepIndex((index) => Math.max(0, index - 1))}
                onNext={() =>
                  setCurrentStepIndex((index) =>
                    Math.min(assemblyResult.steps.length - 1, index + 1)
                  )
                }
                onMarkReviewed={handleMarkCurrentStep}
                onBackToDetail={() => navigate(`/puzzles/${puzzle.id}`)}
              />
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                Genera las instrucciones para ver el primer paso.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                La guia mostrara una conexion por vez y mantendra el progreso visible.
              </p>
            </Card>
          )}

          {assemblyResult && assemblyResult.steps.length > 0 && (
            <StepTimeline
              steps={assemblyResult.steps}
              currentStepIndex={currentStepIndex}
              reviewedSteps={reviewedSteps}
              onSelectStep={setCurrentStepIndex}
            />
          )}

          {assemblyResult && isLastStep && <FinalSummary result={assemblyResult} />}

          {assemblyResult &&
            isLastStep &&
            assemblyResult.unresolved_connections.length > 0 && (
              <UnresolvedConnections result={assemblyResult} />
            )}
        </main>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <ReferenceImage
            puzzle={puzzle}
            currentStep={currentStep}
            imageError={imageError}
            onImageError={() => setImageError(true)}
            onOpenPreview={() => setIsImagePreviewOpen(true)}
          />

          <PiecesPanel
            placedPieces={placedPieces}
            pendingPieces={pendingPieces}
            missingPieces={visibleMissingPieces}
          />
        </aside>
      </div>

      <ImagePreviewModal
        open={isImagePreviewOpen}
        puzzle={puzzle}
        currentStep={currentStep}
        onClose={() => setIsImagePreviewOpen(false)}
      />
    </div>
  );
}

function ProgressPanel({
  result,
  progressLabel,
  progressPercent,
  placedCount,
  missingCount,
}: {
  result: AssemblyResult | null;
  progressLabel: string;
  progressPercent: number;
  placedCount: number;
  missingCount: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Progreso
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {progressLabel}
          </h2>
        </div>
        {result && (
          <Badge variant={statusVariant[result.status]}>
            {formatStatus(result.status)}
          </Badge>
        )}
      </div>

      <div className="mt-4">
        <ProgressBar percent={progressPercent} label={`${Math.round(progressPercent)}%`} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Piezas colocadas" value={placedCount} />
        <Metric
          label="Piezas faltantes"
          value={missingCount}
          tone={missingCount > 0 ? "text-red-600" : "text-emerald-700"}
        />
        <Metric
          label="Estado"
          value={result ? formatStatus(result.status) : "Sin iniciar"}
          textValue
        />
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone = "text-slate-900",
  textValue = false,
}: {
  label: string;
  value: number | string;
  tone?: string;
  textValue?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 font-semibold ${tone} ${textValue ? "text-sm" : "text-lg"}`}>
        {value}
      </p>
    </div>
  );
}

function CurrentStepCard({
  step,
  reviewed,
}: {
  step: AssemblyStep;
  reviewed: boolean;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Paso {step.step_number}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Une pieza {step.base_piece} con pieza {step.new_piece}
          </h2>
        </div>
        {reviewed && <Badge variant="disponible">Revisado</Badge>}
      </div>

      {step.warning && (
        <Alert variant="warning" className="mt-4">
          {step.warning}
        </Alert>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <InstructionField
          label="Pieza base"
          value={`Pieza ${step.base_piece}`}
          detail={`Conexion ${step.base_connection}`}
        />
        <InstructionField
          label="Nueva pieza"
          value={`Pieza ${step.new_piece}`}
          detail={`Conexion ${step.new_connection}`}
        />
      </div>

      <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Conexion
        </p>
        <p className="mt-1 text-sm font-medium text-indigo-950">{step.instruction}</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Antes de continuar
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Verifica que la pieza {step.base_piece} ya este colocada en el grupo armado.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Resultado esperado
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Piezas colocadas: {formatPieces(step.placed_pieces)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Progreso
          </p>
          <p className="mt-1 text-sm text-slate-700">{step.progress}</p>
          <div className="mt-2">
            <ProgressBar percent={step.progress_percent} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Diagrama actual
          </p>
          <p className="mt-2 overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-700">
            {step.diagram}
          </p>
        </div>
      </div>
    </div>
  );
}

function InstructionField({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value}</p>
      <p className="text-sm text-slate-500">{detail}</p>
    </div>
  );
}

function BlockedState({
  selectedStartPieceId,
  pieces,
}: {
  selectedStartPieceId: string;
  pieces: Piece[];
}) {
  const selectedPiece = pieces.find((piece) => piece.id === selectedStartPieceId);

  return (
    <Alert variant="warning" title="No hay pasos disponibles">
      La pieza inicial
      {selectedPiece ? ` ${selectedPiece.numero}` : ""} no tiene vecinos disponibles
      para continuar el armado desde esta ruta.
    </Alert>
  );
}

function StepControls({
  currentStep,
  currentStepIndex,
  totalSteps,
  reviewed,
  onPrevious,
  onNext,
  onMarkReviewed,
  onBackToDetail,
}: {
  currentStep: AssemblyStep | null;
  currentStepIndex: number;
  totalSteps: number;
  reviewed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onMarkReviewed: () => void;
  onBackToDetail: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:flex-wrap">
      <Button
        variant="secondary"
        disabled={currentStepIndex === 0 || totalSteps === 0}
        onClick={onPrevious}
      >
        Paso anterior
      </Button>
      <Button
        variant="secondary"
        disabled={!currentStep || reviewed}
        onClick={onMarkReviewed}
      >
        Marcar paso como revisado
      </Button>
      <Button
        disabled={totalSteps === 0 || currentStepIndex >= totalSteps - 1}
        onClick={onNext}
      >
        Siguiente paso
      </Button>
      <Button variant="secondary" onClick={onBackToDetail}>
        Volver al detalle
      </Button>
    </div>
  );
}

function StepTimeline({
  steps,
  currentStepIndex,
  reviewedSteps,
  onSelectStep,
}: {
  steps: AssemblyStep[];
  currentStepIndex: number;
  reviewedSteps: Set<number>;
  onSelectStep: (index: number) => void;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-slate-900">Lista resumida de pasos</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((step, index) => {
          const current = index === currentStepIndex;
          const reviewed = reviewedSteps.has(step.step_number);
          return (
            <button
              key={step.step_number}
              type="button"
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                current
                  ? "border-indigo-300 bg-indigo-50 text-indigo-950"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
              onClick={() => onSelectStep(index)}
            >
              <span className="font-semibold">Paso {step.step_number}</span>
              <span className="ml-2 text-xs text-slate-500">
                Pieza {step.base_piece} - pieza {step.new_piece}
              </span>
              {reviewed && (
                <span className="ml-2 text-xs font-medium text-emerald-700">
                  Revisado
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function FinalSummary({ result }: { result: AssemblyResult }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Resumen final</h2>
          <p className="mt-1 text-sm text-slate-600">{getFinalMessage(result.status)}</p>
        </div>
        <Badge variant={statusVariant[result.status]}>{formatStatus(result.status)}</Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Piezas colocadas
          </p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {formatPieces(result.placed_pieces)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Piezas faltantes
          </p>
          <p className="mt-1 text-sm font-medium text-red-600">
            {formatPieces(result.missing_pieces)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">{result.summary}</p>
    </Card>
  );
}

function UnresolvedConnections({ result }: { result: AssemblyResult }) {
  return (
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-slate-900">
        Conexiones no realizadas
      </h2>
      <div className="mt-4 space-y-3">
        {result.unresolved_connections.map((connection, index) => (
          <div
            key={`${connection.from_piece}-${connection.to_piece}-${index}`}
            className="rounded-lg border border-amber-200 bg-amber-50 p-3"
          >
            <p className="text-sm font-medium text-amber-950">
              Pieza {connection.from_piece} conexion {connection.from_connection} con
              pieza {connection.to_piece} conexion {connection.to_connection}
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Motivo: {connection.reason}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReferenceImage({
  puzzle,
  currentStep,
  imageError,
  onImageError,
  onOpenPreview,
}: {
  puzzle: Puzzle;
  currentStep: AssemblyStep | null;
  imageError: boolean;
  onImageError: () => void;
  onOpenPreview: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">
          Referencia visual del rompecabezas
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Presiona la imagen para verla en grande con el paso actual debajo.
        </p>
      </div>
      {puzzle.imagen_url && !imageError ? (
        <button
          type="button"
          className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-400"
          onClick={onOpenPreview}
          aria-label="Abrir imagen de referencia en grande"
        >
          <img
            src={imageUrl(puzzle.imagen_url)}
            alt={puzzle.nombre}
            className="h-72 w-full bg-slate-100 object-contain sm:h-80 lg:h-[30rem]"
            onError={onImageError}
          />
          <div className="border-t border-slate-100 bg-white px-4 py-2 text-xs font-medium text-indigo-700">
            {currentStep
              ? `Paso actual: ${currentStep.step_number} - Pieza ${currentStep.base_piece} con pieza ${currentStep.new_piece}`
              : "Sin paso activo. Genera instrucciones para ver detalles del paso."}
          </div>
        </button>
      ) : (
        <div className="flex h-72 items-center justify-center bg-slate-100 px-5 text-center text-sm text-slate-500 sm:h-80 lg:h-[30rem]">
          {puzzle.imagen_url
            ? "No se pudo cargar la imagen general."
            : "Sin imagen registrada."}
        </div>
      )}
    </Card>
  );
}

function ImagePreviewModal({
  open,
  puzzle,
  currentStep,
  onClose,
}: {
  open: boolean;
  puzzle: Puzzle;
  currentStep: AssemblyStep | null;
  onClose: () => void;
}) {
  if (!open || !puzzle.imagen_url) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-slate-900">Vista ampliada</p>
            <p className="text-xs text-slate-500">{puzzle.nombre}</p>
          </div>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="rounded-lg border border-slate-200 bg-slate-100 p-2">
            <img
              src={imageUrl(puzzle.imagen_url)}
              alt={puzzle.nombre}
              className="max-h-[65vh] w-full rounded object-contain"
            />
          </div>

          <div className="mt-5 rounded-lg border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Instrucciones del paso actual
            </p>
            {currentStep ? (
              <div className="mt-2 space-y-2 text-sm text-indigo-950">
                <p className="font-semibold">
                  Paso {currentStep.step_number}: pieza {currentStep.base_piece} con pieza{" "}
                  {currentStep.new_piece}
                </p>
                <p>{currentStep.instruction}</p>
                <p className="text-xs text-indigo-800">
                  Conexion base: {currentStep.base_connection} | Conexion nueva:{" "}
                  {currentStep.new_connection}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-indigo-900">
                No hay un paso activo todavia. Genera instrucciones para mostrar el paso actual.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PiecesPanel({
  placedPieces,
  pendingPieces,
  missingPieces,
}: {
  placedPieces: number[];
  pendingPieces: number[];
  missingPieces: number[];
}) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-slate-900">Estado de piezas</h2>
      <div className="mt-4 space-y-4">
        <PieceList title="Colocadas" values={placedPieces} tone="emerald" />
        <PieceList title="Pendientes" values={pendingPieces} tone="slate" />
        <PieceList title="Faltantes" values={missingPieces} tone="red" />
      </div>
    </Card>
  );
}

function PieceList({
  title,
  values,
  tone,
}: {
  title: string;
  values: number[];
  tone: "emerald" | "red" | "slate";
}) {
  const toneClass = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
  }[tone];

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      {values.length === 0 ? (
        <p className="mt-1 text-sm text-slate-400">Ninguna</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span
              key={`${title}-${value}`}
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${toneClass}`}
            >
              {value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
