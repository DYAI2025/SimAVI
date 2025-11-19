
import { Camera, Sparkles } from "lucide-react";

interface SimaviLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function SimaviLogo({ size = "md", showText = true }: SimaviLogoProps) {
  const sizeClasses = {
    sm: {
      container: "w-8 h-8",
      camera: "w-4 h-4",
      sparkle: "w-2.5 h-2.5",
      text: "text-lg",
    },
    md: {
      container: "w-12 h-12",
      camera: "w-6 h-6",
      sparkle: "w-3.5 h-3.5",
      text: "text-2xl",
    },
    lg: {
      container: "w-16 h-16",
      camera: "w-8 h-8",
      sparkle: "w-4 h-4",
      text: "text-3xl",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-3">
      {/* Logo Icon */}
      <div className="relative">
        <div
          className={`${classes.container} bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-lg dark:shadow-amber-500/10 flex items-center justify-center relative overflow-hidden border border-transparent dark:border-amber-500/20`}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-white/10 dark:bg-amber-500/5 backdrop-blur-sm"></div>
          
          {/* Main Camera Icon */}
          <Camera className={`${classes.camera} text-white dark:text-amber-100 relative z-10`} strokeWidth={2.5} />
          
          {/* AI Sparkle Indicator */}
          <div className="absolute top-0.5 right-0.5 z-20">
            <Sparkles
              className={`${classes.sparkle} text-yellow-300 dark:text-amber-400 drop-shadow-lg animate-pulse`}
              fill="currentColor"
            />
          </div>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${classes.text} font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-amber-400 dark:to-amber-200 bg-clip-text text-transparent leading-tight`}>
            SimAVI
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
            Smart Image Vision
          </p>
        </div>
      )}
    </div>
  );
}
