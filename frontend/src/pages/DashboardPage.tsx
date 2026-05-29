import { useCallback, useEffect, useState } from "react";
import { deletePuzzle, getPuzzles } from "../api/puzzleApi";
import type { Puzzle } from "../types/puzzle";
import { PageHeader } from "../components/layout/PageHeader";
import { PuzzleCard } from "../components/puzzle/PuzzleCard";
import { EmptyState } from "../components/puzzle/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { Alert } from "../components/ui/Alert";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingPuzzleId, setDeletingPuzzleId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadPuzzles = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const data = await getPuzzles();
      setPuzzles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPuzzles();
  }, [loadPuzzles]);

  async function handleDeletePuzzle(puzzle: Puzzle) {
    const confirmed = window.confirm(
      `Eliminar el rompecabezas "${puzzle.nombre}"? Esta accion borra todas sus piezas y conexiones.`
    );
    if (!confirmed) return;

    setActionError(null);
    setActionSuccess(null);
    setDeletingPuzzleId(puzzle.id);

    try {
      const result = await deletePuzzle(puzzle.id);
      await loadPuzzles(false);
      setActionSuccess(
        `Rompecabezas eliminado. Piezas: ${result.pieces_deleted}. Conexiones: ${result.connections_deleted}.`
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "No se pudo eliminar el rompecabezas."
      );
    } finally {
      setDeletingPuzzleId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Rompecabezas"
        subtitle="Gestiona y arma tus rompecabezas desde aqui."
        actions={
          <Link to="/importar">
            <Button variant="primary">Importar rompecabezas</Button>
          </Link>
        }
      />

      {actionError && (
        <Alert variant="error" className="mb-4">
          {actionError}
        </Alert>
      )}

      {actionSuccess && (
        <Alert variant="success" className="mb-4">
          {actionSuccess}
        </Alert>
      )}

      {loading && <LoadingState message="Cargando rompecabezas..." />}

      {!loading && error && (
        <Alert variant="error" title="Error de conexion">
          {error}
        </Alert>
      )}

      {!loading && !error && puzzles.length === 0 && <EmptyState />}

      {!loading && !error && puzzles.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {puzzles.map((puzzle) => (
            <PuzzleCard
              key={puzzle.id}
              puzzle={puzzle}
              onDelete={handleDeletePuzzle}
              deleting={deletingPuzzleId === puzzle.id}
              disableActions={deletingPuzzleId !== null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
