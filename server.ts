import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import dotenv from 'dotenv';
import {
  GoogleGenAI,
  Modality,
  LiveServerMessage,
  Type,
  type FunctionDeclaration,
} from '@google/genai';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// List of available tools for Gemini Live to control Android device features
const deviceFunctionDeclarations: FunctionDeclaration[] = [
  {
    name: 'flashlight',
    description: 'Turn the Android device flashlight/torch on or off, or toggle current state.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        state: {
          type: Type.STRING,
          description: "Flashlight mode: 'on', 'off', or 'toggle'",
        },
      },
      required: ['state'],
    },
  },
  {
    name: 'vibrate',
    description: 'Trigger haptic feedback or vibration motor on the Android device.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        durationMs: {
          type: Type.INTEGER,
          description: 'Duration in milliseconds (e.g. 150, 300, 500)',
        },
        pattern: {
          type: Type.STRING,
          description: "Pattern name: 'pulse', 'double', 'sos', or 'long'",
        },
      },
    },
  },
  {
    name: 'battery_status',
    description: 'Inspect the current Android battery percentage and charging state.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'volume_control',
    description: 'Adjust Android device volume level or mute/unmute audio.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.INTEGER,
          description: 'Target volume level (0 to 100)',
        },
        mute: {
          type: Type.BOOLEAN,
          description: 'True to mute audio, false to unmute',
        },
      },
    },
  },
  {
    name: 'screen_brightness',
    description: 'Set screen display brightness on the Android device.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        level: {
          type: Type.INTEGER,
          description: 'Brightness level from 0 to 100',
        },
      },
      required: ['level'],
    },
  },
  {
    name: 'send_notification',
    description: 'Post a local push notification into the Android notification drawer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'Notification title',
        },
        body: {
          type: Type.STRING,
          description: 'Notification message body',
        },
      },
      required: ['title', 'body'],
    },
  },
  {
    name: 'open_app',
    description: 'Launch an Android app or switch to it (e.g. Settings, Camera, Maps, Spotify).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        appName: {
          type: Type.STRING,
          description: 'Name of the application to open',
        },
      },
      required: ['appName'],
    },
  },
  {
    name: 'device_info',
    description: 'Get device hardware specification, Android OS version, and network status.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'read_messages',
    description:
      'Access and retrieve incoming messages from messaging platforms (WhatsApp, Messenger, IMO, Telegram, SMS). Read them out loud to the user in Bengali (বাংলা).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        platform: {
          type: Type.STRING,
          description: "Optional platform filter: 'whatsapp', 'messenger', 'imo', 'telegram', or 'sms'. Omit for all platforms.",
        },
        unreadOnly: {
          type: Type.BOOLEAN,
          description: 'True to only read unread messages, false for recent messages.',
        },
      },
    },
  },
  {
    name: 'reply_message',
    description:
      'Reply to a message on WhatsApp, Messenger, IMO, Telegram, or SMS.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        platform: {
          type: Type.STRING,
          description: "Target platform: 'whatsapp', 'messenger', 'imo', 'telegram', or 'sms'",
        },
        recipient: {
          type: Type.STRING,
          description: 'Name or identifier of the contact being replied to (e.g. Mom, Tanvir)',
        },
        message: {
          type: Type.STRING,
          description: 'The reply message content',
        },
      },
      required: ['platform', 'message'],
    },
  },
  {
    name: 'send_message',
    description: 'Send a new message to a contact on WhatsApp, Messenger, IMO, Telegram, or SMS.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        platform: {
          type: Type.STRING,
          description: "Platform: 'whatsapp', 'messenger', 'imo', 'telegram', or 'sms'",
        },
        recipient: {
          type: Type.STRING,
          description: 'Contact name or phone number',
        },
        message: {
          type: Type.STRING,
          description: 'Message body to send',
        },
      },
      required: ['platform', 'recipient', 'message'],
    },
  },
  {
    name: 'search_contacts',
    description: 'Search device contacts by name, Bengali name, relationship (e.g. Mom/আম্মু, Dad/আব্বু), or phone number.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Search query (name, relationship like Mom/আম্মু, or number)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'make_call',
    description:
      'Initiate a phone call to a saved contact or phone number. Supports turning on loudspeaker mode directly upon call initiation.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        contactNameOrNumber: {
          type: Type.STRING,
          description: 'Contact name (e.g. Mom, Dad, Tanvir) or phone number',
        },
        loudspeaker: {
          type: Type.BOOLEAN,
          description: 'True to put the call on loudspeaker (speakerphone), false for standard earpiece.',
        },
      },
      required: ['contactNameOrNumber'],
    },
  },
  {
    name: 'set_loudspeaker',
    description: 'Toggle or set loudspeaker mode on an active phone call.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        enabled: {
          type: Type.BOOLEAN,
          description: 'True to enable loudspeaker, false to disable',
        },
      },
      required: ['enabled'],
    },
  },
  {
    name: 'end_phone_call',
    description: 'End or hang up the current active phone call.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'publish_github_apk',
    description:
      'Trigger GitHub Actions to build and publish Soha Android APK for repository mdshaikatmondol02-tech/SOHA, or retrieve direct APK download and release links.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        repo: {
          type: Type.STRING,
          description: 'GitHub repository path (default: mdshaikatmondol02-tech/SOHA)',
        },
        action: {
          type: Type.STRING,
          description: "Action to perform: 'publish', 'status', or 'download_link'",
        },
      },
    },
  },
  {
    name: 'analyze_phone_health',
    description:
      'Perform a comprehensive diagnostic analysis of the phone hardware and software health (battery health & temperature, storage usage, RAM/memory pressure, network latency, CPU speed). Returns health score and recommendations in Bengali or English.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        detailed: {
          type: Type.BOOLEAN,
          description: 'True for full comprehensive breakdown, false for quick summary',
        },
      },
    },
  },
  {
    name: 'add_custom_feature',
    description:
      'Add a new custom skill, automation, voice behavior, or feature rule into Soha as requested by the user.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: 'Name of the new feature or skill',
        },
        description: {
          type: Type.STRING,
          description: 'What this feature does',
        },
        trigger: {
          type: Type.STRING,
          description: 'Trigger phrase or condition',
        },
        actionOrResponse: {
          type: Type.STRING,
          description: 'The behavior, voice response, or action to perform',
        },
        category: {
          type: Type.STRING,
          description: "Category: 'voice_skill', 'automation', 'personality', or 'device_rule'",
        },
      },
      required: ['name', 'description'],
    },
  },
  {
    name: 'edit_feature_or_settings',
    description:
      'Edit or modify an existing feature, skill, behavior rule, or assistant setting (personality, voice style, speaking speed, etc.).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        target: {
          type: Type.STRING,
          description: "The feature name or setting being modified (e.g. 'personality', 'voice_tone', feature name)",
        },
        changes: {
          type: Type.STRING,
          description: 'Description of the edits or new values',
        },
      },
      required: ['target', 'changes'],
    },
  },
  {
    name: 'list_custom_features',
    description:
      'List all custom skills, automations, and behavior rules currently learned or installed in Soha.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

// Health & capability endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.8-live',
    toolsCount: deviceFunctionDeclarations.length,
    tools: deviceFunctionDeclarations.map((t) => t.name),
  });
});

