import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { importPuzzle } from "../api/puzzleApi";
import type { ImportResult } from "../types/puzzle";
import { FileUploadCard } from "../components/puzzle/FileUploadCard";
import { PageHeader } from "../components/layout/PageHeader";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

type FormStatus = "idle" | "validating" | "submitting" | "success" | "error";

const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function ImportPuzzlePage() {
  const navigate = useNavigate();

  const [puzzleFile, setPuzzleFile] = useState<File | null>(null);
  const [piecesFile, setPiecesFile] = useState<File | null>(null);
  const [connectionsFile, setConnectionsFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleImageChange(file: File | null) {
    setImageFile(file);
    if (!file) {
      setImagePreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function validate(): string | null {
    if (!puzzleFile) return "Falta el archivo puzzle.json.";
    if (!piecesFile) return "Falta el archivo piezas.csv.";
    if (!connectionsFile) return "Falta el archivo conexiones.csv.";
    if (!imageFile) return "Falta la imagen general del rompecabezas.";
    const ext = getExtension(imageFile.name);
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext))
      return `La imagen debe ser .jpg, .jpeg, .png o .webp. Se recibió: .${ext}`;
    return null;
  }

  async function handleSubmit() {
    setStatus("validating");
    setErrorMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      setStatus("error");
      return;
    }

    setStatus("submitting");

    const form = new FormData();
    form.append("puzzle_file", puzzleFile!);
    form.append("pieces_file", piecesFile!);
    form.append("connections_file", connectionsFile!);
    form.append("image_file", imageFile!);

    try {
      const data = await importPuzzle(form);
      setResult(data);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error al importar.");
      setStatus("error");
    }
  }

  const isSubmitting = status === "submitting";
  const allSelected = !!(puzzleFile && piecesFile && connectionsFile && imageFile);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Importar rompecabezas"
        subtitle="Carga los archivos necesarios para registrar un rompecabezas. La imagen se guardará como referencia general y Neo4j almacenará únicamente su ruta."
      />

      {/* File upload section */}
      <Card className="p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Archivos requeridos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FileUploadCard
            title="puzzle.json"
            description="Datos generales del rompecabezas."
            accept=".json"
            file={puzzleFile}
            onChange={setPuzzleFile}
            required
          />
          <FileUploadCard
            title="piezas.csv"
            description="Listado de piezas con su disponibilidad."
            accept=".csv"
            file={piecesFile}
            onChange={setPiecesFile}
            required
          />
          <FileUploadCard
            title="conexiones.csv"
            description="Conexiones físicas entre piezas."
            accept=".csv"
            file={connectionsFile}
            onChange={setConnectionsFile}
            required
          />
          <FileUploadCard
            title="Imagen general"
            description="Foto o imagen del rompecabezas completo."
            accept=".jpg,.jpeg,.png,.webp"
            file={imageFile}
            onChange={handleImageChange}
            required
          />
        </div>
      </Card>

      {/* Image preview */}
      {imagePreview && (
        <Card className="p-4 mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Vista previa de imagen
          </p>
          <div className="overflow-hidden rounded-lg max-h-64 flex items-center justify-center bg-slate-100">
            <img
              src={imagePreview}
              alt="Vista previa del rompecabezas"
              className="max-h-64 w-auto rounded-lg object-contain"
            />
          </div>
        </Card>
      )}

      {/* Error message */}
      {status === "error" && errorMessage && (
        <div className="mb-5">
          <Alert variant="error" title="No se pudo importar">
            {errorMessage}
          </Alert>
        </div>
      )}

      {/* Success result */}
      {status === "success" && result && (
        <div className="mb-5 space-y-4">
          <Alert variant="success" title="Rompecabezas importado correctamente">
            <ul className="mt-1 space-y-0.5 text-sm">
              <li>
                <span className="font-medium">ID:</span> {result.puzzle_id}
              </li>
              <li>
                <span className="font-medium">Piezas importadas:</span>{" "}
                {result.pieces_imported}
              </li>
              <li>
                <span className="font-medium">Conexiones importadas:</span>{" "}
                {result.connections_imported}
              </li>
              <li>
                <span className="font-medium">Imagen:</span> {result.image_url}
              </li>
            </ul>
          </Alert>

          {result.warnings && result.warnings.length > 0 && (
            <Alert variant="warning" title="Advertencias">
              <ul className="mt-1 space-y-0.5 text-sm list-disc list-inside">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => navigate(`/puzzles/${result.puzzle_id}`)}
            >
              Ver detalle del rompecabezas
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setStatus("idle");
                setResult(null);
                setPuzzleFile(null);
                setPiecesFile(null);
                setConnectionsFile(null);
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              Importar otro
            </Button>
          </div>
        </div>
      )}

      {/* Submit button */}
      {status !== "success" && (
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            disabled={!allSelected || isSubmitting}
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Importando..." : "Importar rompecabezas"}
          </Button>
          {!allSelected && (
            <p className="text-xs text-slate-400">
              Selecciona los 4 archivos para continuar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
