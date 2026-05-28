import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="text-5xl">🧩</div>
      <h2 className="text-lg font-semibold text-slate-700">
        No hay rompecabezas cargados todavía
      </h2>
      <p className="text-sm text-slate-400 max-w-xs">
        Importa el primero para comenzar a modelar y armar tu rompecabezas.
      </p>
      <Link to="/importar">
        <Button>Importar rompecabezas</Button>
      </Link>
    </div>
  );
}
