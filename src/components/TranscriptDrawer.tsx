import React, { useState, useRef, useEffect } from 'react';
import { TranscriptItem } from '../utils/transcriptUtils';
import { MessageSquare, Send, Trash2, User, Bot, Copy, Check } from 'lucide-react';

interface TranscriptDrawerProps {
  transcripts: TranscriptItem[];
  onSendMessage: (text: string) => void;
  onClearTranscripts: () => void;
  isModelSpeaking: boolean;
  isConnected: boolean;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  transcripts,
  onSendMessage,
  onClearTranscripts,
  isModelSpeaking,
  isConnected,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts, isModelSpeaking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopyAll = () => {
    const text = transcripts
      .map((t) => `[${t.timestamp}] ${t.sender.toUpperCase()}: ${t.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100">Live Captions &amp; Transcripts</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            Full-Duplex
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {transcripts.length > 0 && (
            <>
              <button
                onClick={handleCopyAll}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy entire transcript"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={onClearTranscripts}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear transcript"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Transcript List */}
      <div ref={scrollRef} className="flex-1 p-4 space-y-3 overflow-y-auto">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <Bot className="w-8 h-8 mb-2 text-slate-600" />
            <p className="font-medium text-slate-400">Live transcript is ready.</p>
            <p className="mt-1 text-[11px] text-slate-500 max-w-xs">
              Speak using the microphone or type below. Both user queries and SOHA's spoken answers appear here in real-time.
            </p>
          </div>
        ) : (
          transcripts.map((item) => (
            <div
              key={item.id}
              className={`flex items-start space-x-2.5 ${
                item.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {item.sender === 'gemini' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  item.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <span className="font-semibold text-[10px] opacity-75">
                    {item.sender === 'user' ? 'You' : 'SOHA'}
                  </span>
                  <span className="text-[9px] opacity-50 font-mono">{item.timestamp}</span>
                </div>
                <p className="whitespace-pre-wrap">{item.text}</p>
              </div>

              {item.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-700 flex items-center justify-center text-white shrink-0 shadow">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Live typing/speaking indicator */}
        {isModelSpeaking && (
          <div className="flex items-center space-x-2 text-xs text-pink-400 animate-pulse pl-1">
            <Bot className="w-4 h-4" />
            <span className="text-[11px]">SOHA is speaking...</span>
          </div>
        )}
      </div>

      {/* Text fallback input */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isConnected ? 'Type a command or speak into mic...' : 'Connect to speak or type...'}
          className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-colors"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
