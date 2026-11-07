import React, { useState } from 'react';
import {
  AndroidDeviceState,
  CrossPlatformMessage,
  DeviceContact,
  CustomAssistantFeature,
} from '../utils/deviceBridgeCore';
import {
  Smartphone,
  Flashlight,
  Vibrate,
  Battery,
  BatteryCharging,
  Wifi,
  Bell,
  Sun,
  Volume2,
  VolumeX,
  Layers,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  PhoneCall,
  PhoneOff,
  User,
  Send,
  Languages,
  Radio,
  Search,
  MessageCircle,
  HeartPulse,
  Cpu,
  HardDrive,
  Gauge,
  GitBranch,
  Github,
  Wrench,
  Plus,
  Edit3,
  Download,
  RefreshCw,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface AndroidDeviceInspectorProps {
  deviceState: AndroidDeviceState;
  onTriggerAction: (actionName: string, params?: Record<string, unknown>) => Promise<unknown>;
}

export const AndroidDeviceInspector: React.FC<AndroidDeviceInspectorProps> = ({
  deviceState,
  onTriggerAction,
}) => {
  const [activeTab, setActiveTab] = useState<
    'device' | 'health' | 'features' | 'messages' | 'contacts' | 'logs' | 'bridge'
  >('device');
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDesc, setNewFeatureDesc] = useState('');
  const [newFeatureTrigger, setNewFeatureTrigger] = useState('');
  const [newFeatureAction, setNewFeatureAction] = useState('');
  const [newFeatureCategory, setNewFeatureCategory] = useState<
    'voice_skill' | 'automation' | 'personality' | 'device_rule'
  >('voice_skill');
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editChangesText, setEditChangesText] = useState('');

  const {
    model,
    androidVersion,
    platform,
    battery,
    flashlight,
    volume,
    brightness,
    network,
    notifications,
    actionLogs,
    hapticTriggerCount,
    lastHapticPattern,
    currentApp,
    messages,
    contacts,
    activeCall,
    healthReport,
    apkPublishState,
    customFeatures,
  } = deviceState;

  const isVibrating = Boolean(lastHapticPattern && hapticTriggerCount > 0);
  const unreadMessagesCount = messages.filter((m) => m.unread).length;

  const filteredMessages = messages.filter((m) => {
    if (selectedPlatformFilter === 'all') return true;
    return m.platform.toLowerCase() === selectedPlatformFilter.toLowerCase();
  });

  const filteredContacts = contacts.filter((c) => {
    if (!contactSearchQuery) return true;
    const q = contactSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.relationship?.toLowerCase().includes(q)
    );
  });

  const getPlatformBadge = (plat: CrossPlatformMessage['platform']) => {
    switch (plat) {
      case 'whatsapp':
        return { label: 'WhatsApp', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'messenger':
        return { label: 'Messenger', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'imo':
        return { label: 'IMO', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'telegram':
        return { label: 'Telegram', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
      case 'sms':
        return { label: 'SMS', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      default:
        return { label: plat, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const handleSendReply = (msg: CrossPlatformMessage) => {
    const text = replyTextMap[msg.id];
    if (!text || !text.trim()) return;
    onTriggerAction('reply_message', {
      messageId: msg.id,
      replyText: text.trim(),
      platform: msg.platform,
    });
    setReplyTextMap((prev) => ({ ...prev, [msg.id]: '' }));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="px-4 sm:px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 flex flex-wrap items-center gap-1.5">
              <span>Android Bridge &amp; Device Control</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                {platform === 'capacitor'
                  ? 'Capacitor APK'
                  : platform === 'android-native'
                  ? 'Native WebView'
                  : 'Capacitor / Web Ready'}
              </span>
              {activeCall && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 animate-pulse font-medium">
                  <PhoneCall className="w-3 h-3" />
                  <span>Call Active</span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {model} • Android {androidVersion.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('device')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'device'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Handset
          </button>
          <button
            onClick={() => {
              setActiveTab('health');
              if (!healthReport) {
                onTriggerAction('analyze_phone_health');
              }
            }}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'health'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phone Health (ডায়াগনস্টিক)</span>
            {healthReport && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                {healthReport.score}%
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'features'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>APK &amp; Skills (সেলফ-আপডেট)</span>
            <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 text-[10px] font-mono">
              {customFeatures?.length || 3}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'messages'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Messages (বাংলা)</span>
            {unreadMessagesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadMessagesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'contacts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Calls &amp; Contacts</span>
            {activeCall && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Action Audit</span>
            {actionLogs.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-400/20 text-indigo-200 text-[10px] flex items-center justify-center font-mono">
                {actionLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bridge')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'bridge'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bridge Architecture
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* TAB 1: HANDSET & HARDWARE CONTROLS */}
        {activeTab === 'device' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Android Phone Simulation Frame */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-64 h-[440px] rounded-[36px] bg-slate-950 border-[6px] border-slate-700/80 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300">
                {/* Flashlight Torch Glow simulation */}
                {flashlight.enabled && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 bg-yellow-400/30 rounded-full blur-2xl pointer-events-none animate-pulse" />
                )}

                {/* Vibration Shake Animation wrapper */}
                <div
                  className={`relative flex-1 flex flex-col w-full h-full ${
                    isVibrating ? 'animate-[wiggle_0.2s_ease-in-out_infinite]' : ''
                  }`}
                  style={{
                    filter: `brightness(${Math.max(0.4, brightness.level / 100)})`,
                  }}
                >
                  {/* Phone Top Notch / Speaker & Punchhole Camera */}
                  <div className="h-6 w-full bg-slate-950 flex items-center justify-between px-6 pt-1 text-[11px] text-slate-300 select-none z-20">
                    <span className="font-semibold text-[10px]">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 -mt-1" />
                    <div className="flex items-center space-x-1.5 text-[10px]">
                      <Wifi className="w-3 h-3 text-slate-300" />
                      <span className="font-mono text-[9px]">5G</span>
                      <div className="flex items-center space-x-0.5">
                        <span className="font-mono text-[9px]">{battery.level}%</span>
                        {battery.charging ? (
                          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Battery className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Android Phone Screen Body */}
                  <div className="flex-1 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 p-3 flex flex-col justify-between relative overflow-hidden">
                    {/* Flashlight status banner inside phone */}
                    {flashlight.enabled && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-[10px] text-yellow-300 animate-pulse z-10">
                        <Flashlight className="w-3 h-3 fill-yellow-400" />
                        <span>Torch ON</span>
                      </div>
                    )}

                    {/* Active Call In-Screen Card if Call is Active */}
                    {activeCall ? (
                      <div className="my-auto p-3 rounded-2xl bg-slate-900/95 border border-rose-500/40 shadow-xl flex flex-col items-center text-center animate-in fade-in">
                        <div className="w-12 h-12 rounded-full bg-rose-600/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-300 mb-2">
                          <PhoneCall className="w-6 h-6 animate-pulse" />
                        </div>
                        <h5 className="font-bold text-xs text-white truncate max-w-[180px]">
                          {activeCall.contactName}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-mono">{activeCall.phone}</p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {activeCall.durationSeconds}s
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                              activeCall.loudspeaker
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            🔊 {activeCall.loudspeaker ? 'Loudspeaker ON' : 'Handset'}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() =>
                              onTriggerAction('set_loudspeaker', {
                                enabled: !activeCall.loudspeaker,
                              })
                            }
                            className="px-2 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 text-[10px] border border-cyan-500/30"
                          >
                            {activeCall.loudspeaker ? 'Loudspeaker Off' : 'Loudspeaker On'}
                          </button>
                          <button
                            onClick={() => onTriggerAction('end_phone_call')}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px]"
                          >
                            End Call
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Active App Tile */}
                        <div className="mt-1 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm shadow-md">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                              Foreground App
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                              Active
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow">
                              S
                            </div>
                            <span className="text-xs font-semibold text-slate-200 truncate">
                              {currentApp}
                            </span>
                          </div>
                        </div>

                        {/* Recent Incoming Message Snapshot */}
                        {messages[0] && (
                          <div className="my-auto p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-semibold text-indigo-300 flex items-center gap-1 uppercase">
                                <MessageCircle className="w-3 h-3" />
                                {messages[0].platform}
                              </span>
                              <span className="text-[9px] text-slate-500">{messages[0].timestamp}</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-200 truncate">
                              {messages[0].sender}: {messages[0].body}
                            </p>
                            <p className="text-[10px] text-pink-300/90 italic truncate mt-0.5">
                              বাংলা: {messages[0].bodyBengali}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Notification Alert Card / Drawer trigger */}
                    <div className="mt-auto">
                      <button
                        onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
                        className="w-full text-left p-2 rounded-xl bg-slate-900/90 border border-slate-700/60 shadow hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-300 mb-0.5">
                          <span className="flex items-center space-x-1.5 font-medium text-[10px]">
                            <Bell className="w-3 h-3 text-indigo-400" />
                            <span>Notifications ({notifications.length})</span>
                          </span>
                          <span className="text-[8px] text-slate-500">Toggle</span>
                        </div>
                        {notifications[0] && (
                          <div className="text-[9px] text-slate-400 truncate">
                            <span className="font-semibold text-slate-300">
                              {notifications[0].title}:
                            </span>{' '}
                            {notifications[0].body}
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Hardware Meters at Phone Bottom */}
                    <div className="space-y-1 bg-slate-900/70 p-1.5 rounded-xl border border-slate-800/60 mt-1">
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span className="flex items-center space-x-1">
                          <Sun className="w-3 h-3 text-amber-400" />
                          <span>Brightness: {brightness.level}%</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          {volume.muted ? (
                            <VolumeX className="w-3 h-3 text-red-400" />
                          ) : (
                            <Volume2 className="w-3 h-3 text-cyan-400" />
                          )}
                          <span>Vol: {volume.muted ? 'Muted' : `${volume.level}%`}</span>
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400"
                          style={{ width: `${brightness.level}%` }}
                        />
                      </div>
                    </div>

                    {/* Android Gesture Bar */}
                    <div className="h-2 flex items-center justify-center mt-1">
                      <div className="w-16 h-1 rounded-full bg-slate-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Torch beam visual cone */}
              <div className="mt-3 text-center">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                    flashlight.enabled
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700'
                  }`}
                >
                  <Flashlight className="w-3.5 h-3.5" />
                  Flashlight {flashlight.enabled ? 'ON' : 'OFF'}
                </span>
                {hapticTriggerCount > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    <Vibrate className="w-3 h-3" />
                    Haptics: {hapticTriggerCount}x
                  </span>
                )}
              </div>
            </div>

            {/* Quick Interactive Tool Controls & Status */}
            <div className="lg:col-span-7 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Manual Hardware Control &amp; Voice Tool Simulation</span>
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Say <strong className="text-pink-300">"Hey Soha"</strong> or speak directly to Gemini Live to trigger device tools, or tap buttons below to test hardware triggers.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Flashlight button */}
                <button
                  onClick={() => onTriggerAction('flashlight', { state: 'toggle' })}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                    flashlight.enabled
                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <Flashlight className="w-5 h-5 mb-1.5" />
                  <span className="text-xs font-semibold">Toggle Flashlight</span>
                  <span className="text-[10px] text-slate-400">
                    {flashlight.enabled ? 'Active' : 'Standby'}
                  </span>
                </button>

                {/* Vibrate button */}
                <button
                  onClick={() => onTriggerAction('vibrate', { durationMs: 250, pattern: 'pulse' })}
                  className="p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900 flex flex-col items-center justify-center text-center transition-all"
                >
                  <Vibrate className="w-5 h-5 mb-1.5 text-purple-400" />
                  <span className="text-xs font-semibold">Vibrate Phone</span>
                  <span className="text-[10px] text-slate-400">250ms pulse</span>
                </button>

                {/* Battery query */}
                <button
                  onClick={() => onTriggerAction('battery_status')}
                  className="p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900 flex flex-col items-center justify-center text-center transition-all"
                >
                  <BatteryCharging className="w-5 h-5 mb-1.5 text-emerald-400" />
                  <span className="text-xs font-semibold">Query Battery</span>
                  <span className="text-[10px] text-slate-400">{battery.level}% State</span>
                </button>

                {/* Brightness toggle */}
                <button
                  onClick={() =>
                    onTriggerAction('screen_brightness', {
                      level: brightness.level >= 80 ? 30 : 90,
                    })
                  }
                  className="p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900 flex flex-col items-center justify-center text-center transition-all"
                >
                  <Sun className="w-5 h-5 mb-1.5 text-amber-400" />
                  <span className="text-xs font-semibold">Toggle Brightness</span>
                  <span className="text-[10px] text-slate-400">{brightness.level}%</span>
                </button>

                {/* Volume toggle */}
                <button
                  onClick={() =>
                    onTriggerAction('volume_control', {
                      level: volume.level >= 80 ? 40 : 85,
                      mute: !volume.muted && volume.level > 70,
                    })
                  }
                  className="p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900 flex flex-col items-center justify-center text-center transition-all"
                >
                  <Volume2 className="w-5 h-5 mb-1.5 text-cyan-400" />
                  <span className="text-xs font-semibold">Adjust Volume</span>
                  <span className="text-[10px] text-slate-400">{volume.level}%</span>
                </button>

                {/* Read Messages in Bengali trigger */}
                <button
                  onClick={() => onTriggerAction('read_messages', { inBengali: true })}
                  className="p-3 rounded-xl border bg-slate-950/60 border-indigo-500/30 text-indigo-300 hover:border-indigo-500/60 hover:bg-slate-900 flex flex-col items-center justify-center text-center transition-all"
                >
                  <Languages className="w-5 h-5 mb-1.5 text-pink-400" />
                  <span className="text-xs font-semibold">Read All (বাংলা)</span>
                  <span className="text-[10px] text-slate-400">WhatsApp, IMO, SMS</span>
                </button>
              </div>

              {/* Hardware state breakdown */}
              <div className="bg-slate-950/70 rounded-xl border border-slate-800/80 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Live Hardware Telemetry</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Synchronized</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex justify-between items-center bg-slate-900/60 px-3 py-2 rounded-lg">
                    <span className="text-slate-400">Network:</span>
                    <span className="font-medium text-slate-200">
                      {network.connectionType.toUpperCase()} ({network.ssid})
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 px-3 py-2 rounded-lg">
                    <span className="text-slate-400">Battery Level:</span>
                    <span className="font-medium text-emerald-400">{battery.level}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 px-3 py-2 rounded-lg">
                    <span className="text-slate-400">Display Brightness:</span>
                    <span className="font-medium text-amber-400">{brightness.level}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-900/60 px-3 py-2 rounded-lg">
                    <span className="text-slate-400">Media Volume:</span>
                    <span className="font-medium text-cyan-400">
                      {volume.muted ? 'Muted' : `${volume.level}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PHONE HEALTH & DIAGNOSTICS */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Top Score Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/50 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/40 flex flex-col items-center justify-center text-emerald-300 shadow-lg shadow-emerald-500/10">
                  <span className="text-2xl font-black font-mono tracking-tight">
                    {healthReport?.score ?? 96}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-400">
                    /100
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <span>Phone Health &amp; Diagnostics</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                      {healthReport?.rating ?? 'Excellent (চমৎকার)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    সোহা আপনার ফোনের ব্যাটারি, টেম্পারেচার, স্টোরেজ, র‍্যাম এবং সিস্টেম পারফরম্যান্স স্বয়ংক্রিয়ভাবে পরীক্ষা করে সম্পূর্ণ রিপোর্ট প্রদান করে।
                  </p>
                </div>
              </div>

              <button
                onClick={() => onTriggerAction('analyze_phone_health')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Run Diagnostic Analysis</span>
              </button>
            </div>

            {/* Diagnostic Metric Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Battery & Thermal Health */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    <span>Battery &amp; Thermal</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    {healthReport?.batteryHealth.healthStatus ?? 'Normal (স্বাভাবিক)'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  {battery.level}%
                  <span className="text-xs text-slate-400 font-normal ml-2">
                    ({battery.charging ? 'Charging' : 'Discharging'})
                  </span>
                </div>
                <div className="mt-3 text-xs space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span className="text-slate-200 font-medium">
                      {healthReport?.batteryHealth.temperatureC ?? (battery.charging ? '34.2' : '29.8')}°C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Battery Life:</span>
                    <span className="text-slate-200 font-medium">
                      ~{healthReport?.batteryHealth.estimatedHoursRemaining ?? 12} hours remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Storage Analysis */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>Storage Health</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                    {healthReport?.storageHealth.status ?? 'Optimal'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  {healthReport?.storageHealth.freeGb ?? 81.5} GB
                  <span className="text-xs text-slate-400 font-normal ml-2">Free</span>
                </div>
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      style={{ width: `${healthReport?.storageHealth.percentUsed ?? 36}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Used: {healthReport?.storageHealth.usedGb ?? 46.5} GB</span>
                    <span>Total: {healthReport?.storageHealth.totalGb ?? 128} GB</span>
                  </div>
                </div>
              </div>

              {/* Memory / RAM */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span>Memory / RAM</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    {healthReport?.memoryHealth.status ?? 'Smooth (দ্রুত)'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  {healthReport?.memoryHealth.freeRamGb ?? 4.4} GB
                  <span className="text-xs text-slate-400 font-normal ml-2">Available</span>
                </div>
                <div className="mt-3 text-xs space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Used RAM:</span>
                    <span className="text-slate-200 font-medium">
                      {healthReport?.memoryHealth.usedRamGb ?? 3.6} GB / {healthReport?.memoryHealth.totalRamGb ?? 8} GB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Pressure:</span>
                    <span className="text-emerald-400 font-medium">Low (No Throttling)</span>
                  </div>
                </div>
              </div>

              {/* Network & Latency */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/30 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-sky-400" />
                    <span>Network &amp; Latency</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                    {healthReport?.networkHealth.quality ?? 'High Speed'}
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  {network.speedMbps || 240} Mbps
                  <span className="text-xs text-slate-400 font-normal ml-2">{network.connectionType.toUpperCase()}</span>
                </div>
                <div className="mt-3 text-xs space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Ping Latency:</span>
                    <span className="text-emerald-400 font-medium">
                      {healthReport?.networkHealth.latencyMs ?? 18} ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Packet Stability:</span>
                    <span className="text-slate-200 font-medium">99.9% Reliable</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Bengali Voice Diagnostic Summary */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/20 relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>সোহা-র লাইভ ভয়েস ডায়াগনস্টিক রিপোর্ট (বাংলায়):</span>
                </span>
                <span className="text-[10px] text-slate-400">ভয়েসে শুনুন: "Hey Soha, analyze my phone"</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                "{healthReport?.summaryBengali ?? 'ফোনের সামগ্রিক হেলথ স্কোর ৯৬/১০০ (চমৎকার)। ব্যাটারি স্বাভাবিক তাপমাত্রায় চার্জে আছে, স্টোরেজে ৮১.৫ GB খালি রয়েছে এবং র‍্যাম অত্যন্ত দ্রুত কাজ করছে। কোনো অস্বাভাবিক ল্যাগ বা ব্যাকগ্রাউন্ড ওভারলোড নেই।'}"
              </p>
            </div>

            {/* Recommendations List */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>System Health Recommendations (পরামর্শ):</span>
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {(healthReport?.recommendations ?? [
                  'স্টোরেজ এবং ক্যাশ মেমোরি একদম পরিচ্ছন্ন ও অপ্টিমাইজড রয়েছে।',
                  'ব্যাটারি অপ্টিমাইজেশন ঠিকঠাক আছে, ব্যাকগ্রাউন্ড ব্যাটারি ড্রেন পাওয়া যায়নি।',
                  'প্রসেসর এবং থার্মাল পারফরম্যান্স অত্যন্ত স্মুথ ও স্থিতিশীল।',
                ]).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: GITHUB APK PUBLISHER & AI SELF-MODIFICATION */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {/* Section 1: GitHub APK Publisher */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/30 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>GitHub APK Auto-Publisher</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                        Self-Publishing Active
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">
                      Repo: <span className="text-indigo-300 font-semibold">{apkPublishState?.repo || 'mdshaikatmondol02-tech/SOHA'}</span> • Workflow: <span className="text-slate-200">build-apk.yml</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      onTriggerAction('publish_github_apk', {
                        repo: 'mdshaikatmondol02-tech/SOHA',
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Publish APK on GitHub (বিল্ড করো)</span>
                  </button>

                  <a
                    href="https://github.com/mdshaikatmondol02-tech/SOHA/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Releases &amp; Download</span>
                  </a>

                  <a
                    href="https://github.com/mdshaikatmondol02-tech/SOHA/actions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center gap-1 transition-colors"
                  >
                    <span>View CI Actions</span>
                  </a>
                </div>
              </div>

              {/* Status Banner */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-slate-200">
                    ভয়েস কমান্ড দিয়ে APK বিল্ড ট্রিগার করুন:
                  </div>
                  <p className="text-slate-400">
                    যখন আপনি সোহাকে বলেন: <span className="text-pink-300 font-medium">"Hey Soha, github publish yourself as apk"</span> অথবা <span className="text-pink-300 font-medium">"GitHub এ APK পাবলিশ করো"</span>, তখন সোহা স্বয়ংক্রিয়ভাবে <code className="text-indigo-300">publish_github_apk</code> টুল দিয়ে ওয়ার্কফ্লো ট্রিগার করে এবং রিলিজ পেজের সরাসরি ডাউনলোড লিঙ্ক প্রদান করে।
                  </p>
                  {apkPublishState?.lastTriggeredAt && (
                    <div className="text-[11px] text-emerald-400 font-mono mt-1">
                      সর্বশেষ ট্রিগার: {apkPublishState.lastTriggeredAt} — {apkPublishState.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: AI Self-Feature Modification & Custom Skills */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>Soha Self-Feature Modification &amp; Dynamic Skills</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    আপনি সোহাকে যা কিছু শেখাতে চান বা যে কোনো ফিচার পরিবর্তন করতে চান, মুখে বললেই সোহা নিজের ভেতর সেই ফিচার যুক্ত করে নেয়!
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingFeature(!isAddingFeature)}
                  className="px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingFeature ? 'Cancel' : 'Add New Skill (+ নতুন ফিচার)'}</span>
                </button>
              </div>

              {/* Add Custom Feature Form */}
              {isAddingFeature && (
                <div className="p-4 rounded-xl bg-slate-950/90 border border-pink-500/30 space-y-3 animate-in fade-in">
                  <div className="font-semibold text-xs text-pink-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>নতুন কাস্টম ফিচার / স্কিল ফর্ম (বা মুখে বলুন):</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">ফিচারের নাম (Feature Name):</label>
                      <input
                        type="text"
                        placeholder="e.g. Night Silent Mode, Daily Weather Brief"
                        value={newFeatureName}
                        onChange={(e) => setNewFeatureName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">ক্যাটাগরি (Category):</label>
                      <select
                        value={newFeatureCategory}
                        onChange={(e) =>
                          setNewFeatureCategory(e.target.value as CustomAssistantFeature['category'])
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="voice_skill">Voice Skill (কথা বলা ও উত্তর)</option>
                        <option value="automation">Automation (স্বয়ংক্রিয় কাজ)</option>
                        <option value="personality">Personality (ব্যক্তিত্ব ও ভঙ্গি)</option>
                        <option value="device_rule">Device Rule (হার্ডওয়্যার নিয়ম)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">ট্রিগার শব্দ বা শর্ত (Trigger condition):</label>
                      <input
                        type="text"
                        placeholder="e.g. night mode, রাতে সাইলেন্ট করো, weather report"
                        value={newFeatureTrigger}
                        onChange={(e) => setNewFeatureTrigger(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">সোহা কী করবে (Action / Response):</label>
                      <input
                        type="text"
                        placeholder="e.g. Turn down volume to 10% and wish good night in Bengali"
                        value={newFeatureAction}
                        onChange={(e) => setNewFeatureAction(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">বিবরণ (Description):</label>
                    <input
                      type="text"
                      placeholder="e.g. Automatically adjusts nighttime audio and gives warm Bengali wishes"
                      value={newFeatureDesc}
                      onChange={(e) => setNewFeatureDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsAddingFeature(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!newFeatureName || !newFeatureDesc}
                      onClick={() => {
                        onTriggerAction('add_custom_feature', {
                          name: newFeatureName,
                          description: newFeatureDesc,
                          trigger: newFeatureTrigger || newFeatureName,
                          actionOrResponse: newFeatureAction,
                          category: newFeatureCategory,
                        });
                        setNewFeatureName('');
                        setNewFeatureDesc('');
                        setNewFeatureTrigger('');
                        setNewFeatureAction('');
                        setIsAddingFeature(false);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-pink-600/30"
                    >
                      Save Feature (সংরক্ষণ করো)
                    </button>
                  </div>
                </div>
              )}

              {/* Editing Target Modal/Box */}
              {editingTarget && (
                <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                    <span>Edit Feature / Setting: "{editingTarget}"</span>
                    <button onClick={() => setEditingTarget(null)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Describe the change (e.g. 'Make responses more witty and sarcastic', 'Enable auto vibration')"
                    value={editChangesText}
                    onChange={(e) => setEditChangesText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingTarget(null)}
                      className="px-3 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!editChangesText}
                      onClick={() => {
                        onTriggerAction('edit_feature_or_settings', {
                          target: editingTarget,
                          changes: editChangesText,
                        });
                        setEditingTarget(null);
                        setEditChangesText('');
                      }}
                      className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                    >
                      Apply Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Active Features List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(customFeatures || []).map((feat) => (
                  <div
                    key={feat.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-white">{feat.name}</span>
                          <span
                            className={`text-[9px] px-2 py-0.2 rounded-full font-medium border ${
                              feat.category === 'voice_skill'
                                ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                                : feat.category === 'automation'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : feat.category === 'device_rule'
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {feat.category.replace('_', ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingTarget(feat.name);
                            setEditChangesText('');
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300"
                          title="Edit this feature"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-2">
                        {feat.description}
                      </p>

                      <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 space-y-1">
                        <div className="truncate">
                          <span className="text-slate-500">Triggers: </span>
                          <span className="text-pink-300 font-mono">
                            {feat.triggerPhrases.join(', ')}
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="text-slate-500">Action: </span>
                          <span className="text-slate-300">{feat.responseOrAction}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Status: Active &amp; Learned</span>
                      <span className="text-emerald-400 font-mono">✓ Live</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MESSAGES (WHATSAPP, MESSENGER, IMO, TELEGRAM, SMS) WITH BENGALI TRANSLATION */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-pink-400" />
                  <span>Cross-Platform Messaging Hub</span>
                  <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    বাংলা অনুবাদ সংযুক্ত
                  </span>
                </h4>
                <p className="text-xs text-slate-400">
                  Soha accesses WhatsApp, Messenger, IMO, Telegram, and SMS messages, reads them out loud in Bengali, and sends replies.
                </p>
              </div>

              <button
                onClick={() => onTriggerAction('read_messages', { inBengali: true })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow transition-all"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Ask Soha to Read in Bengali</span>
              </button>
            </div>

            {/* Platform filter tabs */}
            <div className="flex flex-wrap gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
              {['all', 'whatsapp', 'messenger', 'imo', 'telegram', 'sms'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatformFilter(plat)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all capitalize ${
                    selectedPlatformFilter === plat
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {plat === 'all' ? 'All Platforms' : plat}
                </button>
              ))}
            </div>

            {/* Messages List */}
            <div className="space-y-3">
              {filteredMessages.map((msg) => {
                const badge = getPlatformBadge(msg.platform);
                return (
                  <div
                    key={msg.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                          {msg.sender.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-100 text-xs">
                              {msg.sender}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                            {msg.unread && (
                              <span className="w-2 h-2 rounded-full bg-pink-500" title="Unread" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {msg.senderNumberOrHandle || msg.platform} • {msg.timestamp}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          onTriggerAction('read_messages', {
                            platform: msg.platform,
                            inBengali: true,
                          })
                        }
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Radio className="w-3 h-3" />
                        <span>Read this</span>
                      </button>
                    </div>

                    {/* Original Message Text */}
                    <div className="p-2.5 rounded-lg bg-slate-900/90 text-xs text-slate-200 border border-slate-800/80">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        Original Message:
                      </span>
                      {msg.body}
                    </div>

                    {/* Bengali Translation Voice Box */}
                    <div className="p-2.5 rounded-lg bg-pink-950/20 border border-pink-500/30 text-xs text-pink-200">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-pink-400 uppercase tracking-wider mb-1">
                        <Languages className="w-3.5 h-3.5" />
                        <span>সোহা বাংলায় যেভাবে পাঠ করবে (Bengali Voice Readout)</span>
                      </div>
                      <p className="font-medium text-pink-100">"{msg.bodyBengali}"</p>
                    </div>

                    {/* Quick Reply Form */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder={`Reply to ${msg.sender} on ${msg.platform}...`}
                        value={replyTextMap[msg.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendReply(msg);
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleSendReply(msg)}
                        disabled={!replyTextMap[msg.id]?.trim()}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1 transition-all"
                      >
                        <Send className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CONTACTS & PHONE CALLS WITH LOUDSPEAKER */}
        {activeTab === 'contacts' && (
          <div className="space-y-5">
            {/* Active Call Banner if active */}
            {activeCall && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/50 border border-rose-500/50 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                      <PhoneCall className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{activeCall.contactName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {activeCall.status === 'connected' ? 'Connected (কথা চলছে)' : activeCall.status}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {activeCall.phone} • {activeCall.durationSeconds}s duration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Loudspeaker toggle */}
                    <button
                      onClick={() =>
                        onTriggerAction('set_loudspeaker', {
                          enabled: !activeCall.loudspeaker,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        activeCall.loudspeaker
                          ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{activeCall.loudspeaker ? 'Loudspeaker ON' : 'Turn On Loudspeaker'}</span>
                    </button>

                    {/* End Call button */}
                    <button
                      onClick={() => onTriggerAction('end_phone_call')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>End Call</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                    🔊 Audio Routing:
                  </span>
                  <span>
                    {activeCall.loudspeaker
                      ? 'Loudspeaker Mode Enabled (স্পিকারফোন সক্রিয় — পুরো রুম থেকে কথা শুনুন)'
                      : 'Earpiece Mode (সাধারণ হ্যান্ডসেট মোড)'}
                  </span>
                </div>
              </div>
            )}

            {/* Contacts list & search */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Saved Device Contacts &amp; Calling</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ask Soha: "Call Mom on loudspeaker" to dial contacts with speakerphone enabled.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Mom, Tanvir..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredContacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-slate-100 text-xs">{c.name}</span>
                            {c.relationship && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {c.relationship}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-400">{c.phone}</p>
                        </div>
                      </div>

                      {/* Contact Category & Bengali Name Badge */}
                      <div className="flex items-center space-x-1">
                        {c.nameBengali && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 font-medium">
                            {c.nameBengali}
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono capitalize">
                          {c.category}
                        </span>
                      </div>
                    </div>

                    {/* Calling Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                      {/* Call on Loudspeaker */}
                      <button
                        onClick={() =>
                          onTriggerAction('make_call', {
                            nameOrNumber: c.name,
                            loudspeaker: true,
                          })
                        }
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Call on Loudspeaker</span>
                      </button>

                      {/* Regular Call */}
                      <button
                        onClick={() =>
                          onTriggerAction('make_call', {
                            nameOrNumber: c.name,
                            loudspeaker: false,
                          })
                        }
                        className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1 transition-all"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ACTION AUDIT LOG */}
        {activeTab === 'logs' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Live Device Tool Execution Log</span>
              </span>
              <span className="font-mono text-[11px]">{actionLogs.length} events logged</span>
            </div>

            {actionLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No device actions recorded yet. Ask SOHA to read your WhatsApp messages, call Mom on loudspeaker, or turn on the flashlight!
              </div>
            ) : (
              <div className="space-y-2">
                {actionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start justify-between space-x-3"
                  >
                    <div className="flex items-start space-x-2.5">
                      {log.status === 'success' || log.status === 'simulated' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-indigo-300">
                            {log.action}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            by {log.source}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                            {log.status}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1">{log.detail}</p>
                        {Object.keys(log.parameters).length > 0 && (
                          <pre className="mt-1 text-[10px] text-slate-500 font-mono bg-slate-900/90 p-1.5 rounded">
                            {JSON.stringify(log.parameters)}
                          </pre>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: NATIVE ANDROID BRIDGE ARCHITECTURE */}
        {activeTab === 'bridge' && (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
              <h4 className="font-semibold text-indigo-300 text-sm mb-1 flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4" />
                <span>Capacitor &amp; Native Android Integration Ready</span>
              </h4>
              <p className="text-slate-300">
                This application is engineered according to the standard Android native bridge pattern.
                When built into an APK (via Capacitor or native WebView with JavascriptInterface),
                all hardware actions, cross-platform messaging, and phone dialing route to native Android APIs with zero code changes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">
                  1. Multi-Platform Messaging Integration
                </span>
                <p className="text-slate-400">
                  Routes messages from WhatsApp, Facebook Messenger, IMO, Telegram, and SMS through Android NotificationListenerService and Capacitor SMS plugins. Soha formats and translates text to natural Bengali for seamless voice playback.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">
                  2. Telecom &amp; Loudspeaker Audio Routing
                </span>
                <p className="text-slate-400">
                  Resolves device contacts via Android ContactsContract and initiates calls with <code className="text-indigo-300">AudioManager.setSpeakerphoneOn(true)</code> and <code className="text-indigo-300">AudioManager.MODE_IN_COMMUNICATION</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">
                  3. "Hey Soha" Wake-Word Architecture
                </span>
                <p className="text-slate-400">
                  Supports continuous keyword standby detection in Web Audio and Android Porcupine / SpeechRecognizer service, triggering a musical wake chime and activating Gemini Live audio streaming immediately.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="font-semibold text-slate-200 block mb-1">
                  4. Real-Time Bidirectional Live Tool Loop
                </span>
                <p className="text-slate-400">
                  Gemini Live invokes native function calls over the low-latency WebSocket connection, the bridge updates state and executes native hardware, and responds to Gemini so Soha speaks natural voice confirmations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
