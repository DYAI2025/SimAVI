
export function generateCSV(images: Array<{
  originalName: string;
  newName: string | null;
  objects: string | null;
  detectedText: string | null;
  location: string | null;
  metadata: string | null;
}>): string {
  const headers = ["Original Name", "New Name", "Objects", "Detected Text", "Location", "Metadata"];
  const rows = images.map(img => [
    img.originalName || "",
    img.newName || "",
    img.objects || "",
    (img.detectedText || "").replace(/\n/g, " ").replace(/"/g, '""'),
    img.location || "",
    img.metadata || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

export function generateJSON(images: Array<{
  id: number;
  originalName: string;
  newName: string | null;
  objects: string | null;
  detectedText: string | null;
  location: string | null;
  metadata: string | null;
  analysisStatus: string;
  createdAt: Date;
}>): string {
  return JSON.stringify(images, null, 2);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
