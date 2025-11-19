
"use client";

import { useState } from "react";
import Image from "next/image";
import { Edit, Eye, Sparkles, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import type { ImageRecord } from "@/lib/image-types";
import { useToast } from "@/hooks/use-toast";

interface ImageCardProps {
  image: ImageRecord;
  onEdit: () => void;
  onAnalysisComplete: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  selectionMode?: boolean;
}

export function ImageCard({ 
  image, 
  onEdit, 
  onAnalysisComplete, 
  onDelete,
  isSelected = false,
  onSelect,
  selectionMode = false
}: ImageCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress("Starte Analyse...");

    try {
      const response = await fetch(`/api/analyze?imageId=${image.id}`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let partialRead = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialRead += decoder.decode(value, { stream: true });
        let lines = partialRead.split("\n");
        partialRead = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.status === "processing") {
                setAnalysisProgress(parsed.message || "Analysiere...");
              } else if (parsed.status === "completed") {
                toast({
                  title: "Analyse abgeschlossen",
                  description: `Neuer Name: ${parsed.result?.newName}`,
                });
                onAnalysisComplete();
                return;
              } else if (parsed.status === "error") {
                throw new Error(parsed.message || "Analysis failed");
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analyse fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress("");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Möchten Sie "${image.originalName}" wirklich löschen?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Löschen fehlgeschlagen");
      }

      toast({
        title: "Bild gelöscht",
        description: `"${image.originalName}" wurde erfolgreich gelöscht`,
      });

      onDelete();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      toast({
        title: "Löschen fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusIcon = () => {
    if (image.analysisStatus === "completed") {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (image.analysisStatus === "failed") {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    if (image.analysisStatus === "processing" || isAnalyzing) {
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
    return <Eye className="w-5 h-5 text-gray-400" />;
  };

  const objects = image.objects ? JSON.parse(image.objects) : [];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
        {selectionMode && onSelect && (
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <Eye className="w-12 h-12" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {image.originalName}
            </p>
            {image.newName && (
              <p className="text-sm text-green-600 dark:text-green-400 truncate font-semibold">
                → {image.newName}
              </p>
            )}
          </div>
          {getStatusIcon()}
        </div>

        {isAnalyzing && analysisProgress && (
          <div className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
            {analysisProgress}
          </div>
        )}

        {image.analysisStatus === "completed" && (
          <div className="space-y-2 text-sm">
            {objects.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Erkannte Objekte:
                </p>
                <div className="flex flex-wrap gap-1">
                  {objects.slice(0, 3).map((obj: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                    >
                      {obj}
                    </span>
                  ))}
                  {objects.length > 3 && (
                    <span className="px-2 py-0.5 text-gray-500 text-xs">
                      +{objects.length - 3} mehr
                    </span>
                  )}
                </div>
              </div>
            )}

            {image.detectedText && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Erkannter Text:
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                  {image.detectedText}
                </p>
              </div>
            )}

            {image.location && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ort: <span className="text-gray-700 dark:text-gray-300">{image.location}</span>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {image.analysisStatus === "pending" && (
            <>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Analysieren
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                title="Löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {image.analysisStatus === "completed" && (
            <>
              <button
                onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                Name bearbeiten
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                title="Löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {image.analysisStatus === "failed" && (
            <>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Erneut versuchen
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
                title="Löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
