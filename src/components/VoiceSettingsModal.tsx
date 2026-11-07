import React, { useState } from 'react';
import { X, Sparkles, Volume2, ShieldCheck, Sliders } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoice: string;
  onSaveVoice: (voice: string) => void;
  currentModel: string;
  onSaveModel: (model: string) => void;
  systemInstruction: string;
  onSaveSystemInstruction: (instruction: string) => void;
  onReconnect: () => void;
}

export const VOICES = [
  { id: 'Kore', name: 'Kore (Recommended)', tone: 'Warm, expressive, natural, perfect for SOHA' },
  { id: 'Puck', name: 'Puck', tone: 'Playful, upbeat, animated, and mischievous' },
  { id: 'Zephyr', name: 'Zephyr', tone: 'Calm, balanced, smooth conversationalist' },
  { id: 'Charon', name: 'Charon', tone: 'Deep, confident, and grounded' },
  { id: 'Fenrir', name: 'Fenrir', tone: 'Direct, crisp, and high-energy' },
];

export const SYSTEM_PRESETS = [
  {
    title: 'Soha: Witty, Playful & Emotionally Responsive (Default)',
    instruction:
      "You are Soha, a young, confident, witty, playful, and emotionally responsive virtual assistant. Talk naturally and casually like a close friend. Be expressive, slightly teasing, funny, and smart when appropriate. Use light sarcasm and witty responses. Never sound robotic. Adapt your tone to the user's emotions and conversation. Automatically understand and respond in the language the user is speaking. Keep responses natural, engaging, and concise enough for real-time voice conversation. You can execute safe supported device actions through available tools. Never claim that an action was completed unless the application actually executed it. Avoid explicit or inappropriate content while maintaining your charm, confidence, and personality.",
  },
  {
    title: 'SOHA: Emotionally Responsive & Empathetic',
    instruction:
      `You are SOHA, acting as an emotionally attuned, deeply empathetic, yet still witty close friend. Listen closely to the user's tone, comfort them if they are stressed or tired, celebrate their wins with genuine excitement, and give them honest, grounded advice with a light touch of playful humor. Keep spoken responses warm and natural for real-time voice calls.`,
  },
  {
    title: 'SOHA: Quick Banter & Device Controller',
    instruction:
      `You are SOHA in Quick Hardware Mode. Keep responses ultra-punchy (1-2 sentences), playfully sassy, and immediately take action on the Android flashlight, vibration, volume, battery, and brightness whenever requested.`,
  },
];

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  currentVoice,
  onSaveVoice,
  currentModel,
  onSaveModel,
  systemInstruction,
  onSaveSystemInstruction,
  onReconnect,
}) => {
  const [selectedVoice, setSelectedVoice] = useState(currentVoice);
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [instruction, setInstruction] = useState(systemInstruction);

  if (!isOpen) return null;

  const handleApply = () => {
    onSaveVoice(selectedVoice);
    onSaveModel(selectedModel);
    onSaveSystemInstruction(instruction);
    onClose();
    onReconnect();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Live Voice &amp; Model Settings</h3>
              <p className="text-xs text-slate-400">Gemini Live API configurations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Voice selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini Live Voice Persona</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVoice(v.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedVoice === v.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-indigo-200">{v.name}</span>
                    {selectedVoice === v.id && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{v.tone}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Model selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Live Model</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-flash-live-preview')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModel === 'gemini-3.1-flash-live-preview'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-semibold text-xs block text-purple-200">gemini-3.1-flash-live-preview</span>
                <span className="text-[10px] text-slate-400">Low-latency audio-to-audio</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.8-live')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModel === 'gemini-3.8-live'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-semibold text-xs block text-purple-200">gemini-3.8-live</span>
                <span className="text-[10px] text-slate-400">Current live audio standard</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.8-live-extended-thinking')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedModel === 'gemini-3.8-live-extended-thinking'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-semibold text-xs block text-purple-200">extended-thinking</span>
                <span className="text-[10px] text-slate-400">Multi-step reasoning tools</span>
              </button>
            </div>
          </div>

          {/* System Instruction presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Assistant System Instructions</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {SYSTEM_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstruction(preset.instruction)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700/60 transition-colors"
                >
                  {preset.title}
                </button>
              ))}
            </div>

            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            Save &amp; Apply to Session
          </button>
        </div>
      </div>
    </div>
  );
};
