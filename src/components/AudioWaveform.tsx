import React, { useEffect, useRef } from 'react';
import { LiveConnectionState } from '../hooks/useGeminiLive';
import { Mic, Volume2, Radio, Sparkles } from 'lucide-react';

interface AudioWaveformProps {
  connectionState: LiveConnectionState;
  userRms: number;
  modelRms: number;
  inputAnalyser: AnalyserNode | null;
  outputAnalyser: AnalyserNode | null;
  selectedVoice: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  connectionState,
  userRms,
  modelRms,
  inputAnalyser,
  outputAnalyser,
  selectedVoice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const inputDataArray = new Uint8Array(inputAnalyser ? inputAnalyser.frequencyBinCount : 64);
    const outputDataArray = new Uint8Array(outputAnalyser ? outputAnalyser.frequencyBinCount : 64);

    const render = () => {
      phase += 0.04;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Collect frequency data if available
      if (inputAnalyser) {
        inputAnalyser.getByteFrequencyData(inputDataArray);
      }
      if (outputAnalyser) {
        outputAnalyser.getByteFrequencyData(outputDataArray);
      }

      const isUserSpeaking = userRms > 0.03;
      const isModelSpeaking = connectionState === 'speaking' || modelRms > 0.03;
      const isConnected = connectionState === 'listening' || connectionState === 'speaking';

      // Draw background ambient grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw horizontal baseline
      const midY = height / 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Draw waveform waves
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();

        let strokeColor = 'rgba(99, 102, 241, 0.2)'; // indigo default
        let waveHeight = 6;

        if (isModelSpeaking) {
          // Gemini speaking: vibrant violet/fuchsia/cyan wave
          strokeColor =
            w === 0
              ? 'rgba(168, 85, 247, 0.85)'
              : w === 1
              ? 'rgba(236, 72, 153, 0.7)'
              : 'rgba(56, 189, 248, 0.6)';
          waveHeight = 25 + modelRms * 90;
        } else if (isUserSpeaking) {
          // User speaking: emerald/teal wave
          strokeColor =
            w === 0
              ? 'rgba(16, 185, 129, 0.85)'
              : w === 1
              ? 'rgba(45, 212, 191, 0.7)'
              : 'rgba(59, 130, 246, 0.6)';
          waveHeight = 20 + userRms * 80;
        } else if (isConnected) {
          // Idle breathing wave
          strokeColor = `rgba(129, 140, 248, ${0.25 - w * 0.06})`;
          waveHeight = 8 + Math.sin(phase * 1.5 + w) * 4;
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = w === 0 ? 3 : 1.5;

        for (let x = 0; x < width; x += 4) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI); // Pin ends to zero
          const freqMultiplier = 3 + w;
          const offsetPhase = phase * (1.2 + w * 0.3);

          const y =
            midY +
            Math.sin(normX * Math.PI * freqMultiplier + offsetPhase) * waveHeight * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [connectionState, userRms, modelRms, inputAnalyser, outputAnalyser]);

  // Determine active aura orb styling
  const isSpeaking = connectionState === 'speaking' || modelRms > 0.05;
  const isListening = connectionState === 'listening' || userRms > 0.05;

  let orbGlowClass = 'bg-slate-800/80 border-slate-700 shadow-slate-900/40 text-slate-400';
  let pulseScale = 1;

  if (isSpeaking) {
    orbGlowClass =
      'bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-500 border-purple-400 shadow-[0_0_50px_rgba(168,85,247,0.6)] text-white';
    pulseScale = 1 + Math.min(0.25, modelRms * 0.5);
  } else if (isListening) {
    orbGlowClass =
      'bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 border-teal-300 shadow-[0_0_50px_rgba(20,184,166,0.6)] text-white';
    pulseScale = 1 + Math.min(0.25, userRms * 0.5);
  } else if (connectionState === 'connecting') {
    orbGlowClass =
      'bg-gradient-to-tr from-amber-600 to-indigo-600 border-amber-400 animate-pulse text-white';
  }

  return (
    <div className="relative w-full rounded-2xl bg-slate-950/70 border border-slate-800/80 p-6 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Top status bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connectionState === 'speaking'
                ? 'bg-purple-400 animate-ping'
                : connectionState === 'listening'
                ? 'bg-emerald-400 animate-pulse'
                : connectionState === 'connecting'
                ? 'bg-amber-400 animate-spin'
                : 'bg-slate-500'
            }`}
          />
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
            {connectionState === 'speaking'
              ? 'Gemini Live Speaking'
              : connectionState === 'listening'
              ? 'Listening (Full-Duplex)'
              : connectionState === 'connecting'
              ? 'Connecting to Gemini Live...'
              : 'Standby / Tap to Start'}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Voice: {selectedVoice}</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded-full bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono">16kHz In / 24kHz Out</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Waveform */}
      <div className="relative h-44 w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={176}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Central Pulsating Orb */}
        <div
          className={`relative z-10 w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center transition-transform duration-100 ease-out ${orbGlowClass}`}
          style={{ transform: `scale(${pulseScale})` }}
        >
          {isSpeaking ? (
            <>
              <Volume2 className="w-8 h-8 animate-bounce" />
              <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">SOHA</span>
            </>
          ) : isListening ? (
            <>
              <Mic className="w-8 h-8 animate-pulse text-white" />
              <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">Listening</span>
            </>
          ) : (
            <>
              <Sparkles className="w-7 h-7 text-indigo-300 opacity-80" />
              <span className="text-[9px] font-medium tracking-wide uppercase mt-0.5">SOHA</span>
            </>
          )}

          {/* Ripple rings when active */}
          {(isSpeaking || isListening) && (
            <div className="absolute inset-0 rounded-full border border-current opacity-40 animate-ping" />
          )}
        </div>
      </div>

      {/* Volume VU meters bottom indicator */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center space-x-1">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>Microphone Input</span>
            </span>
            <span className="font-mono text-emerald-400">{Math.round(userRms * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
              style={{ width: `${Math.min(100, userRms * 150)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center space-x-1">
              <Volume2 className="w-3 h-3 text-purple-400" />
              <span>Gemini Output Voice</span>
            </span>
            <span className="font-mono text-purple-400">{Math.round(modelRms * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-75"
              style={{ width: `${Math.min(100, modelRms * 150)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
