import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Volume2, VolumeX, ArrowLeft, Maximize, Minimize } from "lucide-react";

// Brand palette
const COLORS = {
  red: "#C8102E",
  pink: "#F2D7D5",
  rose: "#EAB8C9",
  black: "#000000",
  maroon: "#A50034",
  white: "#FFFFFF",
};

const GAME_WIDTH = 960;
const GAME_HEIGHT = 600;

export default function Gamified6() {
  const navigate = useNavigate();
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);
  const panelRef = useRef(null);

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "SET_MUTE", value: next },
          "*"
        );
      }
      return next;
    });
  };

  useEffect(() => {
    const handleFsChange = () => {
      const fsActive = !!document.fullscreenElement;
      setIsFullscreen(fsActive);
      // Release the orientation lock once we exit fullscreen
      if (!fsActive && screen.orientation?.unlock) {
        try {
          screen.orientation.unlock();
        } catch (_) {
          // no-op
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = panelRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      try {
        await el.requestFullscreen();
        // On mobile, force landscape once fullscreen is active
        if (screen.orientation?.lock) {
          try {
            await screen.orientation.lock("landscape");
          } catch (_) {
            // Orientation lock isn't supported/allowed on this device — ignore
          }
        }
      } catch (err) {
        console.error("Fullscreen request failed:", err);
      }
    } else {
      await document.exitFullscreen();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${COLORS.black} 0%, #1a0008 100%)`,
      }}
    >
      {/* Floating background blobs */}
      <div
        style={{
          position: "absolute",
          top: -150,
          left: -150,
          width: 384,
          height: 384,
          borderRadius: "50%",
          background: COLORS.red,
          opacity: 0.2,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -150,
          right: -150,
          width: 384,
          height: 384,
          borderRadius: "50%",
          background: COLORS.maroon,
          opacity: 0.2,
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 9999,
          background: "rgba(255,255,255,0.08)",
          color: COLORS.white,
          border: `1px solid ${COLORS.rose}55`,
          backdropFilter: "blur(8px)",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          color: COLORS.white,
          border: `1px solid ${COLORS.rose}55`,
          backdropFilter: "blur(8px)",
          cursor: "pointer",
        }}
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Fixed-size game panel — stretches to fill screen in fullscreen mode */}
      <div
        ref={panelRef}
        style={{
          position: "relative",
          width: isFullscreen ? "100vw" : GAME_WIDTH,
          height: isFullscreen ? "100vh" : GAME_HEIGHT,
          maxWidth: isFullscreen ? "100vw" : "95vw",
          borderRadius: isFullscreen ? 0 : 18,
          overflow: "hidden",
          border: isFullscreen ? "none" : `2px solid ${COLORS.red}`,
          boxShadow: isFullscreen ? "none" : `0 0 60px ${COLORS.red}40, 0 0 120px ${COLORS.maroon}20`,
          background: COLORS.black,
        }}
      >
        <iframe
          ref={iframeRef}
          src="/games/quiz6/index.html"
          title="ITFun Quiz 6"
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          scrolling="no"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            border: "0",
          }}
          allow="autoplay; fullscreen"
          allowFullScreen
        />

        {/* Fullscreen toggle — bottom-right corner, inside fullscreen mode too */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "rgba(0,0,0,0.55)",
            color: COLORS.white,
            border: `1px solid ${COLORS.rose}55`,
            backdropFilter: "blur(6px)",
            cursor: "pointer",
          }}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </div>
  );
}