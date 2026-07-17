/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from "react";
import { McpToolCall } from "../types";
import { Terminal, Brain, Hammer, Server, RefreshCw, Layers, ShieldCheck, Cpu } from "lucide-react";

interface McpConsoleProps {
  logs: McpToolCall[];
  onClearLogs: () => void;
}

export const McpConsole: React.FC<McpConsoleProps> = ({ logs, onClearLogs }) => {
  const [activeTab, setActiveTab] = useState<"logs" | "registry">("logs");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalEndRef.current && activeTab === "logs") {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, activeTab]);

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[420px]" id="mcp-console-container">
      {/* Console Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-pink-500 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-slate-300">MCP Server Transaction Layer</span>
        </div>
        
        <div className="flex items-center gap-2">
          {logs.length > 0 && activeTab === "logs" && (
            <button
              onClick={onClearLogs}
              className="text-slate-500 hover:text-slate-300 transition text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 hover:bg-slate-800 cursor-pointer"
              id="clear-mcp-logs-btn"
            >
              Clear Logs
            </button>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" title="MCP Server online"></span>
        </div>
      </div>

      {/* Tabs Switcher and Architectural Info Bar */}
      <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between shrink-0 text-[10px] font-mono">
        <div className="flex space-x-1.5">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-3 py-1 rounded transition-all duration-150 cursor-pointer text-[10px] font-bold ${
              activeTab === "logs"
                ? "bg-pink-950/40 text-pink-400 border border-pink-900/50 shadow-inner"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            ● LIVE STREAM
          </button>
          <button
            onClick={() => setActiveTab("registry")}
            className={`px-3 py-1 rounded transition-all duration-150 cursor-pointer text-[10px] font-bold ${
              activeTab === "registry"
                ? "bg-indigo-950/40 text-indigo-400 border border-indigo-900/50 shadow-inner"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            📊 TOOL REGISTRY
          </button>
        </div>
        <div className="text-slate-500 text-[9px]">Latency: ~18ms</div>
      </div>

      {/* Dynamic Content Frame */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "logs" ? (
          /* Live log screen */
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs leading-relaxed text-slate-300">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 text-center py-10">
                <Cpu className="w-8 h-8 opacity-45 text-pink-500 animate-pulse" />
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-400">Execution Pipeline Standing By</p>
                  <p className="text-[9px] max-w-xs opacity-75 mx-auto leading-relaxed">
                    Trigger items, coupons, or chat dialog to route transactions securely via decoupled Cloudflare Worker limbs.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => {
                  const statusColor = 
                    log.status === "success" 
                      ? "text-emerald-400" 
                      : log.status === "warning" 
                      ? "text-yellow-400" 
                      : "text-rose-400";

                  const badgeColor = 
                    log.type === "transaction" 
                      ? "bg-pink-950/40 text-pink-300 border-pink-900/40" 
                      : "bg-slate-900 text-slate-300 border-slate-800";

                  return (
                    <div key={log.id} className="border-l-2 border-slate-800 pl-3 py-1 space-y-1 hover:bg-slate-900/10 transition-all duration-150">
                      <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-600">[{log.timestamp}]</span>
                          <span className={`px-1.5 py-0.5 rounded border font-bold text-[8px] uppercase tracking-wider ${badgeColor}`}>
                            {log.type}
                          </span>
                        </div>
                        <span className={`font-semibold ${statusColor}`}>
                          ● {log.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-slate-200 text-xs">
                        <span className="text-pink-400">worker-mcp:</span>
                        <span className="font-bold text-slate-100"> {log.toolName}</span>
                        <span className="text-slate-400">({JSON.stringify(log.args)})</span>
                      </div>

                      <div className="text-slate-400 text-[11px] leading-relaxed">
                        {log.message}
                      </div>

                      <div className="bg-slate-900/85 p-2.5 rounded-lg border border-slate-800/80 text-[10px] text-slate-400 max-h-36 overflow-x-auto whitespace-pre font-mono">
                        <span className="text-slate-500 block text-[8px] uppercase tracking-wider mb-1">Response Payload:</span>
                        {JSON.stringify(log.result, null, 2)}
                      </div>
                    </div>
                  );
                })}
                <div ref={terminalEndRef} />
              </div>
            )}
          </div>
        ) : (
          /* Static Registered Tools table from "Professional Polish" design HTML */
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center px-4">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Registered Executions</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 rounded font-mono">Source: server.ts</span>
            </div>
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-950 border-b border-slate-800 sticky top-0 text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-[9px] font-bold uppercase">Tool ID</th>
                  <th className="px-4 py-2 text-[9px] font-bold uppercase">Constraint Responsibility</th>
                  <th className="px-4 py-2 text-[9px] font-bold uppercase text-right">State Guard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                <tr>
                  <td className="px-4 py-2.5 text-pink-400 font-bold">create_order</td>
                  <td className="px-4 py-2.5 text-slate-400 italic">Strict Worker transaction commit; reserves inventory</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400 font-bold text-[9px]">PROTECTED</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-pink-400 font-bold">bind_coupon</td>
                  <td className="px-4 py-2.5 text-slate-400 italic">Validates specific ID constraints against order draft</td>
                  <td className="px-4 py-2.5 text-right text-indigo-400 font-bold text-[9px]">ATOMIC</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-pink-400 font-bold">add_item_to_cart</td>
                  <td className="px-4 py-2.5 text-slate-400 italic">Verifies grill status and registers item counts</td>
                  <td className="px-4 py-2.5 text-right text-indigo-400 font-bold text-[9px]">ATOMIC</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-pink-400 font-bold">redeem_points_hashbrown</td>
                  <td className="px-4 py-2.5 text-slate-400 italic">Verifies user loyalty ledger balance & adds reward</td>
                  <td className="px-4 py-2.5 text-right text-emerald-400 font-bold text-[9px]">PROTECTED</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-pink-400 font-bold">lock_order</td>
                  <td className="px-4 py-2.5 text-slate-400 italic">Freezes draft parameters prior to final checkout</td>
                  <td className="px-4 py-2.5 text-right text-indigo-400 font-bold text-[9px]">ATOMIC</td>
                </tr>
              </tbody>
            </table>
            <div className="p-3 bg-slate-900/40 text-[9px] text-slate-500 border-t border-slate-900 italic text-center">
              🛡️ Transaction layer isolates database access from AI prompt modifications.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
