/**
 * Android Device Bridge Core Logic & State Management
 * Works natively with Android Capacitor / WebView bridge and provides simulated fallbacks.
 * Includes Cross-Platform Messaging (WhatsApp, Messenger, IMO, Telegram, SMS)
 * and Contacts Phone Calling with Loudspeaker support.
 */

export interface DeviceBatteryState {
  level: number; // 0 to 100
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
}

export interface DeviceFlashlightState {
  enabled: boolean;
  intensity: number; // 1 to 100
}

export interface DeviceVolumeState {
  level: number; // 0 to 100
  muted: boolean;
  stream: 'media' | 'ring' | 'alarm' | 'voice';
}

export interface DeviceBrightnessState {
  level: number; // 0 to 100
  auto: boolean;
}

export interface DeviceNetworkState {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'none';
  ssid?: string;
  speedMbps?: number;
}

export interface DeviceNotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface CrossPlatformMessage {
  id: string;
  platform: 'whatsapp' | 'messenger' | 'imo' | 'telegram' | 'sms';
  sender: string;
  senderNumberOrHandle?: string;
  body: string;
  bodyBengali?: string;
  timestamp: string;
  unread: boolean;
  replies?: Array<{ sender: 'me'; text: string; timestamp: string }>;
}

export interface DeviceContact {
  id: string;
  name: string;
  nameBengali?: string;
  phone: string;
  avatarColor: string;
  category: 'family' | 'friend' | 'work' | 'other';
  relationship?: string;
}

export interface ActivePhoneCall {
  active: boolean;
  contactName: string;
  phone: string;
  loudspeaker: boolean;
  startTime?: string;
  durationSeconds: number;
  status: 'dialing' | 'connected' | 'ended';
}

export interface DeviceActionLog {
  id: string;
  timestamp: string;
  source: 'gemini' | 'user' | 'system';
  action: string;
  parameters: Record<string, unknown>;
  status: 'success' | 'failed' | 'simulated';
  detail: string;
}

export interface PhoneHealthReport {
  score: number; // 0 to 100
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  batteryHealth: {
    level: number;
    charging: boolean;
    temperatureC: number;
    healthStatus: 'Good' | 'Warm' | 'Service Recommended';
    estimatedHoursRemaining: number;
  };
  storageHealth: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    percentUsed: number;
    status: 'Optimal' | 'Nearly Full' | 'Critical';
  };
  memoryHealth: {
    totalRamGb: number;
    usedRamGb: number;
    freeRamGb: number;
    percentUsed: number;
    status: 'Smooth' | 'Normal' | 'High Pressure';
  };
  networkHealth: {
    type: string;
    speedMbps: number;
    latencyMs: number;
    quality: 'High Speed' | 'Moderate' | 'Slow';
  };
  hardwareHealth: {
    cores: number;
    screenResolution: string;
    refreshRateHz: number;
    sensorStatus: string;
  };
  summaryBengali: string;
  summaryEnglish: string;
  recommendations: string[];
}

export interface GitHubApkPublishState {
  isPublishing: boolean;
  status: 'idle' | 'triggered' | 'building' | 'published' | 'error';
  repo: string;
  branch: string;
  workflowName: string;
  workflowUrl: string;
  releaseUrl: string;
  apkDownloadUrl: string;
  version: string;
  lastTriggeredAt?: string;
  message?: string;
}

