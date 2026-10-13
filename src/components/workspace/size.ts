export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getSizeFormatted(text: string): string {
  if (!text.trim()) return "0 B";
  return formatSize(new Blob([text]).size);
}
