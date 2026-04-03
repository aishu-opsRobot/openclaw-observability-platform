import centerBg from "../images/center-bg.jpg";
import MonitorPanel from "./MonitorPanel.jsx";

export default function MonitorCenterPanorama() {
  return (
    <div className="flex h-full w-full min-w-0 flex-col lg:w-2/4">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden relative">
        <div className="box-border min-h-0 w-full min-w-full flex-1 self-stretch flex flex-col">
          {/* 指标卡区域 */}
          <div className="z-10 flex flex-wrap gap-4 justify-between lg:justify-start mb-4">
            {/* 卡片 1: Agent总数 */}
            <div className="relative flex min-w-[140px] flex-1 flex-col overflow-hidden rounded bg-gradient-to-b from-[#002244]/80 to-[#001833]/40 border border-[#00f0ff]/30 px-4 py-3 shadow-[0_0_15px_rgba(0,240,255,0.1)] backdrop-blur-sm group hover:border-[#00f0ff]/60 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-[#00f0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-[#8fb1c6] text-xs font-medium tracking-wide">Agent总数</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono flex items-baseline">
                128<span className="text-xs text-[#00f0ff] ml-2 font-sans opacity-80">+12%</span>
              </div>
            </div>

            {/* 卡片 2: 用户总数 */}
            <div className="relative flex min-w-[140px] flex-1 flex-col overflow-hidden rounded bg-gradient-to-b from-[#002244]/80 to-[#001833]/40 border border-[#4a72ff]/30 px-4 py-3 shadow-[0_0_15px_rgba(74,114,255,0.1)] backdrop-blur-sm group hover:border-[#4a72ff]/60 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#4a72ff] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-[#4a72ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-[#8fb1c6] text-xs font-medium tracking-wide">用户总数</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono flex items-baseline">
                4,592<span className="text-xs text-[#4a72ff] ml-2 font-sans opacity-80">+5%</span>
              </div>
            </div>

            {/* 卡片 3: 来源终端 */}
            <div className="relative flex min-w-[140px] flex-1 flex-col overflow-hidden rounded bg-gradient-to-b from-[#002244]/80 to-[#001833]/40 border border-[#eab308]/30 px-4 py-3 shadow-[0_0_15px_rgba(234,179,8,0.1)] backdrop-blur-sm group hover:border-[#eab308]/60 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#eab308] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-[#eab308]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-[#8fb1c6] text-xs font-medium tracking-wide">来源终端</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono flex items-baseline">
                12<span className="text-xs text-[#eab308] ml-2 font-sans opacity-80">个平台</span>
              </div>
            </div>

            {/* 卡片 4: Token消耗 */}
            <div className="relative flex min-w-[140px] flex-1 flex-col overflow-hidden rounded bg-gradient-to-b from-[#002244]/80 to-[#001833]/40 border border-[#a855f7]/30 px-4 py-3 shadow-[0_0_15px_rgba(168,85,247,0.1)] backdrop-blur-sm group hover:border-[#a855f7]/60 transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-[#a855f7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[#8fb1c6] text-xs font-medium tracking-wide">Token消耗</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono flex items-baseline">
                1.4B<span className="text-xs text-[#a855f7] ml-2 font-sans opacity-80">今日</span>
              </div>
            </div>
          </div>
          {/* 全景图片内容区域 */}
          <div
            className="w-full flex-1 min-h-0 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${centerBg})` }}
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
