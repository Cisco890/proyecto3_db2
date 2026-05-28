type Props = {
  title: string;
  description: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
};

export function FileUploadCard({
  title,
  description,
  accept,
  file,
  onChange,
  required = false,
}: Props) {
  const inputId = `upload-${title.replace(/\s+/g, "-").toLowerCase()}`;
  const isReady = file !== null;

  return (
    <label
      htmlFor={inputId}
      className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed p-4 transition-colors ${
        isReady
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
      }`}
    >
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {title}
            {required && <span className="ml-1 text-red-400">*</span>}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isReady
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {isReady ? "✓ Listo" : "Pendiente"}
        </span>
      </div>

      {isReady ? (
        <p className="truncate text-xs font-mono text-emerald-700 bg-emerald-100 rounded px-2 py-1">
          {file!.name}
        </p>
      ) : (
        <p className="text-xs text-indigo-500 font-medium">
          Haz clic para seleccionar
        </p>
      )}
    </label>
  );
}