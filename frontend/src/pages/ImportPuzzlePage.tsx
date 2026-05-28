import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { importPuzzle } from "../api/puzzleApi";
import type { ImportResult } from "../types/puzzle";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

type FileField = {
  key: "puzzle_file" | "pieces_file" | "connections_file" | "image_file";
  label: string;
  accept: string;
  required: boolean;
  hint: string;
};

const fields: FileField[] = [
  {
    key: "puzzle_file",
    label: "puzzle.json",
    accept: ".json",
    required: true,
    hint: "Datos del rompecabezas (id, nombre, temática, total de piezas).",
  },
  {
    key: "pieces_file",
    label: "piezas.csv",
    accept: ".csv",
    required: true,
    hint: "Lista de piezas con su disponibilidad.",
  },
  {
    key: "connections_file",
    label: "conexiones.csv",
    accept: ".csv",
    required: true,
    hint: "Conexiones entre piezas con sus puntos físicos.",
  },
  {
    key: "image_file",
    label: "Imagen del rompecabezas",
    accept: "image/*",
    required: false,
    hint: "Imagen de referencia (opcional).",
  },
];

export function ImportPuzzlePage() {
  const navigate = useNavigate();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({
    puzzle_file: null,
    pieces_file: null,
    connections_file: null,
    image_file: null,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(key: string, file: File | null) {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const form = new FormData();
    for (const f of fields) {
      const file = files[f.key];
      if (f.required && !file) {
        setError(`El archivo "${f.label}" es obligatorio.`);
        return;
      }
      if (file) form.append(f.key, file);
    }

    setLoading(true);
    try {
      const res = await importPuzzle(form);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al importar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Importar rompecabezas"
        subtitle="Carga los archivos de datos y la imagen opcional del rompecabezas."
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">
                {f.label}
                {f.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className="text-xs text-slate-400">{f.hint}</p>
              <input
                ref={(el) => { fileRefs.current[f.key] = el; }}
                type="file"
                accept={f.accept}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onChange={(e) =>
                  handleFile(f.key, e.target.files?.[0] ?? null)
                }
              />
              {files[f.key] && (
                <p className="text-xs text-emerald-600">
                  ✓ {files[f.key]!.name}
                </p>
              )}
            </div>
          ))}

          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          {result && (
            <Alert variant="success" title="Importación exitosa">
              <ul className="mt-1 space-y-0.5 text-sm">
                <li>Rompecabezas: <strong>{result.puzzle_id}</strong></li>
                <li>Piezas importadas: <strong>{result.pieces_imported}</strong></li>
                <li>Conexiones importadas: <strong>{result.connections_imported}</strong></li>
              </ul>
              {result.warnings.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-amber-700">Advertencias:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                    {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {loading ? "Importando..." : "Importar"}
            </Button>
            {result && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/puzzles/${result.puzzle_id}`)}
              >
                Ver rompecabezas
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
