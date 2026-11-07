import React from 'react';
import {
  Sparkles,
  Flashlight,
  Battery,
  PhoneCall,
  Volume2,
  Languages,
  MessageSquare,
  MessageCircle,
  HelpCircle,
  HeartPulse,
  Github,
  Wrench,
} from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

const SAMPLE_PROMPTS = [
  {
    icon: Github,
    label: 'Publish APK on GitHub',
    prompt: 'Hey Soha, github publish yourself as apk now!',
    color: 'text-indigo-400',
    highlight: true,
  },
  {
    icon: HeartPulse,
    label: 'Analyze Phone Health (বাংলায়)',
    prompt: 'Hey Soha, analyze my phone and give me health information in Bengali!',
    color: 'text-emerald-400',
    highlight: true,
  },
  {
    icon: Wrench,
    label: 'Add Feature to Yourself',
    prompt: 'Hey Soha, add a new feature to yourself: automatically turn on night silent mode at 11 PM!',
    color: 'text-pink-400',
    highlight: true,
  },
  {
    icon: Languages,
    label: 'Read WhatsApp (বাংলায়)',
    prompt: 'Hey Soha, read out my WhatsApp messages in Bengali!',
    color: 'text-pink-400',
    highlight: true,
  },
  {
    icon: PhoneCall,
    label: 'Call Mom on Loudspeaker',
    prompt: 'Hey Soha, call Mom and put the call on loudspeaker please!',
    color: 'text-cyan-400',
    highlight: true,
  },
  {
    icon: MessageSquare,
    label: 'Reply to Tanvir (Messenger)',
    prompt: 'Hey Soha, reply to Tanvir on Messenger saying "I am on my way, wait 10 minutes".',
    color: 'text-blue-400',
  },
  {
    icon: MessageCircle,
    label: 'Check IMO & Telegram',
    prompt: 'Soha, do I have any new messages on IMO or Telegram? Read them out to me in Bengali.',
    color: 'text-emerald-400',
  },
  {
    icon: Volume2,
    label: 'Turn on Loudspeaker',
    prompt: 'Put the phone call on loudspeaker mode, Soha.',
    color: 'text-indigo-400',
  },
  {
    icon: Flashlight,
    label: 'Turn on torch',
    prompt: "Hey Soha, turn on the flashlight! It's way too dark in here.",
    color: 'text-yellow-400',
  },
  {
    icon: Battery,
    label: 'Battery status',
    prompt: "Soha, how's my battery holding up today? Be honest.",
    color: 'text-emerald-400',
  },
  {
    icon: Sparkles,
    label: 'Witty one-liner',
    prompt: 'Hit me with one of your quick sassy one-liners, Soha!',
    color: 'text-pink-400',
  },
  {
    icon: HelpCircle,
    label: 'What can you do?',
    prompt: 'What kind of messaging, calling, and Android magic can you handle, Soha?',
    color: 'text-sky-400',
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, disabled }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Voice &amp; Device Commands ("Hey Soha")</span>
        </div>
        <span className="text-[10px] text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
          WhatsApp • IMO • Loudspeaker Calling • বাংলা
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {SAMPLE_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(item.prompt)}
              className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs text-slate-300 transition-all disabled:opacity-50 ${
                item.highlight
                  ? 'bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-indigo-950/40 border-pink-500/30 hover:border-pink-500/60 text-pink-200'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${item.color} group-hover:scale-110 transition-transform`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
