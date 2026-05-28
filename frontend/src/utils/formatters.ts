export function formatStatus(status: "complete" | "partial" | "blocked"): string {
  const map: Record<string, string> = {
    complete: "Completo",
    partial: "Parcial",
    blocked: "Bloqueado",
  };
  return map[status] ?? status;
}

export function formatPieces(nums: number[]): string {
  return nums.length === 0 ? "—" : nums.join(", ");
}
