import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPuzzles } from "../api/puzzleApi";
import type { Puzzle } from "../types/puzzle";
import { PageHeader } from "../components/layout/PageHeader";
import { PuzzleCard } from "../components/puzzle/PuzzleCard";
import { EmptyState } from "../components/puzzle/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPuzzles()
      .then(setPuzzles)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Rompecabezas"
        subtitle="Modela y arma tus rompecabezas usando grafos en Neo4j."
        actions={
          <Link to="/importar">
            <Button>+ Importar rompecabezas</Button>
          </Link>
        }
      />

      {loading && <LoadingState message="Cargando rompecabezas..." />}

      {!loading && error && (
        <Alert variant="error" title="No se pudo conectar al backend">
          {error}
        </Alert>
      )}

      {!loading && !error && puzzles.length === 0 && <EmptyState />}

      {!loading && !error && puzzles.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {puzzles.map((p) => (
            <PuzzleCard key={p.id} puzzle={p} />
          ))}
        </div>
      )}
    </div>
  );
}
