"use client";

import { useEffect, useState } from "react";

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void;
  isPageLoaded: boolean;
}

export default function SoundToggle({
  isMuted,
  onToggle,
  isPageLoaded,
}: SoundToggleProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Delay entrance until after the loading screen is dismissed
  useEffect(() => {
    if (isPageLoaded) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isPageLoaded]);

  if (!isVisible) return null;

  return (
    <button
      onClick={onToggle}
      aria-label={isMuted ? "Enable ambient sound" : "Mute ambient sound"}
      className="sound-toggle-btn"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 40,
        width: "3rem",
        height: "3rem",
        borderRadius: "50%",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        background: "rgba(8, 9, 7, 0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isMuted
          ? "0 4px 20px rgba(0, 0, 0, 0.4)"
          : "0 4px 20px rgba(241, 230, 195, 0.15), 0 0 40px rgba(241, 230, 195, 0.05)",
        animation: "soundToggleFadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        opacity: 0,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          color: isMuted ? "rgba(255, 255, 255, 0.4)" : "#F1E6C3",
          transition: "color 0.3s ease",
        }}
      >
        {/* Speaker body */}
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />

        {isMuted ? (
          /* Muted — slash line */
          <line x1="23" y1="9" x2="17" y2="15" />
        ) : (
          /* Unmuted — sound waves */
          <>
            <path
              d="M15.54 8.46a5 5 0 0 1 0 7.07"
              style={{
                animation: "soundWave1 1.5s ease-in-out infinite",
              }}
            />
            <path
              d="M19.07 4.93a10 10 0 0 1 0 14.14"
              style={{
                animation: "soundWave2 1.5s ease-in-out infinite 0.2s",
              }}
            />
          </>
        )}
      </svg>

      <style jsx>{`
        @keyframes soundToggleFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes soundWave1 {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        @keyframes soundWave2 {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }

        .sound-toggle-btn:hover {
          border-color: rgba(241, 230, 195, 0.3) !important;
          transform: scale(1.08);
        }

        .sound-toggle-btn:active {
          transform: scale(0.95);
        }
      `}</style>
    </button>
  );
}
