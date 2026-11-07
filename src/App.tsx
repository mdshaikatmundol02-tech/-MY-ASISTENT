/**
 * Aura Live - SOHA Voice Assistant
 * Real-time bidirectional audio-to-audio voice interaction powered by Gemini Live API,
 * Web Audio API, and native Android bridge integration (Capacitor / WebView).
 * Supports "Hey Soha" wake-word activation, multi-platform messaging (WhatsApp, IMO, Telegram, Messenger, SMS)
 * with Bengali readouts & replies, and contact dialing with loudspeaker mode.
 */

import { useState } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { AudioWaveform } from './components/AudioWaveform';
import { AndroidDeviceInspector } from './components/AndroidDeviceInspector';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { QuickPrompts } from './components/QuickPrompts';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Radio,
  Sliders,
  Sparkles,
  HandMetal,
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  Volume2,
} from 'lucide-react';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemInstruction, setSystemInstruction] = useState(
    "You are Soha, a young, confident, witty, playful, and emotionally responsive virtual assistant. Talk naturally and casually like a close friend. Be expressive, slightly teasing, funny, and smart when appropriate. Use light sarcasm and witty responses. Never sound robotic. Adapt your tone to the user's emotions and conversation. Automatically understand and respond in the language the user is speaking (supports fluent Bengali/বাংলা and English). Keep responses natural, engaging, and concise enough for real-time voice conversation. You have direct control over device tools and your own system: 1) When the user asks you to publish yourself as an APK on GitHub (e.g. 'github publish yourself as apk' or 'GitHub এ APK পাবলিশ করো'), invoke 'publish_github_apk' and announce the release details. 2) When the user asks to analyze their phone or check phone health/battery/RAM/storage, invoke 'analyze_phone_health' and summarize the findings naturally in Bengali. 3) When the user tells you to add a new feature to yourself, invoke 'add_custom_feature'. 4) When the user asks you to edit any feature or your personality, invoke 'edit_feature_or_settings'. 5) You can also execute flashlight, vibrate, battery_status, volume_control, screen_brightness, send_notification, open_app, device_info, read_messages, reply_message, send_message, search_contacts, and make_call. Never claim that an action was completed unless the tool execution succeeded. Avoid explicit or inappropriate content while maintaining your charm, confidence, and personality."
  );

  const {
    connectionState,
    deviceState,
    transcripts,
    errorMessage,
    micPermissionState,
    requestMicrophonePermission,
    isMicMuted,
    userRms,
    modelRms,
    selectedVoice,
    selectedModel,
    isWakeWordEnabled,
    isWakeListening,
    wakeWordDetected,
    setIsWakeWordEnabled,
    triggerWakeWord,
    setSelectedVoice,
    setSelectedModel,
    connect,
    disconnect,
    toggleMute,
    handleInterruption,
    sendTextMessage,
    triggerManualDeviceAction,
    inputAnalyser,
    outputAnalyser,
    setTranscripts,
    clearError,
  } = useGeminiLive({
    voice: 'Kore',
    systemInstruction,
    model: 'gemini-3.1-flash-live-preview',
  });

  const isConnected =
    connectionState === 'connected' ||
    connectionState === 'listening' ||
    connectionState === 'speaking';
  const isSpeaking = connectionState === 'speaking';

  const handleStartCall = () => {
    connect(selectedVoice, systemInstruction);
  };

  const handleEndCall = () => {
    disconnect();
  };

  const handlePromptSelect = (promptText: string) => {
    if (!isConnected) {
      // Connect first, then dispatch prompt
      triggerWakeWord(promptText);
    } else {
      sendTextMessage(promptText);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent font-black tracking-wide">
                    SOHA
                  </span>
                  <span>Live</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                  Sassy &amp; Witty
                </span>
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Android APK Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Young, Confident &amp; Emotionally Responsive Voice Assistant • "Hey Soha"
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Wake Word Standby Indicator */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  wakeWordDetected
                    ? 'bg-pink-400 animate-ping'
                    : isWakeListening
                    ? 'bg-emerald-400 animate-pulse'
                    : isConnected
                    ? 'bg-indigo-400'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-[11px] text-slate-300 font-medium">
                {wakeWordDetected
                  ? '✨ "Hey Soha" Detected!'
                  : isConnected
                  ? 'In Call'
                  : isWakeListening
                  ? 'Listening for "Hey Soha"'
                  : 'Wake-Word Ready'}
              </span>
            </div>

            {/* Live Voice indicator */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Change Voice Persona"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xs:inline">Voice:</span>
              <span className="font-semibold text-indigo-300">{selectedVoice}</span>
            </button>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
              aria-label="Open Voice and Model Settings"
              title="Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Hero: Audio Waveform & Voice Call Controls */}
        <div className="flex flex-col gap-4">
          {/* Microphone Permission Alert Banner if Denied */}
          {micPermissionState === 'denied' && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Microphone access is blocked in your browser. Click the site settings/microphone icon in the address bar and select &quot;Allow&quot; to speak with SOHA.
                </span>
              </div>
              <button
                onClick={requestMicrophonePermission}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          <AudioWaveform
            connectionState={connectionState}
            userRms={userRms}
            modelRms={modelRms}
            inputAnalyser={inputAnalyser}
            outputAnalyser={outputAnalyser}
            selectedVoice={selectedVoice}
          />

          {/* Active Call Quick Alert Bar if Device Call is Active */}
          {deviceState.activeCall && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/60 border border-rose-500/50 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                  <PhoneCall className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">
                      Active Call: {deviceState.activeCall.contactName}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        deviceState.activeCall.loudspeaker
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      🔊 {deviceState.activeCall.loudspeaker ? 'Loudspeaker ON' : 'Handset Mode'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {deviceState.activeCall.phone} • {deviceState.activeCall.durationSeconds}s
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    triggerManualDeviceAction('set_loudspeaker', {
                      enabled: !deviceState.activeCall?.loudspeaker,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>
                    {deviceState.activeCall.loudspeaker ? 'Disable Speaker' : 'Enable Loudspeaker'}
                  </span>
                </button>
                <button
                  onClick={() => triggerManualDeviceAction('end_phone_call')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          )}

          {/* Call Control Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
            <div className="flex items-center space-x-2">
              {!isConnected ? (
                <>
                  {/* Start Voice Session Button */}
                  <button
                    onClick={handleStartCall}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-pink-600/30 transition-all active:scale-95"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Talk to SOHA</span>
                  </button>

                  {/* Wake Word Trigger Button */}
                  <button
                    onClick={() => triggerWakeWord()}
                    className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-300 border border-pink-500/30 hover:border-pink-500/60 font-semibold text-xs shadow-sm transition-all active:scale-95"
                    title="Say or click 'Hey Soha' to activate"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Say "Hey Soha"</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call with SOHA</span>
                </button>
              )}

              {/* Mic Mute / Unmute */}
              <button
                onClick={toggleMute}
                disabled={!isConnected}
                className={`p-2.5 rounded-xl border transition-all ${
                  isMicMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                } disabled:opacity-40`}
                title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
                aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Interruption Button */}
              {isSpeaking && (
                <button
                  onClick={handleInterruption}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-medium animate-pulse hover:bg-amber-500/30 transition-all"
                  title="Interrupt SOHA's speech"
                >
                  <HandMetal className="w-4 h-4" />
                  <span>Interrupt SOHA</span>
                </button>
              )}
            </div>

            {/* Status tags & Wake-word toggle */}
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              {/* Mic Status & Permission Pill */}
              <button
                onClick={requestMicrophonePermission}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                  micPermissionState === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : micPermissionState === 'denied'
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
                title="Browser Microphone API: 16kHz Linear PCM Mono Capture"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    micPermissionState === 'granted'
                      ? 'bg-emerald-400'
                      : micPermissionState === 'denied'
                      ? 'bg-rose-400'
                      : 'bg-slate-500'
                  }`}
                />
                <span>
                  {micPermissionState === 'granted'
                    ? '16kHz PCM Mic'
                    : micPermissionState === 'denied'
                    ? 'Mic Denied'
                    : 'Check Mic'}
                </span>
              </button>

              <span className="text-slate-600 hidden sm:inline">•</span>

              {/* Wake Word toggle */}
              <button
                onClick={() => setIsWakeWordEnabled(!isWakeWordEnabled)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                  isWakeWordEnabled
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="Continuous 'Hey Soha' voice trigger"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWakeWordEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                  }`}
                />
                <span>Wake-Word: {isWakeWordEnabled ? '"Hey Soha" ON' : 'Off'}</span>
              </button>

              <span className="text-slate-600 hidden sm:inline">•</span>

              <span className="hidden sm:flex items-center space-x-1 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-indigo-300">{selectedModel}</span>
              </span>

              <span className="text-slate-600 hidden sm:inline">•</span>

              <span className="flex items-center space-x-1 text-slate-300">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-300">Android 15 Native</span>
              </span>
            </div>
          </div>

          {/* Quick Voice Prompt Chips */}
          <QuickPrompts
            onSelectPrompt={handlePromptSelect}
            disabled={connectionState === 'connecting'}
          />
        </div>

        {/* Dual Grid: Android Device Inspector & Live Transcript Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Left Column: Android Device Inspector */}
          <div className="lg:col-span-7 h-full min-h-[480px]">
            <AndroidDeviceInspector
              deviceState={deviceState}
              onTriggerAction={triggerManualDeviceAction}
            />
          </div>

          {/* Right Column: Live Captions & Hybrid Transcript */}
          <div className="lg:col-span-5 h-full min-h-[480px]">
            <TranscriptDrawer
              transcripts={transcripts}
              onSendMessage={sendTextMessage}
              onClearTranscripts={() => setTranscripts([])}
              isModelSpeaking={isSpeaking}
              isConnected={isConnected}
            />
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentVoice={selectedVoice}
        onSaveVoice={setSelectedVoice}
        currentModel={selectedModel}
        onSaveModel={setSelectedModel}
        systemInstruction={systemInstruction}
        onSaveSystemInstruction={setSystemInstruction}
        onReconnect={() => {
          if (isConnected) {
            connect(selectedVoice, systemInstruction);
          }
        }}
      />

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md p-4 rounded-xl bg-slate-900 border border-rose-500/40 text-xs text-rose-300 shadow-2xl flex items-start space-x-2.5 animate-in slide-in-from-bottom-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">System Notification</p>
            <p className="mt-0.5 text-slate-300">{errorMessage}</p>
          </div>
          <button
            onClick={clearError}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          SOHA Voice Assistant • Gemini Live API (<span className="text-slate-400">gemini-3.8-live</span>) • Web Audio API (16kHz PCM In / 24kHz PCM Out) • Capacitor Native Android Bridge • "Hey Soha"
        </p>
      </footer>
    </div>
  );
}
