/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, Environment } from "../types";
import { Send, Sparkles, User, RefreshCw, Hammer, AlertTriangle } from "lucide-react";

interface AgentChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
  isBreakfast: boolean;
}

export const AgentChat: React.FC<AgentChatProps> = ({ messages, onSendMessage, isThinking, isBreakfast }) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const suggestPrompt = (text: string) => {
    if (isThinking) return;
    onSendMessage(text);
  };

  // Prompts adapted dynamically based on morning/lunch hour
  const suggestedPrompts = isBreakfast 
    ? [
        "I'm hungry, suggest a breakfast combination 🥞",
        "What is the delivery scenario today? 🌧️",
        "Redeem a free hash brown for 500 points 🎁",
        "Checkout the order and generate payment links 💳"
      ]
    : [
        "Suggest a delicious dinner burger and fries combo 🍔",
        "Is there a coupon for Big Mac or lunch burgers? 🎟️",
        "Suggest high protein lunch options 🍗",
        "Ready to checkout! 💳"
      ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[520px]" id="agent-chat-container">
      {/* Chat Header */}
      <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between rounded-t-2xl border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-white fill-white/20" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-sm">Mickey AI Agent</h3>
            <p className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">Powering Skill-Driven Brain</p>
          </div>
        </div>
        
        <span className="text-[10px] px-2 py-0.5 font-mono bg-blue-950/60 border border-blue-850/40 text-blue-400 font-bold rounded-full">
          GEMINI LITE
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-3">
            <Sparkles className="w-10 h-10 text-slate-300 animate-bounce" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-600">Start Your Ordering Dialogue</p>
              <p className="text-xs max-w-xs mx-auto leading-relaxed">
                Mickey reads your simulated weather, distance, and time parameters, matching rules in active skills, and directs the MCP limbs!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isSystem = msg.sender === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-full text-center">
                      ℹ️ {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
                  {/* Avatar left */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shadow-xs text-slate-600 shrink-0 self-end">
                      M
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className="max-w-[85%] space-y-1.5">
                    <div
                      className={`rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-blue-600 text-white rounded-br-none font-medium"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-none font-sans whitespace-pre-wrap"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Fired MCP logs subcard */}
                    {msg.mcpCalls && msg.mcpCalls.length > 0 && (
                      <div className="bg-slate-900 rounded-lg p-2.5 border border-slate-800 font-mono text-[9px] text-slate-300 space-y-1.5 shadow-sm">
                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
                          🛠️ Fired Decoupled MCP Tools ({msg.mcpCalls.length})
                        </span>
                        {msg.mcpCalls.map(call => {
                          const isSuccess = call.status === "success";
                          return (
                            <div key={call.id} className="flex items-center justify-between gap-1.5">
                              <span className="truncate">
                                <span className="text-slate-500">worker:</span>
                                <span className="font-bold text-slate-200"> {call.toolName}</span>
                              </span>
                              <span className={isSuccess ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>
                                {isSuccess ? "✓ Success" : "⚠ Sidelined"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Avatar right */}
                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-white shrink-0 self-end">
                      <User className="w-3.5 h-3.5 text-slate-200" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Gemini Thinking Animation */}
        {isThinking && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold shrink-0 self-end animate-pulse">
              M
            </div>
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Mickey is analyzing active Skills & calling MCP tools...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quickprompts */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 shrink-0 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => suggestPrompt(prompt.replace(/[🥞🌧️🎁🍔🎟️🍗💳]/g, "").trim())}
            disabled={isThinking}
            className="bg-white hover:bg-slate-100 disabled:opacity-50 text-[10px] font-semibold text-slate-600 hover:text-slate-800 py-1.5 px-3 rounded-full border border-slate-200/60 cursor-pointer select-none transition shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex gap-2 shrink-0 bg-white rounded-b-2xl">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isThinking}
          placeholder={
            isThinking
              ? "Mickey is thinking..."
              : `Type a request (e.g., "Add Egg McMuffin and apply best coupon")`
          }
          className="flex-1 text-xs border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:outline-none rounded-xl px-3.5 py-2.5 bg-slate-50/50 focus:bg-white transition-all"
          id="chat-input-text-field"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isThinking}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold rounded-xl px-4 py-2.5 transition flex items-center justify-center cursor-pointer select-none shrink-0"
          id="chat-send-btn"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
