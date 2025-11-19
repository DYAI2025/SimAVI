
"use client";

import { useState, useEffect } from "react";
import { ImageCard } from "./image-card";
import { EditNameModal } from "./edit-name-modal";
import type { ImageRecord } from "@/lib/image-types";
import { Loader2, Trash2, CheckSquare, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageGalleryProps {
  refreshTrigger: number;
  onAnalyzeComplete?: () => void;
}

export function ImageGallery({ refreshTrigger, onAnalyzeComplete }: ImageGalleryProps) {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingImage, setEditingImage] = useState<ImageRecord | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/images");
      const data = await response.json();
      setImages(data?.images || []);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refreshTrigger]);

  const handleNameUpdate = async (imageId: string, newName: string) => {
    try {
      const response = await fetch("/api/images", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, newName }),
      });

      if (response.ok) {
        fetchImages();
      }
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  const handleAnalysisComplete = () => {
    fetchImages();
    onAnalyzeComplete?.();
  };

  const handleDelete = () => {
    fetchImages();
  };

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map(img => img.id)));
    }
  };

  const handleSelect = (imageId: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(imageId);
    } else {
      newSelected.delete(imageId);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!window.confirm(`Möchten Sie wirklich ${selectedIds.size} Bild(er) löschen?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/images/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        throw new Error("Batch-Löschen fehlgeschlagen");
      }

      const result = await response.json();

      toast({
        title: "Bilder gelöscht",
        description: result.message,
      });

      setSelectedIds(new Set());
      setSelectionMode(false);
      fetchImages();
    } catch (error) {
      console.error("Fehler beim Batch-Löschen:", error);
      toast({
        title: "Löschen fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (images.length === 0) return;

    if (!window.confirm(`Möchten Sie wirklich ALLE ${images.length} Bilder löschen?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/images/delete-all", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Löschen aller Bilder fehlgeschlagen");
      }

      const result = await response.json();

      toast({
        title: "Alle Bilder gelöscht",
        description: result.message,
      });

      setSelectedIds(new Set());
      setSelectionMode(false);
      fetchImages();
    } catch (error) {
      console.error("Fehler beim Löschen aller Bilder:", error);
      toast({
        title: "Löschen fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Noch keine Bilder hochgeladen</p>
      </div>
    );
  }

  return (
    <>
      {/* Control Bar */}
      <div className="mb-4 flex flex-wrap gap-3 items-center justify-between bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              setSelectedIds(new Set());
            }}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              selectionMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {selectionMode ? 'Auswahl beenden' : 'Auswählen'}
          </button>

          {selectionMode && (
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              {selectedIds.size === images.length ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Alle abwählen
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Alle auswählen
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {selectionMode && selectedIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Lösche...' : `${selectedIds.size} Ausgewählte löschen`}
            </button>
          )}

          {!selectionMode && images.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Lösche...' : 'Alle löschen'}
            </button>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onEdit={() => setEditingImage(image)}
            onAnalysisComplete={handleAnalysisComplete}
            onDelete={handleDelete}
            selectionMode={selectionMode}
            isSelected={selectedIds.has(image.id)}
            onSelect={(selected) => handleSelect(image.id, selected)}
          />
        ))}
      </div>

      {editingImage && (
        <EditNameModal
          image={editingImage}
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          onSave={handleNameUpdate}
        />
      )}
    </>
  );
}
