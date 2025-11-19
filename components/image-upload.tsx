
"use client";

import { useCallback, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onUploadComplete: () => void;
}

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files || []);
      await uploadFiles(files);
    },
    []
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target?.files || []);
      await uploadFiles(files);
    },
    []
  );

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const imageFiles = files.filter((file) =>
      file.type?.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie nur Bilddateien aus",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload fehlgeschlagen");
      }

      const data = await response.json();

      toast({
        title: "Upload erfolgreich",
        description: `${imageFiles.length} Bild(er) hochgeladen`,
      });

      onUploadComplete();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300
          ${isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-300 dark:border-gray-700"}
          ${isUploading ? "opacity-50 pointer-events-none" : "hover:border-blue-400 cursor-pointer"}
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-16 h-16 text-gray-400" />
          )}

          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {isUploading
                ? "Bilder werden hochgeladen..."
                : "Bilder hier ablegen oder klicken zum Auswählen"}
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG, WEBP - Mehrere Dateien möglich
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