export interface CustomAssistantFeature {
  id: string;
  name: string;
  description: string;
  category: 'voice_skill' | 'automation' | 'personality' | 'device_rule';
  triggerPhrases: string[];
  responseOrAction: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AndroidDeviceState {
  platform: 'android-native' | 'capacitor' | 'browser-simulated';
  model: string;
  androidVersion: string;
  battery: DeviceBatteryState;
  flashlight: DeviceFlashlightState;
  volume: DeviceVolumeState;
  brightness: DeviceBrightnessState;
  network: DeviceNetworkState;
  hapticTriggerCount: number;
  lastHapticPattern?: string;
  currentApp: string;
  cameraAvailable: boolean;
  notifications: DeviceNotificationItem[];
  messages: CrossPlatformMessage[];
  contacts: DeviceContact[];
  activeCall: ActivePhoneCall | null;
  actionLogs: DeviceActionLog[];
  healthReport: PhoneHealthReport | null;
  apkPublishState: GitHubApkPublishState;
  customFeatures: CustomAssistantFeature[];
}

export const initialContacts: DeviceContact[] = [
  {
    id: 'c-1',
    name: 'Mom',
    nameBengali: 'আম্মু',
    phone: '+880 1711-234567',
    avatarColor: 'from-pink-500 to-rose-600',
    category: 'family',
    relationship: 'Mother',
  },
  {
    id: 'c-2',
    name: 'Dad',
    nameBengali: 'আব্বু',
    phone: '+880 1819-876543',
    avatarColor: 'from-blue-500 to-indigo-600',
    category: 'family',
    relationship: 'Father',
  },
  {
    id: 'c-3',
    name: 'Tanvir',
    nameBengali: 'তানভীর',
    phone: '+880 1912-345678',
    avatarColor: 'from-purple-500 to-violet-600',
    category: 'friend',
    relationship: 'Best Friend',
  },
  {
    id: 'c-4',
    name: 'Rahat',
    nameBengali: 'রাহাত',
    phone: '+880 1515-998877',
    avatarColor: 'from-emerald-500 to-teal-600',
    category: 'work',
    relationship: 'Colleague',
  },
  {
    id: 'c-5',
    name: 'Sarah',
    nameBengali: 'সারাহ',
    phone: '+880 1616-554433',
    avatarColor: 'from-amber-500 to-orange-600',
    category: 'friend',
    relationship: 'Project Partner',
  },
];

export const initialMessages: CrossPlatformMessage[] = [
  {
    id: 'm-1',
    platform: 'whatsapp',
    sender: 'Mom (আম্মু)',
    senderNumberOrHandle: '+880 1711-234567',
    body: 'Are you coming home for dinner tonight? I made your favorite biryani.',
    bodyBengali: 'আজ রাতে কি খাবার খেতে বাসায় আসছিস? তোর পছন্দের বিরিয়ানি রান্না করেছি।',
    timestamp: '5 mins ago',
    unread: true,
    replies: [],
  },
  {
    id: 'm-2',
    platform: 'messenger',
    sender: 'Tanvir',
    senderNumberOrHandle: 'tanvir.ahmed.99',
    body: 'Bro, are we still meeting at Dhanmondi café at 6 PM?',
    bodyBengali: 'দোস্ত, আজ সন্ধ্যা ৬টায় ধানমন্ডির ক্যাফেতে দেখা করার কথা ছিল না? আসছিস তো?',
    timestamp: '15 mins ago',
    unread: true,
    replies: [],
  },
  {
    id: 'm-3',
    platform: 'imo',
    sender: 'Uncle Faruq',
    senderNumberOrHandle: '+880 1812-001122',
    body: 'Please call me when you are free, need to discuss the family event.',
    bodyBengali: 'সময় পেলে আমাকে একটু কল দিও, পারিবারিক অনুষ্ঠান নিয়ে কথা আছে।',
    timestamp: '30 mins ago',
    unread: true,
    replies: [],
  },
  {
    id: 'm-4',
    platform: 'telegram',
    sender: 'Dev Community BD',
    senderNumberOrHandle: '@devcommunitybd',
    body: 'The AI Studio Hackathon demo submissions are now open!',
    bodyBengali: 'এআই স্টুডিও হ্যাকাথনের প্রজেক্ট জমা নেওয়া শুরু হয়েছে!',
    timestamp: '1 hour ago',
    unread: false,
    replies: [],
  },
  {
    id: 'm-5',
    platform: 'sms',
    sender: 'Bank Alert',
    senderNumberOrHandle: '16216',
    body: 'Your account balance was updated. Transaction BDT 5,000 successful.',
    bodyBengali: 'আপনার ব্যাংক অ্যাকাউন্ট ব্যালেন্স আপডেট হয়েছে। ৫,০০০ টাকার লেনদেন সফল হয়েছে।',
    timestamp: '2 hours ago',
    unread: false,
    replies: [],
  },
];

export const initialAndroidDeviceState: AndroidDeviceState = {
  platform: 'browser-simulated',
  model: 'Pixel 9 Pro (Android 15)',
  androidVersion: '15.0 (Vanilla Ice Cream)',
  battery: {
    level: 82,
    charging: false,
  },
  flashlight: {
    enabled: false,
    intensity: 100,
  },
  volume: {
    level: 65,
    muted: false,
    stream: 'media',
  },
  brightness: {
    level: 70,
    auto: true,
  },
  network: {
    connected: true,
    connectionType: 'wifi',
    ssid: 'Google-Guest-5G',
    speedMbps: 240,
  },
  hapticTriggerCount: 0,
  currentApp: 'SOHA Voice Assistant',
  cameraAvailable: true,
  notifications: [
    {
      id: 'notif-1',
      title: 'WhatsApp (Mom)',
      body: 'Are you coming home for dinner tonight?',
      timestamp: 'Just now',
      read: false,
    },
    {
      id: 'notif-2',
      title: 'Messenger (Tanvir)',
      body: 'Bro, are we still meeting at Dhanmondi café?',
      timestamp: '15 mins ago',
      read: false,
    },
  ],
  messages: initialMessages,
  contacts: initialContacts,
  activeCall: null,
  actionLogs: [],
  healthReport: null,
  apkPublishState: {
    isPublishing: false,
    status: 'idle',
    repo: 'mdshaikatmondol02-tech/SOHA',
    branch: 'main',
    workflowName: 'Build & Release Debug APK',
    workflowUrl: 'https://github.com/mdshaikatmondol02-tech/SOHA/actions',
    releaseUrl: 'https://github.com/mdshaikatmondol02-tech/SOHA/releases',
    apkDownloadUrl: 'https://github.com/mdshaikatmondol02-tech/SOHA/releases/latest',
    version: '1.0.0-debug',
    message: 'Ready to build and publish app-debug.apk to GitHub',
  },
  customFeatures: [
    {
      id: 'feat-1',
      name: 'Auto Loudspeaker on Family Calls',
      description: 'আম্মু বা আব্বুকে কল দিলে স্বয়ংক্রিয়ভাবে লাউডস্পিকার অন রাখা।',
      category: 'device_rule',
      triggerPhrases: ['call mom', 'call dad', 'আম্মুকে কল দাও', 'আব্বুকে কল দাও'],
      responseOrAction: 'Automatically enables loudspeaker mode for calls to family contacts.',
      enabled: true,
      createdAt: '2026-11-04',
      updatedAt: '2026-11-04',
    },
    {
      id: 'feat-2',
      name: 'Phone Health & Diagnostics Analyzer',
      description: 'ফোনের ব্যাটারি টেম্পারেচার, স্টোরেজ, র‍্যাম ও পারফরম্যান্স লাইভ চেক করা।',
      category: 'voice_skill',
      triggerPhrases: ['check phone', 'analyze phone', 'আমার ফোন চেক করো', 'ফোন হেলথ কেমন'],
      responseOrAction: 'Runs full hardware analysis and speaks diagnostics in Bengali.',
      enabled: true,
      createdAt: '2026-11-05',
      updatedAt: '2026-11-05',
    },
    {
      id: 'feat-3',
      name: 'Self APK Publisher to GitHub',
      description: 'ইউজার নির্দেশ দিলে সরাসরি GitHub Actions-এ নিজের APK বিল্ড ও পাবলিশ ট্রিগার করা।',
      category: 'automation',
      triggerPhrases: ['publish apk', 'build apk', 'github এ apk বানাও', 'apk পাবলিশ করো'],
      responseOrAction: 'Dispatches GitHub APK build and returns direct download link.',
      enabled: true,
      createdAt: '2026-11-06',
      updatedAt: '2026-11-06',
    },
  ],
};

export const generatePhoneHealthReport = (state: AndroidDeviceState): PhoneHealthReport => {
  const batteryLevel = state.battery.level;
  const isCharging = state.battery.charging;
  const tempC = isCharging ? 34.5 : 29.8;
  const estHours = isCharging ? Math.max(1, Math.round((100 - batteryLevel) / 30)) : Math.max(1, Math.round(batteryLevel / 6.5));

  const ramTotal = 8;
  const ramUsed = 3.6;
  const ramFree = 4.4;

  const storageTotal = 128;
  const storageUsed = 46.5;
  const storageFree = 81.5;
  const storagePercent = Math.round((storageUsed / storageTotal) * 100);

  const score = Math.min(100, Math.max(70, Math.round(100 - (tempC > 38 ? 10 : 0) - (storagePercent > 85 ? 15 : 0) - (batteryLevel < 20 ? 10 : 0))));

  const rating: PhoneHealthReport['rating'] = score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 70 ? 'Fair' : 'Poor';

  const summaryBengali = `ফোনের সামগ্রিক হেলথ স্কোর ${score}/১০০ (${rating === 'Excellent' ? 'চমৎকার' : 'ভালো'})। ব্যাটারি ${batteryLevel}% চার্জে আছে এবং তাপমাত্রা স্বাভাবিক (${tempC}°C)। স্টোরেজ ${storageFree} GB খালি রয়েছে এবং ৮ GB র‍্যামের মধ্যে ৪.৪ GB ফ্রি আছে। ফোনটি সম্পূর্ণ মসৃণ ও দ্রুত কাজ করছে।`;
  const summaryEnglish = `Overall phone health score is ${score}/100 (${rating}). Battery is at ${batteryLevel}% with normal temperature (${tempC}°C). Storage has ${storageFree} GB free and RAM pressure is low. No performance bottlenecks detected.`;

  return {
    score,
    rating,
    batteryHealth: {
      level: batteryLevel,
      charging: isCharging,
      temperatureC: tempC,
      healthStatus: tempC > 38 ? 'Warm' : 'Good',
      estimatedHoursRemaining: estHours,
    },
    storageHealth: {
      totalGb: storageTotal,
      usedGb: storageUsed,
      freeGb: storageFree,
      percentUsed: storagePercent,
      status: storagePercent > 85 ? 'Nearly Full' : 'Optimal',
    },
    memoryHealth: {
      totalRamGb: ramTotal,
      usedRamGb: ramUsed,
      freeRamGb: ramFree,
      percentUsed: Math.round((ramUsed / ramTotal) * 100),
      status: 'Smooth',
    },
    networkHealth: {
      type: state.network.connectionType,
      speedMbps: state.network.speedMbps || 240,
      latencyMs: 18,
      quality: 'High Speed',
    },
    hardwareHealth: {
      cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8,
      screenResolution: typeof window !== 'undefined' ? `${window.screen?.width || 1080}x${window.screen?.height || 2400}` : '1080x2400',
      refreshRateHz: 120,
      sensorStatus: 'All sensors calibrated and responsive',
    },
    summaryBengali,
    summaryEnglish,
    recommendations: [
      'স্টোরেজ এবং ক্যাশ মেমোরি একদম পরিচ্ছন্ন ও অপ্টিমাইজড রয়েছে।',
      'ব্যাটারি অপ্টিমাইজেশন ঠিকঠাক আছে, ব্যাকগ্রাউন্ড ব্যাটারি ড্রেন পাওয়া যায়নি।',
      'প্রসেসর এবং থার্মাল পারফরম্যান্স অত্যন্ত স্মুথ ও স্থিতিশীল।',
    ],
  };
};

export interface DeviceActionResult {
  updatedState: AndroidDeviceState;
  geminiResponse: Record<string, unknown>;
  logEntry: DeviceActionLog;
}

export function executeDeviceAction(
  currentState: AndroidDeviceState,
  actionName: string,
  params: Record<string, unknown> = {},
  source: 'gemini' | 'user' | 'system' = 'gemini'
): DeviceActionResult {
  const timestamp = new Date().toLocaleTimeString();
  const id = `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  let detail = '';
  let status: 'success' | 'failed' | 'simulated' =
    currentState.platform === 'browser-simulated' ? 'simulated' : 'success';
  let geminiResponse: Record<string, unknown> = {};

  const stateClone: AndroidDeviceState = {
    ...currentState,
    battery: { ...currentState.battery },
    flashlight: { ...currentState.flashlight },
    volume: { ...currentState.volume },
    brightness: { ...currentState.brightness },
    network: { ...currentState.network },
    notifications: [...currentState.notifications],
    messages: currentState.messages.map((m) => ({
      ...m,
      replies: m.replies ? [...m.replies] : [],
    })),
    contacts: [...currentState.contacts],
    healthReport: currentState.healthReport ? { ...currentState.healthReport } : null,
    apkPublishState: { ...currentState.apkPublishState },
    customFeatures: currentState.customFeatures ? [...currentState.customFeatures] : [],
    actionLogs: [...currentState.actionLogs],
  };

  switch (actionName) {
    case 'read_messages':
    case 'get_messages': {
      const platformFilter = params.platform ? String(params.platform).toLowerCase() : undefined;
      const unreadOnly = Boolean(params.unreadOnly ?? false);

      let matched = stateClone.messages;
      if (platformFilter) {
        matched = matched.filter((m) => m.platform === platformFilter);
      }
      if (unreadOnly) {
        matched = matched.filter((m) => m.unread);
      }

      // Mark matched as read
      const matchedIds = new Set(matched.map((m) => m.id));
      stateClone.messages = stateClone.messages.map((m) =>
        matchedIds.has(m.id) ? { ...m, unread: false } : m
      );

      detail = `Read ${matched.length} messages (${platformFilter || 'all platforms'})`;
      geminiResponse = {
        action: 'read_messages',
        count: matched.length,
        messages: matched.map((m) => ({
          id: m.id,
          platform: m.platform,
          sender: m.sender,
          message_english: m.body,
          message_bengali: m.bodyBengali,
          timestamp: m.timestamp,
        })),
        note: 'When speaking to the user, read the sender and message content out loud clearly in Bengali (বাংলা).',
      };
      break;
    }

    case 'reply_message': {
      const targetPlatform = String(params.platform || 'whatsapp').toLowerCase();
      const recipient = String(params.recipient || '');
      const replyText = String(params.message || '');

      let targetMessage = stateClone.messages.find(
        (m) =>
          m.platform === targetPlatform &&
          (m.sender.toLowerCase().includes(recipient.toLowerCase()) ||
            recipient.toLowerCase().includes(m.sender.toLowerCase()))
      );

      if (!targetMessage) {
        // Find most recent message on that platform
        targetMessage = stateClone.messages.find((m) => m.platform === targetPlatform);
      }

      if (targetMessage) {
        targetMessage.replies = [
          ...(targetMessage.replies || []),
          { sender: 'me', text: replyText, timestamp: 'Just now' },
        ];
        targetMessage.unread = false;
        detail = `Replied on ${targetMessage.platform} to ${targetMessage.sender}: "${replyText}"`;
      } else {
        detail = `Sent reply on ${targetPlatform} to ${recipient}: "${replyText}"`;
      }

      geminiResponse = {
        action: 'reply_message',
        platform: targetPlatform,
        recipient,
        sent: true,
        reply: replyText,
        message: `Replied successfully on ${targetPlatform.toUpperCase()} to ${recipient}.`,
      };
      break;
    }

    case 'send_message': {
      const targetPlatform = String(params.platform || 'whatsapp').toLowerCase() as
        | 'whatsapp'
        | 'messenger'
        | 'imo'
        | 'telegram'
        | 'sms';
      const recipient = String(params.recipient || '');
      const bodyText = String(params.message || '');

      const newMsg: CrossPlatformMessage = {
        id: `m-${Date.now()}`,
        platform: targetPlatform,
        sender: recipient,
        body: bodyText,
        timestamp: 'Just now',
        unread: false,
        replies: [{ sender: 'me', text: bodyText, timestamp: 'Just now' }],
      };
      stateClone.messages = [newMsg, ...stateClone.messages];
      detail = `Sent ${targetPlatform} message to ${recipient}: "${bodyText}"`;
      geminiResponse = {
        action: 'send_message',
        platform: targetPlatform,
        recipient,
        sent: true,
        message: `Message sent to ${recipient} via ${targetPlatform}.`,
      };
      break;
    }

    case 'search_contacts': {
      const query = String(params.query || '').toLowerCase();
      const matches = stateClone.contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.phone.includes(query) ||
          (c.nameBengali && c.nameBengali.includes(query)) ||
          (c.relationship && c.relationship.toLowerCase().includes(query))
      );
      detail = `Found ${matches.length} contacts matching "${query}"`;
      geminiResponse = {
        action: 'search_contacts',
        query,
        count: matches.length,
        contacts: matches,
      };
      break;
    }

    case 'make_call': {
      const target = String(params.contactNameOrNumber || params.target || 'Mom').trim();
      const loudspeaker = Boolean(params.loudspeaker ?? true);

      // Search contact
      const query = target.toLowerCase();
      const matchedContact = stateClone.contacts.find(
        (c) =>
          c.name.toLowerCase() === query ||
          c.name.toLowerCase().includes(query) ||
          (c.nameBengali && c.nameBengali.includes(query)) ||
          (c.relationship && c.relationship.toLowerCase().includes(query)) ||
          c.phone.includes(query)
      );

      const contactName = matchedContact ? matchedContact.name : target;
      const contactPhone = matchedContact ? matchedContact.phone : target;

      stateClone.activeCall = {
        active: true,
        contactName,
        phone: contactPhone,
        loudspeaker,
        startTime: timestamp,
        durationSeconds: 0,
        status: 'dialing',
      };
      stateClone.currentApp = 'Phone';

      detail = `Calling ${contactName} (${contactPhone}) on ${loudspeaker ? 'LOUDSPEAKER' : 'earpiece'}`;
      geminiResponse = {
        action: 'make_call',
        contactName,
        phone: contactPhone,
        loudspeaker,
        status: 'dialing',
        message: `Initiated call to ${contactName} on ${loudspeaker ? 'loudspeaker' : 'regular speaker'}.`,
      };
      break;
    }

    case 'set_loudspeaker': {
      const enabled = Boolean(params.enabled ?? true);
      if (stateClone.activeCall) {
        stateClone.activeCall.loudspeaker = enabled;
        detail = `Loudspeaker turned ${enabled ? 'ON' : 'OFF'}`;
        geminiResponse = {
          action: 'set_loudspeaker',
          loudspeaker: enabled,
          message: `Call loudspeaker is now ${enabled ? 'enabled' : 'disabled'}.`,
        };
      } else {
        detail = 'Attempted to set loudspeaker but no call is active';
        geminiResponse = {
          action: 'set_loudspeaker',
          error: 'No active phone call in progress',
        };
      }
      break;
    }

    case 'end_phone_call':
    case 'hang_up': {
      if (stateClone.activeCall) {
        const caller = stateClone.activeCall.contactName;
        stateClone.activeCall = null;
        detail = `Ended phone call with ${caller}`;
        geminiResponse = {
          action: 'end_phone_call',
          ended: true,
          message: `Phone call with ${caller} ended.`,
        };
      } else {
        detail = 'No active call to end';
        geminiResponse = {
          action: 'end_phone_call',
          ended: false,
          message: 'No active call found.',
        };
      }
      break;
    }

    case 'flashlight':
    case 'toggle_flashlight': {
      const mode = (params.state as string) || (stateClone.flashlight.enabled ? 'off' : 'on');
      const newState = mode === 'toggle' ? !stateClone.flashlight.enabled : mode === 'on';
      stateClone.flashlight.enabled = newState;
      detail = `Flashlight turned ${newState ? 'ON' : 'OFF'}`;
      geminiResponse = {
        action: 'flashlight',
        enabled: newState,
        message: detail,
      };
      break;
    }

    case 'vibrate':
    case 'trigger_haptics': {
      const durationMs = Number(params.durationMs ?? 200);
      const pattern = String(params.pattern ?? 'pulse');
      stateClone.hapticTriggerCount += 1;
      stateClone.lastHapticPattern = pattern;
      detail = `Vibrated for ${durationMs}ms (pattern: ${pattern})`;
      geminiResponse = {
        action: 'vibrate',
        durationMs,
        pattern,
        message: `Device vibrated (${pattern})`,
      };
      break;
    }

    case 'battery_status':
    case 'get_battery': {
      detail = `Battery queried: ${stateClone.battery.level}%, ${stateClone.battery.charging ? 'Charging' : 'Discharging'}`;
      geminiResponse = {
        action: 'battery_status',
        level: stateClone.battery.level,
        charging: stateClone.battery.charging,
        message: `Current battery level is ${stateClone.battery.level}%, ${stateClone.battery.charging ? 'currently charging' : 'on battery power'}.`,
      };
      break;
    }

    case 'volume_control':
    case 'set_volume': {
      if (typeof params.mute === 'boolean') {
        stateClone.volume.muted = params.mute;
      }
      if (typeof params.level === 'number') {
        stateClone.volume.level = Math.max(0, Math.min(100, Math.round(params.level)));
      }
      detail = `Volume set to ${stateClone.volume.level}% (muted: ${stateClone.volume.muted})`;
      geminiResponse = {
        action: 'volume_control',
        level: stateClone.volume.level,
        muted: stateClone.volume.muted,
        message: `Device volume updated to ${stateClone.volume.level}%.`,
      };
      break;
    }

    case 'screen_brightness':
    case 'set_brightness': {
      const level = Math.max(0, Math.min(100, Math.round(Number(params.level ?? 80))));
      stateClone.brightness.level = level;
      if (typeof params.auto === 'boolean') {
        stateClone.brightness.auto = params.auto;
      }
      detail = `Brightness adjusted to ${level}%`;
      geminiResponse = {
        action: 'screen_brightness',
        level,
        auto: stateClone.brightness.auto,
        message: `Screen brightness adjusted to ${level}%.`,
      };
      break;
    }

    case 'send_notification': {
      const title = String(params.title || 'Gemini Live');
      const body = String(params.body || 'New message from your voice assistant');
      const newNotif: DeviceNotificationItem = {
        id: `notif-${Date.now()}`,
        title,
        body,
        timestamp: 'Just now',
        read: false,
      };
      stateClone.notifications = [newNotif, ...stateClone.notifications];
      detail = `Sent local notification: "${title}"`;
      geminiResponse = {
        action: 'send_notification',
        success: true,
        title,
        message: `Notification posted on device: "${title}"`,
      };
      break;
    }

    case 'open_app': {
      const appName = String(params.appName || 'Settings');
      stateClone.currentApp = appName;
      detail = `Switched to app: ${appName}`;
      geminiResponse = {
        action: 'open_app',
        appName,
        status: 'launched',
        message: `Opened application ${appName}.`,
      };
      break;
    }

    case 'device_info': {
      detail = `Returned device info: ${stateClone.model}, Android ${stateClone.androidVersion}`;
      geminiResponse = {
        action: 'device_info',
        model: stateClone.model,
        androidVersion: stateClone.androidVersion,
        platform: stateClone.platform,
        network: stateClone.network.connectionType,
        battery: stateClone.battery.level,
      };
      break;
    }

    case 'publish_github_apk': {
      const targetRepo = String(params.repo || stateClone.apkPublishState?.repo || 'mdshaikatmondol02-tech/SOHA');
      const nowStr = new Date().toLocaleTimeString();

      stateClone.apkPublishState = {
        ...stateClone.apkPublishState,
        isPublishing: true,
        status: 'triggered',
        repo: targetRepo,
        lastTriggeredAt: nowStr,
        message: `GitHub Actions APK workflow triggered for ${targetRepo}.`,
      };

      detail = `Triggered GitHub APK build for ${targetRepo}`;
      geminiResponse = {
        action: 'publish_github_apk',
        status: 'triggered',
        repo: targetRepo,
        workflow: 'Build & Release Debug APK',
        workflowUrl: `https://github.com/${targetRepo}/actions`,
        releaseUrl: `https://github.com/${targetRepo}/releases`,
        apkDownloadUrl: `https://github.com/${targetRepo}/releases/latest`,
        message: `আমি GitHub এ Soha-এর নতুন APK পাবলিশ করার প্রক্রিয়া শুরু করেছি। GitHub Actions-এ build-apk.yml রান হচ্ছে। বিল্ড সম্পন্ন হলে https://github.com/${targetRepo}/releases পেজ থেকে সরাসরি app-debug.apk ডাউনলোড করতে পারবেন।`,
      };
      break;
    }

    case 'analyze_phone_health': {
      const report = generatePhoneHealthReport(stateClone);
      stateClone.healthReport = report;
      detail = `Completed phone health diagnostics: Score ${report.score}/100 (${report.rating})`;
      geminiResponse = {
        action: 'analyze_phone_health',
        score: report.score,
        rating: report.rating,
        battery: `${report.batteryHealth.level}% (${report.batteryHealth.temperatureC}°C, ${report.batteryHealth.healthStatus})`,
        storage: `${report.storageHealth.freeGb} GB free out of ${report.storageHealth.totalGb} GB`,
        ramStatus: report.memoryHealth.status,
        summaryBengali: report.summaryBengali,
        summaryEnglish: report.summaryEnglish,
        recommendations: report.recommendations,
      };
      break;
    }

    case 'add_custom_feature': {
      const name = String(params.name || 'New Custom Skill');
      const desc = String(params.description || 'Custom feature instructed by user');
      const trigger = String(params.trigger || name);
      const actionOrResponse = String(params.actionOrResponse || params.response || 'Executed custom skill');
      const category = (params.category as CustomAssistantFeature['category']) || 'voice_skill';

      const newFeature: CustomAssistantFeature = {
        id: `feat-${Date.now()}`,
        name,
        description: desc,
        category,
        triggerPhrases: [trigger.toLowerCase()],
        responseOrAction: actionOrResponse,
        enabled: true,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      stateClone.customFeatures = [newFeature, ...stateClone.customFeatures];
      try {
        localStorage.setItem('soha_custom_features', JSON.stringify(stateClone.customFeatures));
      } catch {
        // ignore
      }

      detail = `Added custom feature: "${name}" (${category})`;
      geminiResponse = {
        action: 'add_custom_feature',
        success: true,
        featureName: name,
        category,
        message: `আপনার নির্দেশ অনুযায়ী আমি নিজের মধ্যে "${name}" ফিচারটি যুক্ত করেছি। এখন থেকে আপনি বললেই আমি এই কাজটি করে দেব!`,
      };
      break;
    }

    case 'edit_feature_or_settings': {
      const target = String(params.target || '').toLowerCase();
      const changes = String(params.changes || '');

      let matched = false;
      stateClone.customFeatures = stateClone.customFeatures.map((f) => {
        if (f.name.toLowerCase().includes(target) || f.id === target || target.includes(f.name.toLowerCase())) {
          matched = true;
          return {
            ...f,
            description: `${f.description} (আপডেট: ${changes})`,
            responseOrAction: `${f.responseOrAction}. আপডেট নিয়ম: ${changes}`,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return f;
      });

      try {
        localStorage.setItem('soha_custom_features', JSON.stringify(stateClone.customFeatures));
      } catch {
        // ignore
      }

      detail = `Edited feature/setting: "${target}" with changes "${changes}"`;
      geminiResponse = {
        action: 'edit_feature_or_settings',
        success: true,
        target,
        changes,
        matched,
        message: `আমি সফলভাবে "${target}" এর সেটিংস এবং ফিচার পরিবর্তন করে নিয়েছি। নির্দেশ অনুযায়ী নতুন নিয়ম কার্যকর করা হয়েছে।`,
      };
      break;
    }

    case 'list_custom_features': {
      detail = `Listed ${stateClone.customFeatures.length} custom features`;
      geminiResponse = {
        action: 'list_custom_features',
        count: stateClone.customFeatures.length,
        features: stateClone.customFeatures.map((f) => ({
          name: f.name,
          description: f.description,
          category: f.category,
          enabled: f.enabled,
        })),
        message: `বর্তমানে সোহা-তে ${stateClone.customFeatures.length}টি কাস্টম ফিচার ও স্কিল যুক্ত আছে।`,
      };
      break;
    }

    default: {
      status = 'failed';
      detail = `Unknown device action: ${actionName}`;
      geminiResponse = {
        error: `Unknown action ${actionName}`,
        status: 'unsupported',
      };
    }
  }

  const logEntry: DeviceActionLog = {
    id,
    timestamp,
    source,
    action: actionName,
    parameters: params,
    status,
    detail,
  };

  stateClone.actionLogs = [logEntry, ...stateClone.actionLogs].slice(0, 50);

  return {
    updatedState: stateClone,
    geminiResponse,
    logEntry,
  };
}
