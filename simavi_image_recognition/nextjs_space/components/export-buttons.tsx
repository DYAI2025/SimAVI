
"use client";

import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function ExportButtons() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadImages = async () => {
    setIsDownloading(true);
    try {
      toast({
        title: "Vorbereitung läuft...",
        description: "Bilder werden vorbereitet. Dies kann einen Moment dauern.",
      });

      const response = await fetch("/api/export/zip");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Export fehlgeschlagen");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `umbenannte-bilder-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download erfolgreich",
        description: "Alle Bilder mit neuen Namen wurden heruntergeladen",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte versuchen Sie es erneut",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleDownloadImages}
        disabled={isDownloading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Wird vorbereitet...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Bilder mit neuen Namen herunterladen
          </>
        )}
      </button>
    </div>
  );
}
