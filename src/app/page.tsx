"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const videoConstraints = { width: 640, height: 480, facingMode: "user" };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function processImage(
  dataUrl: string
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 150;
      canvas.height = 150;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No se pudo obtener el contexto");

      ctx.drawImage(img, 0, 0, 150, 150);

      const imageData = ctx.getImageData(0, 0, 150, 150);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        d[i] = d[i + 1] = d[i + 2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);

      const grayDataUrl = canvas.toDataURL("image/jpeg");

      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, dataUrl: grayDataUrl });
          else reject("No se pudo generar el blob");
        },
        "image/jpeg",
        /* quality = */ 0.9
      );
    };
    img.onerror = (e) => reject(e);
  });
}

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    setLoading(true);
    try {
      const { blob, dataUrl } = await processImage(screenshot);

      setCaptured(dataUrl);

      const form = new FormData();
      form.append("file", blob, "capture_gray.jpg");

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { predicted_class } = await res.json();
      setMood(predicted_class);
    } catch (err) {
      console.error(err);
      alert("Error al procesar o predecir la emoción");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const reset = () => {
    setCaptured(null);
    setMood(null);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="backdrop-blur-sm bg-gray-700/50 rounded-2xl shadow-2xl p-8 w-96 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold text-gray-200">
          Detector de Emociones
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
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Analizando…" : "Tomar foto"}
          </button>
          {captured && (
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
            >
              Reiniciar
            </button>
          )}
        </div>

        {mood && (
          <div className="px-4 py-2 bg-gray-600/40 rounded-full">
            <span className="text-lg font-medium text-gray-100">{mood}</span>
          </div>
        )}
      </div>
    </main>
  );
}
