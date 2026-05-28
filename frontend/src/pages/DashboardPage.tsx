import { useEffect, useState } from "react";
import { getPuzzles } from "../api/puzzleApi";
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

  useEffect(() => {
    getPuzzles()
      .then(setPuzzles)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error al cargar.")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Rompecabezas"
        subtitle="Gestiona y arma tus rompecabezas desde aquí."
        actions={
          <Link to="/importar">
            <Button variant="primary">Importar rompecabezas</Button>
          </Link>
        }
      />

      {loading && <LoadingState message="Cargando rompecabezas..." />}

      {!loading && error && (
        <Alert variant="error" title="Error de conexión">
          {error}
        </Alert>
      )}

      {!loading && !error && puzzles.length === 0 && <EmptyState />}

      {!loading && !error && puzzles.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {puzzles.map((puzzle) => (
            <PuzzleCard key={puzzle.id} puzzle={puzzle} />
          ))}
        </div>
      )}
    </div>
  );
}
