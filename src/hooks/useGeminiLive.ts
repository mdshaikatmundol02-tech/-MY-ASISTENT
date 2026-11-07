/**
 * Hook for bidirectional audio-to-audio interaction with Gemini Live API
 * Manages Web Audio API input (16kHz), output playback (24kHz), interruptions,
 * native Android tool dispatch, and live streaming transcripts.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  float32ToPcm16,
  pcmToBase64,
  base64ToFloat32,
  resampleAudio,
  calculateRms,
  processMicrophoneAudioChunk,
} from '../utils/audioUtils';
import { AndroidDeviceState, initialAndroidDeviceState } from '../utils/deviceBridgeCore';
import { nativeBridge } from '../services/nativeAndroidBridge';
import {
  TranscriptItem,
  appendOrUpdateTurn,
  finalizeAllTurns,
} from '../utils/transcriptUtils';
import { checkWakeWord, playWakeChime } from '../utils/wakeWordUtils';

export type LiveConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error';

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'requesting';

export interface UseGeminiLiveOptions {
  voice?: string;
  systemInstruction?: string;
  model?: string;
  autoWakeWord?: boolean;
}

export function useGeminiLive(options: UseGeminiLiveOptions = {}) {
  const [connectionState, setConnectionState] = useState<LiveConnectionState>('disconnected');
  const [deviceState, setDeviceState] = useState<AndroidDeviceState>(initialAndroidDeviceState);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermissionState, setMicPermissionState] = useState<MicPermissionState>('prompt');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [userRms, setUserRms] = useState(0);
  const [modelRms, setModelRms] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(options.voice || 'Kore');
  const [selectedModel, setSelectedModel] = useState(options.model || 'gemini-3.1-flash-live-preview');
  const [isWakeWordEnabled, setIsWakeWordEnabled] = useState(options.autoWakeWord ?? true);
  const [isWakeListening, setIsWakeListening] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  const pendingCommandRef = useRef<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeRecognitionRef = useRef<any>(null);

  // Audio Context references
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);

  // Playback scheduling references for gapless 24kHz audio
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const isMutedRef = useRef(false);
  isMutedRef.current = isMicMuted;

  const deviceStateRef = useRef(deviceState);
  deviceStateRef.current = deviceState;

  // Check microphone permission state on mount if browser permissions API is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((status) => {
          setMicPermissionState(status.state as MicPermissionState);
          status.onchange = () => {
            setMicPermissionState(status.state as MicPermissionState);
          };
        })
        .catch(() => {});
    }
  }, []);

  // Cleanup all audio resources and stop active sources
  const stopAudio = useCallback(() => {
    // Stop all playing audio buffers immediately (for interruption)
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current && outputAudioCtxRef.current.state !== 'closed') {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    setUserRms(0);
    setModelRms(0);
  }, []);

  // Play incoming 24kHz PCM chunk with gapless scheduling
  const scheduleAudioPlayback = useCallback((base64Data: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        // Live API output is 24kHz
        outputAudioCtxRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
          sampleRate: 24000,
        });

        const analyser = outputAudioCtxRef.current.createAnalyser();
        analyser.fftSize = 256;
        outputAnalyserRef.current = analyser;
        analyser.connect(outputAudioCtxRef.current.destination);
      }

      const ctx = outputAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const float32Samples = base64ToFloat32(base64Data);
      if (float32Samples.length === 0) return;

      const rms = calculateRms(float32Samples);
      setModelRms(rms);

      const buffer = ctx.createBuffer(1, float32Samples.length, 24000);
      buffer.getChannelData(0).set(float32Samples);

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      if (outputAnalyserRef.current) {
        source.connect(outputAnalyserRef.current);
      } else {
        source.connect(ctx.destination);
      }

      // Schedule gapless playback: start at max(currentTime, nextStartTime)
      const now = ctx.currentTime;
      const startTime = Math.max(now, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      activeSourcesRef.current.push(source);
      source.onended = () => {
        const idx = activeSourcesRef.current.indexOf(source);
        if (idx !== -1) {
          activeSourcesRef.current.splice(idx, 1);
        }
        if (activeSourcesRef.current.length === 0) {
          setModelRms(0);
          setConnectionState((prev) => (prev === 'speaking' ? 'listening' : prev));
        }
      };

      setConnectionState('speaking');
    } catch (e) {
      console.error('[GeminiLive] Error scheduling audio playback:', e);
    }
  }, []);

  // Handle interruption: stop current model audio immediately
  const handleInterruption = useCallback(() => {
    console.log('[GeminiLive] Speech interrupted by user');
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setModelRms(0);
    setConnectionState('listening');
  }, []);

  // Disconnect session
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'end_session' }));
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    stopAudio();
    setConnectionState('disconnected');
  }, [stopAudio]);

  // Explicitly prompt user for microphone access before or outside of call
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      setMicPermissionState('requesting');
      const testStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      // Immediately release test stream
      testStream.getTracks().forEach((t) => t.stop());
      setMicPermissionState('granted');
      return true;
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
        setMicPermissionState('denied');
        setErrorMessage(
          'Microphone permission denied. Please click the permissions icon in your browser address bar and select "Allow".'
        );
      } else {
        setErrorMessage(e?.message || 'Unable to access microphone.');
      }
      return false;
    }
  }, []);

  // Connect to Gemini Live session
  const connect = useCallback(
    async (overrideVoice?: string, overrideInstruction?: string) => {
      disconnect();
      setErrorMessage(null);
      setConnectionState('connecting');

      const voice = overrideVoice || selectedVoice;
      const instruction = overrideInstruction || options.systemInstruction;

      try {
        // 1. Initialize Web Audio Contexts
        const inputCtx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
          sampleRate: 16000,
        });
        if (inputCtx.state === 'suspended') {
          await inputCtx.resume();
        }
        inputAudioCtxRef.current = inputCtx;

        const outputCtx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
          sampleRate: 24000,
        });
        if (outputCtx.state === 'suspended') {
          await outputCtx.resume();
        }
        outputAudioCtxRef.current = outputCtx;

        const outputAnalyser = outputCtx.createAnalyser();
        outputAnalyser.fftSize = 256;
        outputAnalyserRef.current = outputAnalyser;
        outputAnalyser.connect(outputCtx.destination);

        const inputAnalyser = inputCtx.createAnalyser();
        inputAnalyser.fftSize = 256;
        inputAnalyserRef.current = inputAnalyser;

        // 2. Request User Microphone via Browser MediaDevices API
        setMicPermissionState('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: { ideal: 1 },
            sampleRate: { ideal: 16000 },
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        micStreamRef.current = stream;
        setMicPermissionState('granted');

        // Handle external microphone disconnect or track interruption
        stream.getAudioTracks().forEach((track) => {
          track.onended = () => {
            console.log('[GeminiLive] Microphone hardware track ended');
            disconnect();
          };
        });

        // 3. Connect microphone to processor
        const source = inputCtx.createMediaStreamSource(stream);
        source.connect(inputAnalyser);

        // Low-latency 2048-sample buffer (~128ms per audio chunk at 16kHz)
        const processor = inputCtx.createScriptProcessor(2048, 1, 1);
        scriptProcessorRef.current = processor;
        inputAnalyser.connect(processor);

        // Mute feedback gain (gain 0) connected to destination:
        // Keeps ScriptProcessorNode clock ticking continuously while preventing user's voice from echoing into speakers
        const muteGain = inputCtx.createGain();
        muteGain.gain.value = 0;
        processor.connect(muteGain);
        muteGain.connect(inputCtx.destination);

        // 4. Connect WebSocket to Gemini Live server bridge
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/live`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) {
            setUserRms(0);
            return;
          }

          const rawData = e.inputBuffer.getChannelData(0);
          const currentSampleRate = inputCtx.sampleRate;

          // Convert microphone audio into exact Gemini Live format: 16-bit PCM, 16kHz mono, little-endian Base64
          const chunk = processMicrophoneAudioChunk(rawData, currentSampleRate);
          setUserRms(chunk.rms);

          ws.send(
            JSON.stringify({
              type: 'audio_chunk',
              audio: chunk.base64,
            })
          );
        };

        ws.onopen = () => {
          console.log('[GeminiLive] WebSocket opened, starting session with voice:', voice);
          ws.send(
            JSON.stringify({
              type: 'start_session',
              voice,
              systemInstruction: instruction,
              model: selectedModel,
            })
          );
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'session_ready') {
              setConnectionState('listening');
              if (data.model) {
                setSelectedModel(data.model);
              }
              if (data.voice) {
                setSelectedVoice(data.voice);
              }

              // If a command was spoken right after wake word, forward it to the session
              if (pendingCommandRef.current) {
                const cmd = pendingCommandRef.current;
                pendingCommandRef.current = null;
                setTimeout(() => {
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    setTranscripts((prev) => appendOrUpdateTurn(prev, 'user', cmd, false));
                    wsRef.current.send(JSON.stringify({ type: 'text_input', text: cmd }));
                  }
                }, 350);
              }
            } else if (data.type === 'audio') {
              // Real Gemini Live generated 24kHz audio chunks
              scheduleAudioPlayback(data.audio);
            } else if (data.type === 'interrupted') {
              handleInterruption();
            } else if (data.type === 'input_transcript') {
              setTranscripts((prev) => appendOrUpdateTurn(prev, 'user', data.text, false));
            } else if (data.type === 'output_transcript' || data.type === 'model_text') {
              setTranscripts((prev) => appendOrUpdateTurn(prev, 'gemini', data.text, false));
            } else if (data.type === 'turn_complete') {
              setTranscripts((prev) => finalizeAllTurns(prev));
            } else if (data.type === 'tool_call') {
              // Execute native Android device action
              console.log('[GeminiLive] Received tool call from Gemini:', data.name, data.args);
              const actionResult = await nativeBridge.dispatchAction(
                deviceStateRef.current,
                data.name,
                data.args || {},
                'gemini'
              );

              // Update React device state
              setDeviceState(actionResult.updatedState);

              // Send result back to Gemini Live
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    type: 'tool_response',
                    id: data.id,
                    name: data.name,
                    response: actionResult.geminiResponse,
                  })
                );
              }
            } else if (data.type === 'error') {
              console.error('[GeminiLive] Server reported error:', data.message);
              setErrorMessage(data.message);
              setConnectionState('error');
              stopAudio();
            }
          } catch (err) {
            console.error('[GeminiLive] Message handling error:', err);
          }
        };

        ws.onerror = (err) => {
          console.error('[GeminiLive] WebSocket error:', err);
          setErrorMessage('WebSocket connection error');
          setConnectionState('error');
        };

        ws.onclose = () => {
          console.log('[GeminiLive] WebSocket closed');
          if (connectionState !== 'disconnected') {
            setConnectionState('disconnected');
          }
        };
      } catch (err: unknown) {
        console.error('[GeminiLive] Failed to start voice session:', err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        let userFriendlyError = 'Microphone or connection failed';

        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
          setMicPermissionState('denied');
          userFriendlyError =
            'Microphone access denied. Please click the permissions icon in your browser address bar and select "Allow" to talk with SOHA.';
        } else if (e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError') {
          userFriendlyError = 'No microphone device found on this system. Please connect an audio input device.';
        } else if (e?.name === 'NotReadableError' || e?.name === 'TrackStartError') {
          userFriendlyError = 'Microphone is currently in use by another application. Please free your microphone and retry.';
        } else if (err instanceof Error) {
          userFriendlyError = err.message;
        }

        setErrorMessage(userFriendlyError);
        setConnectionState('error');
        stopAudio();
      }
    },
    [
      disconnect,
      selectedVoice,
      options.systemInstruction,
      selectedModel,
      stopAudio,
      scheduleAudioPlayback,
      handleInterruption,
      connectionState,
    ]
  );

  // Send a manual text message to Gemini Live
  const sendTextMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    setTranscripts((prev) => appendOrUpdateTurn(prev, 'user', text, false));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text_input',
          text,
        })
      );
    }
  }, []);

  // Manual device action dispatcher from UI
  const triggerManualDeviceAction = useCallback(
    async (actionName: string, params: Record<string, unknown> = {}) => {
      const res = await nativeBridge.dispatchAction(
        deviceStateRef.current,
        actionName,
        params,
        'user'
      );
      setDeviceState(res.updatedState);
      return res;
    },
    []
  );

  // Toggle mic mute
  const toggleMute = useCallback(() => {
    setIsMicMuted((prev) => {
      const next = !prev;
      if (next && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'audio_stream_end' }));
      }
      return next;
    });
  }, []);

  // Programmatic or button wake-word trigger (e.g. "Hey Soha")
  const triggerWakeWord = useCallback(
    (commandRemainder?: string) => {
      setWakeWordDetected(true);
      playWakeChime();
      if (commandRemainder) {
        pendingCommandRef.current = commandRemainder;
      }
      setTimeout(() => setWakeWordDetected(false), 2000);
      return connect();
    },
    [connect]
  );

  // Background Wake-Word ("Hey Soha") Recognition Loop when standby
  useEffect(() => {
    if (!isWakeWordEnabled || connectionState !== 'disconnected') {
      if (wakeRecognitionRef.current) {
        try {
          wakeRecognitionRef.current.stop();
        } catch {
          // ignore
        }
        wakeRecognitionRef.current = null;
      }
      setIsWakeListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsWakeListening(false);
      return;
    }

    let isCancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recognition: any = null;

    try {
      recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        if (isCancelled) return;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript || '';
          const match = checkWakeWord(transcript);
          if (match.matched) {
            console.log('[WakeWord] "Hey Soha" detected:', match.detectedPhrase, match.commandRemainder);
            setWakeWordDetected(true);
            playWakeChime();
            try {
              recognition.stop();
            } catch {
              // ignore
            }
            if (match.commandRemainder) {
              pendingCommandRef.current = match.commandRemainder;
            }
            setTimeout(() => setWakeWordDetected(false), 2500);
            connect();
            break;
          }
        }
      };

      recognition.onerror = () => {
        // Silently handle non-fatal recognition errors
      };

      recognition.onend = () => {
        if (isCancelled) return;
        setIsWakeListening(false);
        // Automatically restart wake listener in standby if still disconnected
        setTimeout(() => {
          if (!isCancelled && isWakeWordEnabled && connectionState === 'disconnected') {
            try {
              recognition.start();
              setIsWakeListening(true);
            } catch {
              // ignore
            }
          }
        }, 1200);
      };

      recognition.start();
      setIsWakeListening(true);
      wakeRecognitionRef.current = recognition;
    } catch {
      setIsWakeListening(false);
    }

    return () => {
      isCancelled = true;
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      }
      wakeRecognitionRef.current = null;
      setIsWakeListening(false);
    };
  }, [isWakeWordEnabled, connectionState, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    deviceState,
    transcripts,
    errorMessage,
    isMicMuted,
    micPermissionState,
    requestMicrophonePermission,
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
    clearError: () => setErrorMessage(null),
    setErrorMessage,
    inputAnalyser: inputAnalyserRef.current,
    outputAnalyser: outputAnalyserRef.current,
    setTranscripts,
  };
}
