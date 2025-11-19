
export function sanitizeForFilename(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9äöüßÄÖÜ\s-]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50)
    .replace(/_+$/g, "");
}

export function generateNewFilename(
  location: string | null,
  isLocationFromMetadata: boolean,
  mainObject: string | null,
  detectedText: string | null,
  isSign: boolean,
  index: number,
  extension: string
): string {
  // Bestimme den Hauptteil des Namens
  let mainPart = "Unknown";
  
  // Wenn es ein Schild ist und Text erkannt wurde, verwende den Text
  if (isSign && detectedText && detectedText.trim().length > 0) {
    const firstLine = detectedText.split("\n")[0]?.trim();
    mainPart = sanitizeForFilename(firstLine || mainObject || "Schild");
  } 
  // Sonst verwende das Hauptobjekt
  else if (mainObject && mainObject.trim().length > 0) {
    mainPart = sanitizeForFilename(mainObject);
  }
  // Falls kein Objekt, aber Text erkannt wurde
  else if (detectedText && detectedText.trim().length > 0) {
    const firstLine = detectedText.split("\n")[0]?.trim();
    mainPart = sanitizeForFilename(firstLine || "Unknown");
  }

  const numberPart = String(index).padStart(3, "0");

  // Wenn Ort konkret aus Metadaten erkennbar ist, verwende Schema: Ort_Objekt_Nummer
  // Sonst nur: Objekt_Nummer
  if (isLocationFromMetadata && location && location.trim().length > 0) {
    const locationPart = sanitizeForFilename(location);
    return `${locationPart}_${mainPart}_${numberPart}.${extension}`;
  } else {
    return `${mainPart}_${numberPart}.${extension}`;
  }
}

export function extractExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "jpg";
}
