
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "@/components/image-upload";
import { ImageGallery } from "@/components/image-gallery";
import { ExportButtons } from "@/components/export-buttons";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { SimaviLogo } from "@/components/simavi-logo";
import { Sparkles, Download, LogOut, User, Camera, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // User-Info laden
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          setUserEmail(data.email);
        }
      })
      .catch((error) => {
        console.error("Fehler beim Laden der User-Info:", error);
      });
  }, []);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast({
        title: "Abgemeldet",
        description: "Sie wurden erfolgreich abgemeldet",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Abmeldung fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-amber-500/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <SimaviLogo size="md" showText={true} />
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-amber-500/30 transition-all hover:border-amber-400 dark:hover:border-amber-400/50"
                  aria-label="Theme umschalten"
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700" />
                  )}
                </button>
              )}
              
              {userEmail && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-amber-500/20">
                  <User className="w-4 h-4 text-blue-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-amber-100">
                    {userEmail}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-amber-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? "Abmelden..." : "Abmelden"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 py-8">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
            Bilder intelligent analysieren und benennen
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Laden Sie Ihre Bilder hoch und lassen Sie KI-gestützte Vision-Technologie
            Objekte erkennen, Text extrahieren und automatisch beschreibende Dateinamen generieren.
          </p>
        </section>

        {/* Upload Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-amber-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Schritt 1: Bilder hochladen
            </h3>
          </div>
          <ImageUpload onUploadComplete={handleUploadComplete} />
        </section>

        {/* Gallery Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600 dark:text-amber-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Schritt 2: Bilder analysieren
              </h3>
            </div>
          </div>
          <ImageGallery refreshTrigger={refreshTrigger} />
        </section>

        {/* Export Section */}
        <section className="space-y-4 pb-12">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600 dark:text-amber-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Schritt 3: Ergebnisse exportieren
            </h3>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Exportieren Sie die Analyseergebnisse und Bildmetadaten in verschiedenen Formaten.
            </p>
            <ExportButtons />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>SimAVI Image Recognition - Powered by Vision AI</p>
        </div>
      </footer>
    </div>
  );
}