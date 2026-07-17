/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AgentSkill } from "../types";
import { Brain, ToggleLeft, ToggleRight, FileText, CheckCircle, Edit3, X, Save, Eye } from "lucide-react";

interface SkillsManagerProps {
  skills: AgentSkill[];
  setSkills: React.Dispatch<React.SetStateAction<AgentSkill[]>>;
  activeSkillIds: string[];
  setActiveSkillIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const SkillsManager: React.FC<SkillsManagerProps> = ({
  skills,
  setSkills,
  activeSkillIds,
  setActiveSkillIds
}) => {
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [tempContent, setTempContent] = useState<string>("");
  const [selectedSkillId, setSelectedSkillId] = useState<string>("skill_scenario");

  const toggleSkill = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSkillIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleEditClick = (skill: AgentSkill, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSkillId(skill.id);
    setTempContent(skill.content);
  };

  const handleSaveClick = (id: string) => {
    setSkills(prev =>
      prev.map(s => (s.id === id ? { ...s, content: tempContent } : s))
    );
    setEditingSkillId(null);
  };

  const activeSkill = skills.find(s => s.id === selectedSkillId) || skills[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 h-full flex flex-col" id="skills-manager-container">
      {/* Header styled with light-blue corporate accent */}
      <div className="bg-blue-50/60 p-5 border-b border-slate-200 -mx-5 -mt-5 rounded-t-2xl flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-display font-bold text-blue-900 text-sm tracking-tight flex items-center gap-2">
            <span>🧠</span> AGENT SKILL LAYER (BRAIN)
          </h3>
          <p className="text-[10px] text-blue-700 font-semibold uppercase tracking-widest mt-0.5">Strategy & Policy Engine</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-bold uppercase tracking-wider">
          Runtime Hot Reload
        </span>
      </div>

      {/* Tabs list of skills */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden min-h-[350px]">
        {/* Left Column: List of Rules with active toggles */}
        <div className="w-full lg:w-2/5 space-y-3 overflow-y-auto pr-1">
          {skills.map((skill) => {
            const isActive = activeSkillIds.includes(skill.id);
            const isSelected = selectedSkillId === skill.id;

            return (
              <div
                key={skill.id}
                onClick={() => setSelectedSkillId(skill.id)}
                className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-2 border-blue-300 bg-blue-50/20 shadow-sm ring-1 ring-blue-200"
                    : "border-slate-200 bg-white hover:bg-slate-50/55"
                }`}
                id={`skill-item-${skill.id}`}
              >
                <div className="flex justify-between items-start w-full">
                  <div className="space-y-1 pr-2 flex-1">
                    <span className="text-[10px] font-mono font-bold text-blue-600 block mb-1">
                      {skill.id.toUpperCase()}.md
                    </span>
                    <h4 className="font-bold text-slate-800 text-xs">{skill.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mt-0.5">{skill.description}</p>
                  </div>

                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    {/* Toggle button */}
                    <button
                      onClick={(e) => toggleSkill(skill.id, e)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      title={isActive ? "Disable this rulebook" : "Load this rulebook"}
                      id={`toggle-skill-btn-${skill.id}`}
                    >
                      {isActive ? (
                        <ToggleRight className="w-8 h-8 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-1">
                    {isActive ? (
                      <>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-[9px] rounded text-blue-700 font-bold uppercase tracking-wider">
                          ACTIVE
                        </span>
                        <span className="px-1.5 py-0.5 bg-green-100 text-[9px] rounded text-green-700 font-bold uppercase tracking-wider">
                          STABLE
                        </span>
                      </>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] rounded text-slate-500 font-bold uppercase tracking-wider">
                        DRAFT
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedSkillId(skill.id); }} 
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    VIEW DETAILS
                  </button>
                </div>
              </div>
            );
          })}

          <div className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-normal">
            💡 <strong>Dynamic Calibration:</strong> Disable Coupon Strategy or edit the markdown rules live. Gemini instant-adapts its calculation constraints without a compile loop.
          </div>
        </div>

        {/* Right Column: Rule Content Viewer & Editor */}
        <div className="w-full lg:w-3/5 bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3 shrink-0">
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 uppercase font-bold">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> {activeSkill.title}
            </span>

            {editingSkillId !== activeSkill.id ? (
              <button
                onClick={(e) => handleEditClick(activeSkill, e)}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded flex items-center gap-1 cursor-pointer font-semibold shadow-xs"
                id="edit-skill-content-btn"
              >
                <Edit3 className="w-3 h-3" /> Edit Rules Markdown
              </button>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => handleSaveClick(activeSkill.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 cursor-pointer font-bold shadow-xs"
                  id="save-skill-content-btn"
                >
                  <Save className="w-3 h-3" /> Save Changes
                </button>
                <button
                  onClick={() => setEditingSkillId(null)}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-1 rounded cursor-pointer font-medium"
                  id="cancel-skill-edit-btn"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
            {editingSkillId === activeSkill.id ? (
              <textarea
                value={tempContent}
                onChange={(e) => setTempContent(e.target.value)}
                className="w-full h-full p-2.5 bg-slate-950 text-slate-200 rounded border border-slate-700 focus:outline-none resize-none text-[11px] font-mono"
                placeholder="Modify markdown rulebook..."
                id="edit-skill-textarea"
              />
            ) : (
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs max-h-full overflow-y-auto text-slate-600 whitespace-pre-wrap leading-relaxed text-xs">
                {activeSkill.content}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
