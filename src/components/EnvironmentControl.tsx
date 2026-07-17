/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Environment } from "../types";
import { Sun, CloudRain, Navigation, Clock, Award, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";

interface EnvironmentControlProps {
  env: Environment;
  setEnv: React.Dispatch<React.SetStateAction<Environment>>;
  isBreakfast: boolean;
}

export const EnvironmentControl: React.FC<EnvironmentControlProps> = ({ env, setEnv, isBreakfast }) => {
  const toggleWeather = () => {
    setEnv(prev => ({
      ...prev,
      weather: prev.weather === "sunny" ? "rainy" : "sunny"
    }));
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0.1;
    setEnv(prev => ({
      ...prev,
      distanceKm: parseFloat(val.toFixed(1))
    }));
  };

  const toggleTimeOfDay = () => {
    setEnv(prev => {
      const nextTime = prev.timeOfDay === "08:30" ? "13:00" : "08:30";
      return {
        ...prev,
        timeOfDay: nextTime
      };
    });
  };

  const addPoints = (amount: number) => {
    setEnv(prev => ({
      ...prev,
      userPoints: prev.userPoints + amount
    }));
  };

  const resetPoints = () => {
    setEnv(prev => ({
      ...prev,
      userPoints: 120
    }));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5" id="env-control-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-lg">运行环境模拟器</h3>
          <p className="text-xs text-slate-400">手动调整环境变量，验证 AI 的业务判断</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-50 text-slate-600 border border-slate-100 flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> 实时状态
        </span>
      </div>

      {/* Grid Controls */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weather Control */}
        <button
          onClick={toggleWeather}
          className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            env.weather === "rainy"
              ? "bg-sky-50 border-sky-200 text-sky-800 ring-1 ring-sky-300"
              : "bg-amber-50 border-amber-200 text-amber-800 ring-1 ring-amber-300"
          }`}
          id="toggle-weather-btn"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">天气状况</span>
            {env.weather === "rainy" ? (
              <CloudRain className="w-5 h-5 text-sky-600 animate-bounce" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: "12s" }} />
            )}
          </div>
          <div className="mt-2">
            <span className="text-base font-bold font-display block">
              {env.weather === "rainy" ? "下雨天 🌧️" : "晴朗天 ☀️"}
            </span>
            <span className="text-[10px] opacity-70">
              {env.weather === "rainy" ? "触发外卖配送规则" : "推荐散步自提省外送费"}
            </span>
          </div>
        </button>

        {/* Time of Day Control */}
        <button
          onClick={toggleTimeOfDay}
          className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            isBreakfast
              ? "bg-rose-50 border-rose-200 text-rose-800 ring-1 ring-rose-300"
              : "bg-indigo-50 border-indigo-200 text-indigo-800 ring-1 ring-indigo-300"
          }`}
          id="toggle-time-btn"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">门店菜单时段</span>
            <Clock className="w-5 h-5 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-base font-bold font-display block">
              {isBreakfast ? "上午 08:30 🥞" : "下午 01:00 🍔"}
            </span>
            <span className="text-[10px] opacity-70">
              {isBreakfast ? "早餐铁板菜单已上架" : "午正餐菜单已激活"}
            </span>
          </div>
        </button>
      </div>

      {/* Distance Slider */}
      <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-slate-400" /> 用户至最近门店物理距离
          </span>
          <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-100 shadow-sm">
            {env.distanceKm} 公里
          </span>
        </div>
        <input
          type="range"
          min="0.2"
          max="5.0"
          step="0.1"
          value={env.distanceKm}
          onChange={handleDistanceChange}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          id="distance-slider"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>极其近 (0.2km)</span>
          <span className="font-semibold text-slate-500">
            {env.distanceKm > 1.5 ? "🔴 距离较远：建议外卖派送" : "🟢 距离很近：适合步行自提"}
          </span>
          <span>非常远 (5km)</span>
        </div>
      </div>

      {/* Points Loyalty Panel */}
      <div className="space-y-2.5 p-3.5 bg-yellow-50/50 border border-yellow-100 rounded-xl">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Award className="w-4 h-4 text-blue-600 fill-blue-600/10" /> 会员消费累计积分
          </span>
          <span className="font-mono font-bold text-yellow-800 bg-white px-2.5 py-0.5 rounded border border-yellow-100 shadow-sm">
            {env.userPoints} 分
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => addPoints(100)}
            className="flex-1 bg-white hover:bg-yellow-50 text-slate-700 hover:text-yellow-800 text-xs py-1.5 px-2 rounded-lg border border-yellow-200 font-medium transition cursor-pointer text-center shadow-sm"
            id="add-points-btn"
          >
            +100 积分
          </button>
          <button
            onClick={() => addPoints(500)}
            className="flex-1 bg-white hover:bg-yellow-50 text-slate-700 hover:text-yellow-800 text-xs py-1.5 px-2 rounded-lg border border-yellow-200 font-medium transition cursor-pointer text-center shadow-sm"
            id="add-500-points-btn"
          >
            +500 积分
          </button>
          <button
            onClick={resetPoints}
            className="text-slate-400 hover:text-slate-500 text-xs p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
            title="Reset points"
            id="reset-points-btn"
          >
            重置
          </button>
        </div>

        {env.userPoints >= 500 ? (
          <div className="text-[10px] text-yellow-800 bg-yellow-100/60 p-1.5 rounded-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping"></span>
            <span>当前积分达标！可兑换<strong>【免费脆薯饼】</strong> (已激活 500 分兑换权限)</span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>积分达到 500 分即可兑换免费脆薯饼，点击上方按钮加点积分吧！</span>
          </div>
        )}
      </div>

      {/* Safety system rule reminder - styled precisely as the Integrity Guard in the Polish template */}
      <div className="p-3 bg-red-50 rounded-xl border border-red-100">
        <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" /> 🚨 业务合规警示 (规则防篡改保护)
        </p>
        <p className="text-[10px] text-red-600 mt-1 italic leading-tight">
          AI 智能规则层无权伪造底层安全交易哈希 (order_id)。订单锁定及防穿透资金校验等敏感动作完全由底层 TypeScript 安全沙箱服务端托管。
        </p>
      </div>
    </div>
  );
};
