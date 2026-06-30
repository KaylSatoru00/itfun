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
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
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

  // Detect whether the real Fullscreen API is actually usable on this device.
  // iOS Safari exposes no requestFullscreen on regular elements at all.
  const supportsRealFullscreen = () => {
    const el = panelRef.current;
    return !!(
      el &&
      (el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen)
    );
  };

  const isTouchDevice = () =>
    typeof window !== "undefined" &&
    (("ontouchstart" in window) || navigator.maxTouchPoints > 0);

  useEffect(() => {
    const handleFsChange = () => {
      const fsActive = !!document.fullscreenElement;
      setIsFullscreen(fsActive);
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

  // Lock background scroll while pseudo-fullscreen is active (iOS fallback)
  useEffect(() => {
    if (isPseudoFullscreen) {
      const prevOverflow = document.body.style.overflow;
      const prevPosition = document.body.style.position;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.width = "";
      };
    }
  }, [isPseudoFullscreen]);

  const toggleFullscreen = async () => {
    const el = panelRef.current;
    if (!el) return;

    // --- Real Fullscreen API path (desktop/laptop + most Android browsers) ---
    if (supportsRealFullscreen()) {
      if (!document.fullscreenElement) {
        try {
          const request =
            el.requestFullscreen ||
            el.webkitRequestFullscreen ||
            el.mozRequestFullScreen ||
            el.msRequestFullscreen;
          await request.call(el);

          if (isTouchDevice() && screen.orientation?.lock) {
            try {
              await screen.orientation.lock("landscape");
            } catch (_) {
              // Some browsers reject this outside a user gesture or lack support — ignore
            }
          }
        } catch (err) {
          console.error("Fullscreen request failed:", err);
        }
      } else {
        await document.exitFullscreen();
      }
      return;
    }

    // --- CSS pseudo-fullscreen fallback (iOS Safari, no Fullscreen API) ---
    setIsPseudoFullscreen((prev) => !prev);
  };

  const useRotatedLayout = isPseudoFullscreen;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isPseudoFullscreen ? "flex-start" : "center",
        position: "relative",
        overflowX: "hidden",
        overflowY: isPseudoFullscreen ? "hidden" : "auto",
        padding: isPseudoFullscreen ? 0 : "76px 16px 24px",
        boxSizing: "border-box",
        background: `linear-gradient(135deg, ${COLORS.black} 0%, #1a0008 100%)`,
      }}
    >
      {/* Floating background blobs */}
      {!isPseudoFullscreen && (
        <>
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
        </>
      )}

      {/* Top row: Back button + Mute toggle, sits above the panel in normal flow */}
      {!isPseudoFullscreen && (
        <div
          style={{
            width: "100%",
            maxWidth: GAME_WIDTH,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            zIndex: 20,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.08)",
              color: COLORS.white,
              border: `1px solid ${COLORS.rose}55`,
              backdropFilter: "blur(8px)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={toggleMute}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              flexShrink: 0,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              color: COLORS.white,
              border: `1px solid ${COLORS.rose}55`,
              backdropFilter: "blur(8px)",
              cursor: "pointer",
            }}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      )}

      {/* Fixed-size game panel — stretches to fill screen in fullscreen mode.
          When isPseudoFullscreen is true (iOS fallback), the panel is taken
          out of normal flow, pinned to the viewport, and rotated 90deg so the
          16:10-ish game fills the phone screen in a forced "landscape" look
          even though the device itself is still physically in portrait. */}
      <div
        ref={panelRef}
        style={
          useRotatedLayout
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vh",
                height: "100vw",
                transform: "rotate(90deg) translateY(-100%)",
                transformOrigin: "top left",
                zIndex: 1000,
                overflow: "hidden",
                border: "none",
                borderRadius: 0,
                background: COLORS.black,
              }
            : {
                position: "relative",
                width: isFullscreen ? "100vw" : "min(960px, 96vw)",
                height: isFullscreen
                  ? "100vh"
                  : "min(600px, calc(min(960px, 96vw) * 0.625), 75vh)",
                borderRadius: isFullscreen ? 0 : 18,
                overflow: "hidden",
                border: isFullscreen ? "none" : `2px solid ${COLORS.red}`,
                boxShadow: isFullscreen
                  ? "none"
                  : `0 0 60px ${COLORS.red}40, 0 0 120px ${COLORS.maroon}20`,
                background: COLORS.black,
                flexShrink: 0,
              }
        }
      >
        <iframe
          ref={iframeRef}
          src="/games/quiz6/index.html"
          title="ITFun Quiz 6"
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
          title={
            isFullscreen || isPseudoFullscreen
              ? "Exit fullscreen"
              : "Enter fullscreen"
          }
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            zIndex: 1001,
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
          {isFullscreen || isPseudoFullscreen ? (
            <Minimize size={18} />
          ) : (
            <Maximize size={18} />
          )}
        </button>
      </div>
    </div>
  );
}