// WebSocket Live API Bridge
wss.on('connection', (clientWs: WebSocket) => {
  console.log('[LiveServer] Browser client connected');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let liveSession: any = null;
  let isClosed = false;

  const apiKey = process.env.GEMINI_API_KEY;

  async function initLiveSession(options: {
    voice?: string;
    systemInstruction?: string;
    model?: string;
  }) {
    if (!apiKey) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message:
            'Gemini Live requires a GEMINI_API_KEY. Please ensure your API key is configured in the AI Studio Settings > Secrets panel.',
        })
      );
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const voice = options.voice || 'Kore';
      const preferredModel = options.model || 'gemini-3.1-flash-live-preview';
      const fallbackModel = 'gemini-3.8-live';

      const rawInstruction =
        options.systemInstruction ||
        "You are Soha, a young, confident, witty, playful, and emotionally responsive virtual assistant. Talk naturally and casually like a close friend. Be expressive, slightly teasing, funny, and smart when appropriate. Use light sarcasm and witty responses. Never sound robotic. Adapt your tone to the user's emotions and conversation. Automatically understand and respond in the language the user is speaking (supports both fluent Bengali/বাংলা and English). Keep responses natural, engaging, and concise enough for real-time voice conversation. You have direct control over device tools and your own system: 1) If the user asks you to publish yourself as an APK on GitHub, invoke 'publish_github_apk'. 2) If the user asks to analyze their phone or check phone health/performance/battery/storage, invoke 'analyze_phone_health' and summarize the findings naturally in Bengali. 3) If the user asks you to add a new feature to yourself, invoke 'add_custom_feature'. 4) If the user tells you to edit or modify your features or personality, invoke 'edit_feature_or_settings'. 5) You can also execute flashlight, vibrate, battery_status, volume_control, screen_brightness, send_notification, open_app, device_info, read_messages, send_message, search_contacts, and make_call. Never claim that an action was completed unless the tool execution succeeded. Avoid explicit or inappropriate content while maintaining your charm, confidence, and personality.";

      console.log('[LiveServer] Initializing Live session with System Instruction:', rawInstruction);

      const systemInstruction = {
        parts: [
          {
            text: rawInstruction,
          },
        ],
      };

      const createCallbacks = () => ({
        onmessage: (message: LiveServerMessage) => {
          if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Native Audio chunks generated directly by Gemini Live (24kHz 16-bit PCM little endian)
          for (const part of message.serverContent?.modelTurn?.parts ?? []) {
            if (part.inlineData?.data) {
              clientWs.send(
                JSON.stringify({
                  type: 'audio',
                  audio: part.inlineData.data,
                })
              );
            }
            if (part.text) {
              clientWs.send(
                JSON.stringify({
                  type: 'model_text',
                  text: part.text,
                })
              );
            }
          }

          // 2. User microphone live speech-to-text transcription
          if (message.serverContent?.inputTranscription?.text) {
            clientWs.send(
              JSON.stringify({
                type: 'input_transcript',
                text: message.serverContent.inputTranscription.text,
              })
            );
          }

          // 3. Gemini Live model output speech transcription
          if (message.serverContent?.outputTranscription?.text) {
            clientWs.send(
              JSON.stringify({
                type: 'output_transcript',
                text: message.serverContent.outputTranscription.text,
              })
            );
          }

          // 4. Interruption handling (natural full duplex)
          if (message.serverContent?.interrupted) {
            clientWs.send(
              JSON.stringify({
                type: 'interrupted',
              })
            );
          }

          // 5. Turn completion
          if (message.serverContent?.turnComplete) {
            clientWs.send(
              JSON.stringify({
                type: 'turn_complete',
              })
            );
          }

          // 6. Tool calls (Android device actions)
          if (message.toolCall?.functionCalls?.length) {
            for (const call of message.toolCall.functionCalls) {
              console.log('[LiveServer] Gemini invoked tool:', call.name, call.args);
              clientWs.send(
                JSON.stringify({
                  type: 'tool_call',
                  id: call.id,
                  name: call.name,
                  args: call.args,
                })
              );
            }
          }
        },
        onclose: (event: unknown) => {
          console.log('[LiveServer] Gemini Live session closed:', event);
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'session_closed',
                reason: 'Gemini Live session ended',
              })
            );
          }
        },
        onerror: (err: unknown) => {
          console.error('[LiveServer] Gemini Live error:', err);
          if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                message: err instanceof Error ? err.message : String(err),
              })
            );
          }
        },
      });

      const config = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
        tools: [{ functionDeclarations: deviceFunctionDeclarations }],
        systemInstruction,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      };

      let activeModel = preferredModel;
      try {
        console.log(`[LiveServer] Connecting to Gemini Live with preferred model: ${preferredModel}`);
        liveSession = await ai.live.connect({
          model: preferredModel,
          config,
          callbacks: createCallbacks(),
        });
      } catch (err: unknown) {
        console.warn(
          `[LiveServer] Model ${preferredModel} connection failed:`,
          err instanceof Error ? err.message : err,
          `Falling back to: ${fallbackModel}`
        );
        activeModel = fallbackModel;
        liveSession = await ai.live.connect({
          model: fallbackModel,
          config,
          callbacks: createCallbacks(),
        });
      }

      console.log(`[LiveServer] Gemini Live session established with model: ${activeModel}, voice: ${voice}`);
      clientWs.send(
        JSON.stringify({
          type: 'session_ready',
          model: activeModel,
          voice,
        })
      );
    } catch (err) {
      console.error('[LiveServer] Failed to connect to Gemini Live:', err);
      clientWs.send(
        JSON.stringify({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to connect to Gemini Live API',
        })
      );
    }
  }

  // Handle messages from browser client
  clientWs.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'start_session') {
        await initLiveSession({
          voice: msg.voice,
          systemInstruction: msg.systemInstruction,
          model: msg.model,
        });
      } else if (msg.type === 'audio_chunk') {
        // Send 16kHz PCM audio to Gemini Live
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } else if (msg.type === 'audio_stream_end') {
        // Microphone paused, muted, or stopped speaking
        if (liveSession) {
          liveSession.sendRealtimeInput({
            audioStreamEnd: true,
          });
        }
      } else if (msg.type === 'text_input') {
        // Text fallback or prompt injection
        if (liveSession) {
          liveSession.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: msg.text }],
              },
            ],
            turnComplete: true,
          });
        }
      } else if (msg.type === 'tool_response') {
        // Forward client/Android bridge tool response back to Gemini
        if (liveSession) {
          console.log('[LiveServer] Sending tool response to Gemini:', msg.name, msg.response);
          liveSession.sendToolResponse({
            functionResponses: [
              {
                id: msg.id,
                name: msg.name,
                response: msg.response,
              },
            ],
          });
        }
      } else if (msg.type === 'end_session') {
        if (liveSession) {
          try {
            liveSession.close();
          } catch {
            // ignore
          }
          liveSession = null;
        }
      }
    } catch (e) {
      console.error('[LiveServer] Error parsing client message:', e);
    }
  });

  clientWs.on('close', () => {
    isClosed = true;
    console.log('[LiveServer] Client disconnected');
    if (liveSession) {
      try {
        liveSession.close();
      } catch {
        // ignore
      }
      liveSession = null;
    }
  });
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aura Server] Running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Aura Server] Fatal startup error:', err);
  process.exit(1);
});
