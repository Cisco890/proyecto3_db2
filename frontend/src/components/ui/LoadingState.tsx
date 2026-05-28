type Props = { message?: string };

export function LoadingState({ message = "Cargando..." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
      <svg
        className="h-8 w-8 animate-spin text-indigo-500"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}
