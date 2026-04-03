import MonitorBottomRow from "./components/MonitorBottomRow.jsx";
import MonitorCenterPanorama from "./components/MonitorCenterPanorama.jsx";
import MonitorLeftColumn from "./components/MonitorLeftColumn.jsx";
import MonitorRightColumn from "./components/MonitorRightColumn.jsx";
import { useMonitorFullscreen } from "./hooks/useMonitorFullscreen.js";

export default function MonitorDashboard() {
  const { containerRef, isFullscreen, toggleFullscreen } = useMonitorFullscreen();

  return (
    <div
      ref={containerRef}
      className={`w-full flex-1 bg-[#010611] text-white p-2 sm:p-4 font-sans selection:bg-[#00f0ff]/30 flex flex-col gap-0 relative overflow-y-auto lg:overflow-hidden ${
        isFullscreen ? "h-screen" : "min-h-[750px]"
      }`}
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-50 bg-[#020b1a]/80 border border-[#00f0ff]/50 text-[#00f0ff] p-1.5 rounded hover:bg-[#00f0ff]/20 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        title={isFullscreen ? "退出全屏" : "全屏展示"}
      >
        {isFullscreen ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20V15H4M15 4v5h5M9 4v5H4M15 20v-5h5" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 15v5h5M20 9V4h-5M4 9V4h5M20 15v5h-5" />
          </svg>
        )}
      </button>

      {/* 大屏顶部标题 */}
      <div className="relative w-full h-[80px] flex shrink-0 justify-center overflow-hidden">
        {/* 左侧水平延伸线 */}
        <div className="flex-1 relative">
          <div className="absolute top-[35px] left-0 w-full h-[1px] bg-[#16436e]"></div>
          <div className="absolute top-[35px] right-0 w-1/2 h-[1px] bg-gradient-to-r from-transparent to-[#00f0ff] opacity-70 shadow-[0_0_5px_#00f0ff]"></div>
        </div>

        {/* 中心标题区域 */}
        <div className="w-[800px] h-full relative z-10">
          <svg className="w-full h-full" viewBox="0 0 800 80" fill="none">
            {/* 背景多边形 */}
            <polygon points="180,0 230,55 570,55 620,0" fill="#002244" fillOpacity="0.4" />
            
            {/* 外部细线 */}
            <path d="M 0,35 L 170,35 L 220,70 L 580,70 L 630,35 L 800,35" stroke="#16436e" strokeWidth="1" />
            <path d="M 100,35 L 170,35 L 220,70 L 580,70 L 630,35 L 700,35" stroke="#00f0ff" strokeWidth="1" strokeOpacity="0.8" />
            
            {/* 内部粗线 (发光) */}
            <path d="M 180,0 L 230,55 L 570,55 L 620,0" stroke="#00f0ff" strokeWidth="3" strokeOpacity="0.9" />
            <path d="M 180,0 L 230,55 L 570,55 L 620,0" stroke="#00f0ff" strokeWidth="8" strokeOpacity="0.4" className="blur-[4px]" />

            {/* 底部中心高光点 */}
            <ellipse cx="400" cy="55" rx="35" ry="3" fill="#ffffff" className="blur-[2px]" />
            <ellipse cx="400" cy="55" rx="70" ry="6" fill="#00f0ff" opacity="0.7" className="blur-[5px]" />
          </svg>

          {/* 标题文本 */}
          <div className="absolute inset-0 flex items-center justify-center pb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] to-[#00f0ff] tracking-[0.2em] drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
              数字员工监控大屏
            </h1>
          </div>
        </div>

        {/* 右侧水平延伸线 */}
        <div className="flex-1 relative">
          <div className="absolute top-[35px] left-0 w-full h-[1px] bg-[#16436e]"></div>
          <div className="absolute top-[35px] left-0 w-1/2 h-[1px] bg-gradient-to-l from-transparent to-[#00f0ff] opacity-70 shadow-[0_0_5px_#00f0ff]"></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-[7] min-h-[450px]">
        <MonitorLeftColumn />
        <MonitorCenterPanorama />
        <MonitorRightColumn />
      </div>

      <div className="mt-4 flex min-h-0 flex-[3] flex-col">
        <MonitorBottomRow />
      </div>
    </div>
  );
}
