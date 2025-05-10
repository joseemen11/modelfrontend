"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setCaptured(imageSrc);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });
      const data = await res.json();
      setMood(data.mood);
    } catch {
      setMood("Error 😕");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="backdrop-blur-sm bg-gray-700/50 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center gap-6">
       
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 tracking-wider">
          Modelo
        </h1>

      
        <div className="w-80 h-60 bg-black rounded-lg overflow-hidden ring-2 ring-gray-500/40">
          {captured ? (
            <img
              src={captured}
              alt="captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        
        <div className="flex gap-4">
          <button
            onClick={capture}
            disabled={loading}
            className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? "Analizando…" : "Tomar foto"}
          </button>
          {captured && (
            <button
              onClick={() => {
                setCaptured(null);
                setMood(null);
              }}
              className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md transition-colors hover:bg-gray-500 active:bg-gray-700"
            >
              Reiniciar
            </button>
          )}
        </div>

      
        {mood && (
          <div className="mt-4 px-4 py-2 bg-gray-600/30 rounded-full flex items-center gap-2 shadow-inner">
            
            <span className="text-lg font-medium text-gray-100">{mood}</span>
          </div>
        )}
      </div>
    </main>
  );
}
