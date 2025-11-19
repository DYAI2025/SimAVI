
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ImageRecord } from "@/lib/image-types";

interface EditNameModalProps {
  image: ImageRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageId: number, newName: string) => void;
}

export function EditNameModal({ image, isOpen, onClose, onSave }: EditNameModalProps) {
  const [newName, setNewName] = useState(image.newName || "");

  if (!isOpen) return null;

  const handleSave = () => {
    if (newName.trim()) {
      onSave(image.id, newName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Dateinamen bearbeiten
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Original:
            </label>
            <p className="text-sm text-gray-800 dark:text-gray-200 font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {image.originalName}
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Neuer Name:
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Neuer Dateiname"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
