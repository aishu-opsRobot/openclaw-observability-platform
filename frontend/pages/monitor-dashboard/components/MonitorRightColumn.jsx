import MonitorPanel from "./MonitorPanel.jsx";

export default function MonitorRightColumn() {
  return (
    <div className="flex flex-col gap-4 w-full lg:w-1/4 h-full">
      <MonitorPanel title="会话概览" className="h-[100px] sm:h-[120px] shrink-0">
        <div className="flex justify-between gap-2 items-center h-full px-1">
          <div className="text-center relative bg-gradient-to-b from-[#002244]/60 to-transparent border border-[#00f0ff]/20 py-2 rounded flex-1">
            <div className="text-[#6b93a7] text-[10px] sm:text-xs mb-1">总会话数</div>
            <div className="text-xl sm:text-xl font-bold text-white font-mono">
              7,681<span className="text-[10px] text-[#6b93a7] ml-1 font-sans">次</span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-[#00f0ff] shadow-[0_0_5px_#00f0ff]" />
          </div>
          <div className="text-center relative bg-gradient-to-b from-[#330000]/60 to-transparent border border-red-500/20 py-2 rounded flex-1">
            <div className="text-[#6b93a7] text-[10px] sm:text-xs mb-1">高危会话数</div>
            <div className="text-xl sm:text-xl font-bold text-red-400 font-mono">
              3<span className="text-[10px] text-[#6b93a7] ml-1 font-sans">次</span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-red-500 shadow-[0_0_5px_#ef4444]" />
          </div>
          <div className="text-center relative bg-gradient-to-b from-[#332200]/60 to-transparent border border-yellow-500/20 py-2 rounded flex-1">
            <div className="text-[#6b93a7] text-[10px] sm:text-xs mb-1">中危会话数</div>
            <div className="text-xl sm:text-xl font-bold text-yellow-400 font-mono">
              12<span className="text-[10px] text-[#6b93a7] ml-1 font-sans">次</span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-yellow-500 shadow-[0_0_5px_#eab308]" />
          </div>
          <div className="text-center relative bg-gradient-to-b from-[#001133]/60 to-transparent border border-blue-500/20 py-2 rounded flex-1">
            <div className="text-[#6b93a7] text-[10px] sm:text-xs mb-1">低危会话数</div>
            <div className="text-xl sm:text-xl font-bold text-blue-400 font-mono">
              47<span className="text-[10px] text-[#6b93a7] ml-1 font-sans">次</span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-blue-500 shadow-[0_0_5px_#3b82f6]" />
          </div>
        </div>
      </MonitorPanel>

      <MonitorPanel
        title="风险会话"
        className="flex-1 min-h-[250px]"
        headerExtra={
          <div className="flex gap-2 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              高
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              中
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              低
            </span>
          </div>
        }
      >
        <div className="relative h-full overflow-hidden px-2">
          {/* 左侧时间线主轴 */}
          <div className="absolute top-0 bottom-0 left-[18px] w-px bg-[#16436e]" />
          
          <div className="flex flex-col gap-4 animate-auto-scroll">
            {/* 为了无缝滚动，复制一份列表内容 */}
            {[1, 2].map((listKey) => (
              <div key={listKey} className="flex flex-col gap-4">
                <div className="bg-[#1a0f14]/80 border border-red-500/30 p-2 rounded relative ml-6">
                  {/* 时间线节点 */}
                  <div className="absolute top-4 -left-[19px] w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#010611] z-10 shadow-[0_0_5px_#ef4444]" />
                  
                  <div className="absolute top-2 right-2 border border-red-500 text-red-500 text-[10px] px-1 rounded bg-red-500/10">
                    高危
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-red-900/50 flex items-center justify-center text-xs text-red-400 border border-red-500/30">
                      客
                    </div>
                    <div className="text-sm font-medium text-[12px] pr-8">客服助手·小云</div>
                  </div>
                  <div className="text-[#8fb1c6] text-[10px] mb-1">id: sess_7f3a9c • 策略规则: pii-c1</div>
                  <div className="text-gray-300 text-xs leading-relaxed">
                    用户查询跨订单敏感数据，AI 回复包含外部链接指引，系统检测到可疑者IP行为，已记录入库备查。
                  </div>
                </div>

                <div className="bg-[#1a180f]/80 border border-yellow-500/30 p-2 rounded relative ml-6">
                  {/* 时间线节点 */}
                  <div className="absolute top-4 -left-[19px] w-2 h-2 rounded-full bg-yellow-500 ring-2 ring-[#010611] z-10 shadow-[0_0_5px_#eab308]" />
                  
                  <div className="absolute top-2 right-2 border border-yellow-500 text-yellow-500 text-[10px] px-1 rounded bg-yellow-500/10">
                    中危
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-yellow-900/50 flex items-center justify-center text-xs text-yellow-400 border border-yellow-500/30">
                      研
                    </div>
                    <div className="text-sm font-medium text-[12px] pr-8">研发助手·CodeBuddy</div>
                  </div>
                  <div className="text-[#8fb1c6] text-[10px] mb-1">id: sess_a8db39 • 工具调用: claude-3.5</div>
                  <div className="text-gray-300 text-xs leading-relaxed">
                    开发者要求生成 Kubernetes 部署 YAML，Agent 调用 K8s API 提取所有命名空间配置生成模型。
                  </div>
                </div>

                <div className="bg-[#0f151a]/80 border border-[#00f0ff]/30 p-2 rounded relative ml-6">
                  {/* 时间线节点 */}
                  <div className="absolute top-4 -left-[19px] w-2 h-2 rounded-full bg-blue-400 ring-2 ring-[#010611] z-10 shadow-[0_0_5px_#3b82f6]" />
                  
                  <div className="absolute top-2 right-2 border border-[#00f0ff] text-[#00f0ff] text-[10px] px-1 rounded bg-[#00f0ff]/10">
                    异常
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded bg-[#00f0ff]/20 flex items-center justify-center text-xs text-[#00f0ff] border border-[#00f0ff]/30">
                      运
                    </div>
                    <div className="text-sm font-medium text-[12px] pr-8">运维巡检员</div>
                  </div>
                  <div className="text-[#8fb1c6] text-[10px]">id: sess_90db3a • 异常频次: gpt-4o</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MonitorPanel>
    </div>
  );
}
