import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Inicio" },
  { to: "/importar", label: "Importar rompecabezas" },
];

export function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-lg tracking-tight">
          <span className="text-xl">🧩</span>
          <span>PuzzleGraph</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active =
              link.to === "/"
                ? pathname === "/"
                : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
