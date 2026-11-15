import { useState, useEffect, useRef } from "react";

const API_BASE = "https://fakelivetv.onrender.com";

export default function App() {
  const [withAds, setWithAds] = useState(null);
  const [nowData, setNowData] = useState(null);
  const [remainingSec, setRemainingSec] = useState(0);
  const [progressPct, setProgressPct] = useState(0);

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const timeoutRef = useRef(null);
  const endTimeRef = useRef(0);
  const durationRef = useRef(1);

  const syncWithServer = async (adsMode) => {
    try {
      const fetchStart = performance.now();
      const res = await fetch(`${API_BASE}/now?ads=${adsMode}`);
      const data = await res.json();

      // Compensate for network request latency
      const networkDelaySec = (performance.now() - fetchStart) / 1000;
      const exactOffset = data.offsetSeconds + networkDelaySec;
      const exactRemaining = Math.max(
        0,
        data.remainingSeconds - networkDelaySec,
      );

      setNowData(data);

      // Lock countdown to exact wall-clock timestamp so all tabs match 100%
      endTimeRef.current = Date.now() + exactRemaining * 1000;
      durationRef.current = data.item.durationSeconds || 1;
      setRemainingSec(Math.ceil(exactRemaining));

      const video = videoRef.current;
      if (video) {
        const targetUrl = data.item.url.startsWith("http")
          ? data.item.url
          : `${window.location.origin}${data.item.url}`;
        video.muted = false; // Always unmuted — user controls volume on their device

        if (video.src !== targetUrl) {
          video.pause();
          video.src = targetUrl;
          video.load(); // Forces the browser to reset and load new stream

          // Wait until browser metadata and frame are ready before jumping and playing
          video.onloadedmetadata = () => {
            video.currentTime = exactOffset;
            video.play().catch((err) => console.log("Playback start:", err));
          };
        } else {
          const drift = Math.abs(video.currentTime - exactOffset);
          if (drift > 0.75) {
            video.currentTime = exactOffset;
          }
          if (video.paused) {
            video.play().catch((err) => console.log("Resume:", err));
          }
        }
      }

      // Schedule exact switch when current slice or ad ends
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => {
          syncWithServer(adsMode);
        },
        exactRemaining * 1000 + 80,
      );
    } catch (err) {
      console.error("Failed to sync with server:", err);
    }
  };

  // 1. Background heartbeat sync with server every 8 seconds
  useEffect(() => {
    if (withAds === null) return;

    syncWithServer(withAds);

    const syncInterval = setInterval(() => {
      syncWithServer(withAds);
    }, 8000);

    return () => {
      clearInterval(syncInterval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [withAds]);

  // 2. High-precision 200ms wall-clock ticker for countdown & progress bar
  useEffect(() => {
    if (withAds === null) return;

    const ticker = setInterval(() => {
      if (!endTimeRef.current) return;
      const msLeft = Math.max(0, endTimeRef.current - Date.now());
      const secLeft = Math.ceil(msLeft / 1000);
      setRemainingSec(secLeft);

      const totalMs = durationRef.current * 1000;
      const elapsedMs = Math.max(0, totalMs - msLeft);
      const pct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
      setProgressPct(pct);
    }, 200);

    return () => clearInterval(ticker);
  }, [withAds]);

  // Helper to format seconds nicely (e.g. "45s" or "9m 12s")
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const toggleFullScreen = () => {
    const elem = playerContainerRef.current;
    if (!elem) return;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // ================= SCREEN 1: CINEMA LANDING PAGE =================
  if (withAds === null) {
    return (
      <div className="landing-wrapper">
        <style>{cssStyles}</style>
        <div className="ambient-glow" />
        <div className="landing-content">
          <div className="live-pill-landing">
            <span className="pulse-dot" /> GLOBAL LIVE BROADCAST
          </div>
          <h2 className="hero-title">CinemaStream Live</h2>
          <p className="hero-subtitle">
            Real-time synchronized movie broadcast. Every viewer is watching the
            exact same frame right now. Select your stream to tune in:
          </p>

          <div className="cards-grid">
            <div
              className="stream-card ad-card"
              onClick={() => setWithAds(true)}
            >
              <div className="card-badge">FREE BROADCAST</div>
              <h2>Standard TV Stream</h2>
              <p>
                Live movie broadcast with short commercial breaks every 10
                minutes.
              </p>
              <div className="card-cta">Tune In Live →</div>
            </div>

            <div
              className="stream-card noad-card"
              onClick={() => setWithAds(false)}
            >
              <div className="card-badge pro-badge">NON-STOP</div>
              <h2>Ad-Free Cinema</h2>
              <p>
                Uninterrupted back-to-back live movie marathon without
                commercial breaks.
              </p>
              <div className="card-cta">Tune In Live →</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdPlaying = nowData?.item.type === "AD";

  // ================= SCREEN 2: LIVE BROADCAST TV =================
  return (
    <div className="tv-wrapper">
      <style>{cssStyles}</style>
      <div
        className={`ambient-backdrop ${isAdPlaying ? "ad-glow" : "movie-glow"}`}
      />

      <div className="broadcast-container">
        {/* Top Broadcast Header */}
        <header className="tv-header">
          <div className="header-left">
            <div className="live-badge">
              <span className="pulse-dot" /> LIVE
            </div>
            <div className="title-stack">
              <span className="channel-label">
                {isAdPlaying ? "COMMERCIAL BREAK" : "NOW BROADCASTING"}
              </span>
              <h1 className="playing-title">
                {nowData
                  ? nowData.item.title
                  : "Connecting to satellite feed..."}
              </h1>
            </div>
          </div>

          {isAdPlaying && (
            <div className="ad-countdown-pill">
              Movie resumes in <strong>{remainingSec}s</strong>
            </div>
          )}
        </header>

        {/* Locked Live Video Screen */}
        <div
          ref={playerContainerRef}
          className="video-stage"
          onDoubleClick={toggleFullScreen}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            disablePictureInPicture
            controlsList="nodownload noplaybackrate"
            onContextMenu={(e) => e.preventDefault()}
            className="live-video"
          />

          {/* Top-Right Watermark + Fullscreen trigger on hover */}
          <div className="screen-overlay">
            <div className="tv-watermark">CINEMASTREAM ● LIVE</div>
            <button
              className="fullscreen-btn"
              onClick={toggleFullScreen}
              title="Toggle Fullscreen (or double-click video)"
            >
              ⛶
            </button>
          </div>

          {/* Live Progress Line along the bottom edge of the video */}
          <div className="progress-track">
            <div
              className={`progress-fill ${isAdPlaying ? "fill-ad" : "fill-movie"}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Bottom Up-Next Broadcast Ticker */}
        {nowData && (
          <footer className="upnext-bar">
            <div className="upnext-left">
              <span className="audio-indicator">
                <span className="bar b1" />
                <span className="bar b2" />
                <span className="bar b3" />
              </span>
              <span className="audio-text">
                Live Audio Active — Use device volume keys to adjust
              </span>
            </div>

            <div className="upnext-right">
              <span className="upnext-label">
                {nowData.next.type === "AD"
                  ? "NEXT COMMERCIAL BREAK"
                  : "UP NEXT"}
              </span>
              <span className="upnext-title">{nowData.next.title}</span>
              <span className="upnext-timer">{formatTime(remainingSec)}</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

const cssStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none;
  }

  body {
    background-color: #05070d;
    color: #f8fafc;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow-x: hidden;
  }

  /* Landing Screen */
  .landing-wrapper {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    background: radial-gradient(circle at 50% 20%, #111827 0%, #05070d 75%);
  }

  .ambient-glow {
    position: absolute;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(239, 68, 68, 0.14) 0%, transparent 70%);
    top: 5%;
    pointer-events: none;
    filter: blur(60px);
  }

  .landing-content {
    max-width: 820px;
    width: 100%;
    text-align: center;
    z-index: 2;
  }

  .live-pill-landing {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #f87171;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 1.2px;
    margin-bottom: 1.25rem;
  }

  .hero-title {
    font-size: 3.2rem;
    font-weight: 800;
    letter-spacing: -1px;
    background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.75rem;
  }

  .hero-subtitle {
    color: #94a3b8;
    font-size: 1.05rem;
    max-width: 560px;
    margin: 0 auto 2.5rem auto;
    line-height: 1.6;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
    gap: 1.5rem;
  }

  .stream-card {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 2rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .stream-card:hover {
    transform: translateY(-6px);
    border-color: rgba(255, 255, 255, 0.25);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  }

  .ad-card:hover {
    box-shadow: 0 20px 45px rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.5);
  }

  .noad-card:hover {
    box-shadow: 0 20px 45px rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.5);
  }

  .card-badge {
    display: inline-block;
    align-self: flex-start;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.8px;
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    margin-bottom: 1rem;
  }

  .pro-badge {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
  }

  .stream-card h2 {
    font-size: 1.5rem;
    margin-bottom: 0.6rem;
    color: #fff;
  }

  .stream-card p {
    color: #94a3b8;
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 1.75rem;
  }

  .card-cta {
    font-weight: 700;
    font-size: 0.95rem;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Broadcast Player Screen */
  .tv-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.25rem 1.5rem;
    position: relative;
    background-color: #05070d;
  }

  .ambient-backdrop {
    position: fixed;
    inset: 0;
    pointer-events: none;
    transition: background 1s ease;
    z-index: 0;
  }

  .movie-glow {
    background: radial-gradient(circle at 50% 45%, rgba(37, 99, 235, 0.14) 0%, transparent 70%);
  }

  .ad-glow {
    background: radial-gradient(circle at 50% 45%, rgba(245, 158, 11, 0.16) 0%, transparent 70%);
  }

  .broadcast-container {
    width: 100%;
    max-width: 1060px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tv-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.25rem;
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    backdrop-filter: blur(12px);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 800;
    font-size: 0.8rem;
    letter-spacing: 1px;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.45);
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    background-color: #fff;
    border-radius: 50%;
    display: inline-block;
    animation: pulse 1.4s infinite ease-in-out;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.35); opacity: 0.45; }
  }

  .title-stack {
    display: flex;
    flex-direction: column;
  }

  .channel-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: #94a3b8;
  }

  .playing-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #ffffff;
  }

  .ad-countdown-pill {
    background: rgba(245, 158, 11, 0.16);
    border: 1px solid rgba(245, 158, 11, 0.4);
    color: #fbbf24;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 0.88rem;
  }

  /* Video Stage */
  .video-stage {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .live-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none; /* Prevents clicking video to pause */
  }

  .screen-overlay {
    position: absolute;
    inset: 0;
    padding: 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    opacity: 0;
    transition: opacity 0.25s ease;
  }

  .video-stage:hover .screen-overlay {
    opacity: 1;
  }

  .tv-watermark {
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 1.2px;
    color: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  .fullscreen-btn {
    background: rgba(15, 23, 42, 0.75);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    width: 38px;
    height: 38px;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(6px);
    transition: transform 0.15s ease, background 0.15s ease;
  }

  .fullscreen-btn:hover {
    background: rgba(30, 41, 59, 0.95);
    transform: scale(1.06);
  }

  /* Bottom Edge Progress Bar */
  .progress-track {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.12);
  }

  .progress-fill {
    height: 100%;
    transition: width 0.2s linear;
  }

  .fill-movie {
    background: linear-gradient(90deg, #ef4444, #f97316);
  }

  .fill-ad {
    background: linear-gradient(90deg, #f59e0b, #fde047);
  }

  /* Footer Broadcast Ticker */
  .upnext-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.9rem 1.25rem;
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    backdrop-filter: blur(12px);
  }

  .upnext-left {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .audio-indicator {
    display: inline-flex;
    align-items: flex-end;
    gap: 3px;
    height: 14px;
  }

  .audio-indicator .bar {
    width: 3px;
    background: #22c55e;
    border-radius: 2px;
    animation: eq 0.9s infinite ease-in-out;
  }

  .audio-indicator .b1 { height: 60%; animation-delay: 0s; }
  .audio-indicator .b2 { height: 100%; animation-delay: 0.2s; }
  .audio-indicator .b3 { height: 45%; animation-delay: 0.4s; }

  @keyframes eq {
    0%, 100% { height: 35%; }
    50% { height: 100%; }
  }

  .upnext-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .upnext-label {
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 1px;
    color: #64748b;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 8px;
    border-radius: 5px;
  }

  .upnext-title {
    font-weight: 700;
    color: #e2e8f0;
    font-size: 0.95rem;
  }

  .upnext-timer {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.35);
    color: #60a5fa;
    font-weight: 800;
    font-size: 0.85rem;
    padding: 4px 10px;
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
  }
`;
