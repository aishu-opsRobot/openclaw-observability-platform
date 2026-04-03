import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "../components/Icon.jsx";

const PAGE_TABS = [
  { key: "overview", label: "总览" },
  { key: "session", label: "会话统计" },
  { key: "token", label: "Token消费" },
  { key: "cost", label: "成本分析" },
  { key: "message", label: "消息处理" },
  { key: "queue", label: "队列状态" },
];

const INSTANCE_DETAIL_TABS = [
  { key: "overview", label: "总览" },
  { key: "session", label: "会话" },
  { key: "token", label: "Token" },
  { key: "cost", label: "成本" },
  { key: "message", label: "消息" },
  { key: "queue", label: "队列" },
];

const TIME_RANGES = [
  { label: "最近1小时", value: "1h", hours: 1, granularityMinutes: 1, granularityLabel: "1分钟" },
  { label: "最近6小时", value: "6h", hours: 6, granularityMinutes: 5, granularityLabel: "5分钟" },
  { label: "最近12小时", value: "12h", hours: 12, granularityMinutes: 10, granularityLabel: "10分钟" },
  { label: "最近24小时", value: "24h", hours: 24, granularityMinutes: 30, granularityLabel: "30分钟" },
  { label: "最近3天", value: "3d", hours: 72, granularityMinutes: 60, granularityLabel: "1小时" },
  { label: "最近7天", value: "7d", hours: 168, granularityMinutes: 180, granularityLabel: "3小时" },
];

const REFRESH_INTERVALS = [
  { label: "关闭", value: 0 },
  { label: "10秒", value: 10 },
  { label: "30秒", value: 30 },
  { label: "1分钟", value: 60 },
  { label: "5分钟", value: 300 },
];

function LineChart({ data, color, height = 120 }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  if (!data || data.length === 0) return null;
  
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;
  const width = 100;
  const padding = 5;
  
  const points = data.map((item, index) => {
    const x = padding + (index / Math.max(1, data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((item.value - minValue) / range) * (height - 2 * padding);
    return { x, y, value: item.value, time: item.time };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${height - padding} L ${padding} ${height - padding} Z`;
  
  const gradientId = `gradient-${color.replace('#', '')}-${Math.random().toString(36).substr(2, 9)}`;
  
  const displayPoints = points.filter((_, i) => i % Math.max(1, Math.ceil(points.length / 6)) === 0 || i === points.length - 1);

  const formatValue = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };
  
  return (
    <div className="relative">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full overflow-visible" 
        style={{ height: `${height}px` }} 
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradientId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint === i ? 4 : 0}
            fill={color}
            stroke="white"
            strokeWidth={1}
            className="transition-all duration-150"
            style={{ opacity: hoveredPoint === i ? 1 : 0 }}
          />
        ))}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          className="cursor-crosshair"
          onMouseMove={(e) => {
            const svg = e.currentTarget;
            const rect = svg.getBoundingClientRect();
            const svgWidth = rect.width;
            const mouseX = e.clientX - rect.left;
            const relativeX = (mouseX / svgWidth) * width;
            const index = Math.round((relativeX - padding) / (width - 2 * padding) * (data.length - 1));
            const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
            setHoveredPoint(clampedIndex);
          }}
        />
      </svg>
      {hoveredPoint !== null && points[hoveredPoint] && (
        <div 
          className="absolute pointer-events-none bg-gray-900/90 dark:bg-gray-100/90 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap"
          style={{
            left: `${(points[hoveredPoint].x / width) * 100}%`,
            top: `${(points[hoveredPoint].y / height) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-medium">{points[hoveredPoint].time}</div>
          <div className="font-bold">{formatValue(points[hoveredPoint].value)}</div>
        </div>
      )}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
        {displayPoints.map((p, i) => (
          <span key={i}>{p.time}</span>
        ))}
      </div>
    </div>
  );
}

function PieChart({ data, size = 120 }) {
  if (!data || data.length === 0) return null;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];
  
  let currentAngle = -90;
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return {
      ...item,
      percentage,
      color: colors[index % colors.length],
      startAngle,
      angle,
    };
  });

  const createArcPath = (startAngle, angle, radius) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={createArcPath(seg.startAngle, seg.angle, 40)}
            fill={seg.color}
            stroke="white"
            strokeWidth="1"
            className="transition-opacity hover:opacity-80"
          />
        ))}
      </svg>
      <div className="flex-1 space-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-gray-600 dark:text-gray-400 truncate max-w-[80px]">{seg.name}</span>
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200">{seg.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopList({ data, valueFormatter = (v) => v.toLocaleString() }) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {index + 1}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{valueFormatter(item.value)}</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${(item.value / maxValue) * 100}%` }} 
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OtelOverview() {
  const [pageTab, setPageTab] = useState("overview");
  const [selectedTimeRange, setSelectedTimeRange] = useState("1h");
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [countdown, setCountdown] = useState(30);
  const [detailTab, setDetailTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [timeMode, setTimeMode] = useState("quick");
  const [customStartTime, setCustomStartTime] = useState("");
  const [customEndTime, setCustomEndTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const refreshIntervalRef = useRef(refreshInterval);
  refreshIntervalRef.current = refreshInterval;
  
  const timeRangeConfig = TIME_RANGES.find((r) => r.value === selectedTimeRange);
  const selectedHours = timeRangeConfig?.hours || 1;
  const granularityMinutes = timeRangeConfig?.granularityMinutes || 1;
  const granularityLabel = timeRangeConfig?.granularityLabel || "1分钟";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/otel-overview?";
      if (timeMode === "custom" && customStartTime && customEndTime) {
        url += `startTime=${encodeURIComponent(customStartTime)}&endTime=${encodeURIComponent(customEndTime)}&granularityMinutes=${granularityMinutes}`;
      } else {
        url += `hours=${selectedHours}&granularityMinutes=${granularityMinutes}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedHours, granularityMinutes, timeMode, customStartTime, customEndTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refreshInterval === 0) {
      setCountdown(0);
      return;
    }
    setCountdown(refreshInterval);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return refreshIntervalRef.current;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchData]);

  const handleManualRefresh = () => {
    fetchData();
    if (refreshInterval > 0) setCountdown(refreshInterval);
  };

  const handleApplyCustomTime = () => {
    if (customStartTime && customEndTime) {
      setTimeMode("custom");
      setShowTimePicker(false);
      fetchData();
    }
  };

  const handleQuickTimeSelect = (value) => {
    setSelectedTimeRange(value);
    setTimeMode("quick");
    setCustomStartTime("");
    setCustomEndTime("");
  };

  const getStatusBadgeClass = (status) => {
    if (status === "在线") return "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20";
    if (status === "离线") return "bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-500/20";
    return "bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/25";
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Icon name="loading" className="h-8 w-8 text-primary animate-spin" />
          <span className="text-gray-500 dark:text-gray-400">加载中...</span>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {};
  const instances = data?.instances || [];
  const trends = data?.trends || {};
  const distributions = data?.distributions || {};
  const histogramStats = data?.histogramStats || {};

  const topInstances = instances.slice(0, 5).map(inst => ({
    name: inst.name,
    value: inst.tokenConsumption?.replace(/[KM]/g, '') * (inst.tokenConsumption?.includes('M') ? 1000000 : inst.tokenConsumption?.includes('K') ? 1000 : 1) || 0,
  }));

  const sessionDistribution = [
    { name: '活跃', value: overview.activeSessions || 0 },
    { name: '卡顿', value: overview.stuckSessions || 0 },
    { name: '其他', value: Math.max(0, (overview.totalSessions || 0) - (overview.activeSessions || 0) - (overview.stuckSessions || 0)) },
  ];

  const tokenDistribution = [
    { name: 'Input', value: instances.reduce((a, i) => a + (parseFloat(i.inputTokens) || 0), 0) },
    { name: 'Output', value: instances.reduce((a, i) => a + (parseFloat(i.outputTokens) || 0), 0) },
  ];

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon name="server" className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">实例总数</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{overview.totalInstances || 0}</span>
                <span className="text-xs text-gray-400">个实例</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="text-gray-500 dark:text-gray-400">在线 {overview.onlineInstances || 0}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-400"></span>
              <span className="text-gray-500 dark:text-gray-400">离线 {overview.offlineInstances || 0}</span>
            </span>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Icon name="users" className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">活跃会话</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{overview.activeSessions?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="text-gray-500 dark:text-gray-400">总会话: {overview.totalSessions?.toLocaleString() || 0}</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span className="text-gray-500 dark:text-gray-400">卡顿: {overview.stuckSessions || 0}</span>
            </span>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Icon name="zap" className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Token消耗</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{overview.totalTokens?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <Icon name="dollar" className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">总成本</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">${(overview.totalCost || 0).toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <Icon name="activity" className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">消息处理</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{overview.messageProcessed?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Icon name="database" className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">排队消息</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{overview.messageQueued?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
              <Icon name="clock" className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">平均耗时</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{histogramStats.messageDuration?.avg?.toFixed(1) || 0}</span>
                <span className="text-xs text-gray-400">ms</span>
              </div>
            </div>
          </div>
        </div>
        <div className="app-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
              <Icon name="timer" className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">平均等待</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{histogramStats.queueWait?.avg?.toFixed(1) || 0}</span>
                <span className="text-xs text-gray-400">ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">会话趋势</h3>
          <LineChart data={trends.session || []} color="#3b82f6" height={120} />
        </div>
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Token消耗趋势</h3>
          <LineChart data={trends.token || []} color="#8b5cf6" height={120} />
        </div>
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">成本趋势</h3>
          <LineChart data={trends.cost || []} color="#f43f5e" height={120} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">会话状态分布</h3>
          <PieChart data={sessionDistribution} size={100} />
        </div>
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Token类型占比</h3>
          <PieChart data={tokenDistribution} size={100} />
        </div>
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 5 实例 (Token消耗)</h3>
          <TopList data={topInstances} valueFormatter={(v) => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(1) + 'K' : v} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">消息处理趋势</h3>
          <LineChart data={trends.messageProcessed || []} color="#10b981" height={120} />
        </div>
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">队列深度趋势</h3>
          <LineChart data={trends.queueDepth || []} color="#f59e0b" height={120} />
        </div>
      </div>

      <div className="app-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">OpenClaw 实例列表</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">点击行查看实例详情 · 实时状态监控</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">共 {instances.length} 个实例</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-emerald-600 dark:text-emerald-400">{instances.filter(i => i.status === "在线").length} 在线</span>
          </div>
        </div>

        {instances.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <Icon name="server" className="h-12 w-12 mb-3 opacity-50" />
            <p>暂无实例数据</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/90 dark:border-gray-800 dark:bg-gray-800/80">
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">实例ID</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">实例名称</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">状态</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">活跃会话</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">卡顿会话</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Token消耗</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">总成本</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">消息处理</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">队列深度</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900/50">
                  {instances.map((instance, i) => (
                    <tr
                      key={instance.id}
                      className={[
                        "transition-colors duration-200 hover:bg-primary-soft/40 dark:hover:bg-primary/10 cursor-pointer",
                        i % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-800/40" : "bg-white dark:bg-transparent",
                      ].join(" ")}
                      onClick={() => setSelectedInstance(instance)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-gray-800 dark:text-gray-200">{instance.id}</td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{instance.name}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={["inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", getStatusBadgeClass(instance.status)].join(" ")}>
                          {instance.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{(instance.activeSessions || 0).toLocaleString()}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={instance.stuckSessions > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400"}>
                          {instance.stuckSessions || 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{instance.tokenConsumption || "0"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{instance.totalCost || "$0"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{(instance.messageProcessed || 0).toLocaleString()}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{instance.queueDepth || 0}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInstance(instance);
                          }}
                          className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft transition-colors dark:text-primary dark:hover:bg-primary/15"
                        >
                          <Icon name="info" className="h-3.5 w-3.5 mr-1" />
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSessionTab = () => {
    const sessionAnalytics = data?.sessionAnalytics || {};
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">会话总数</p>
            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{overview.totalSessions?.toLocaleString() || 0}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">活跃会话</p>
            <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{overview.activeSessions?.toLocaleString() || 0}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">卡顿会话</p>
            <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{overview.stuckSessions || 0}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">成功率</p>
            <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {overview.totalSessions > 0 ? (((overview.totalSessions - overview.stuckSessions) / overview.totalSessions) * 100).toFixed(1) : 100}%
            </span>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">会话趋势</h3>
            <LineChart data={trends.session || []} color="#3b82f6" height={120} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">状态分布</h3>
            <PieChart data={sessionAnalytics.byState || sessionDistribution} size={100} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">渠道分布</h3>
            <PieChart data={sessionAnalytics.byChannel || []} size={100} />
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">卡顿原因分析</h3>
            {sessionAnalytics.byReason && sessionAnalytics.byReason.length > 0 ? (
              <div className="space-y-3">
                {sessionAnalytics.byReason.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.value}</span>
                      <span className="text-xs text-gray-500">({((item.value / (overview.stuckSessions || 1)) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">暂无卡顿数据</div>
            )}
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 5 实例 (会话数)</h3>
            <TopList data={sessionAnalytics.topInstances || []} />
          </div>
        </div>
      </div>
    );
  };

  const renderTokenTab = () => {
    const tokenAnalytics = data?.tokenAnalytics || {};
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Token总消耗</p>
            <span className="text-2xl font-semibold text-violet-600 dark:text-violet-400">{overview.totalTokens?.toLocaleString() || 0}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Input Token</p>
            <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{tokenAnalytics.byType?.find(t => t.name === 'input')?.value?.toLocaleString() || 0}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Output Token</p>
            <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{tokenAnalytics.byType?.find(t => t.name === 'output')?.value?.toLocaleString() || 0}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Input/Output比</p>
            <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
              {tokenAnalytics.byType && tokenAnalytics.byType.length >= 2 
                ? (tokenAnalytics.byType[0].value / Math.max(1, tokenAnalytics.byType[1].value)).toFixed(2) 
                : '-'}
            </span>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Token消耗趋势</h3>
            <LineChart data={trends.token || []} color="#8b5cf6" height={120} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Token类型占比</h3>
            <PieChart data={tokenAnalytics.byType || tokenDistribution} size={100} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">渠道分布</h3>
            <PieChart data={tokenAnalytics.byChannel || []} size={100} />
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">模型Token消耗分布</h3>
            <TopList data={tokenAnalytics.byModel || []} valueFormatter={(v) => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(1) + 'K' : v} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">提供商Token消耗分布</h3>
            <TopList data={tokenAnalytics.byProvider || []} valueFormatter={(v) => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(1) + 'K' : v} />
          </div>
        </div>
        
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 5 实例 (Token消耗)</h3>
          <TopList data={tokenAnalytics.topInstances || topInstances} valueFormatter={(v) => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(1) + 'K' : v} />
        </div>
      </div>
    );
  };

  const renderCostTab = () => {
    const costAnalytics = data?.costAnalytics || {};
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">总成本</p>
            <span className="text-2xl font-semibold text-rose-600 dark:text-rose-400">${(overview.totalCost || 0).toFixed(4)}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">平均每小时</p>
            <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">${((overview.totalCost || 0) / Math.max(1, selectedHours)).toFixed(4)}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">最高成本模型</p>
            <span className="text-2xl font-semibold text-violet-600 dark:text-violet-400">{costAnalytics.byModel?.[0]?.name || '-'}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">最高成本渠道</p>
            <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{costAnalytics.byChannel?.[0]?.name || '-'}</span>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">成本趋势</h3>
            <LineChart data={trends.cost || []} color="#f43f5e" height={120} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">模型成本占比</h3>
            <PieChart data={costAnalytics.byModel || []} size={100} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">渠道成本占比</h3>
            <PieChart data={costAnalytics.byChannel || []} size={100} />
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">模型成本排名</h3>
            <TopList data={costAnalytics.byModel || []} valueFormatter={(v) => '$' + v.toFixed(4)} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">提供商成本排名</h3>
            <TopList data={costAnalytics.byProvider || []} valueFormatter={(v) => '$' + v.toFixed(4)} />
          </div>
        </div>
        
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 5 实例 (成本)</h3>
          <TopList data={costAnalytics.topInstances || []} valueFormatter={(v) => '$' + v.toFixed(4)} />
        </div>
      </div>
    );
  };

  const renderMessageTab = () => {
    const messageAnalytics = data?.messageAnalytics || {};
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">已处理消息</p>
            <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{overview.messageProcessed?.toLocaleString() || 0}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">排队消息</p>
            <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{overview.messageQueued?.toLocaleString() || 0}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">平均耗时</p>
            <span className="text-2xl font-semibold text-cyan-600 dark:text-cyan-400">{(messageAnalytics.durationStats?.avg || histogramStats.messageDuration?.avg || 0).toFixed(1)}ms</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">最大耗时</p>
            <span className="text-2xl font-semibold text-rose-600 dark:text-rose-400">{messageAnalytics.durationStats?.max || histogramStats.messageDuration?.max || 0}ms</span>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">消息处理趋势</h3>
            <LineChart data={trends.messageProcessed || []} color="#10b981" height={120} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">渠道分布</h3>
            <PieChart data={messageAnalytics.byChannel || []} size={100} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">耗时分布</h3>
            <div className="space-y-4">
              <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{(messageAnalytics.durationStats?.avg || 0).toFixed(1)}ms</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">平均耗时</div>
              </div>
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{messageAnalytics.durationStats?.max || 0}ms</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">最大耗时</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="app-card p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 5 实例 (消息处理)</h3>
          <TopList data={messageAnalytics.topInstances || []} />
        </div>
      </div>
    );
  };

  const renderQueueTab = () => {
    const queueAnalytics = data?.queueAnalytics || {};
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">当前队列深度</p>
            <span className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{queueAnalytics.depthStats?.max || instances.reduce((a, i) => a + (i.queueDepth || 0), 0)}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">入队总数</p>
            <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{instances.reduce((a, i) => a + (i.enqueueTotal || 0), 0).toLocaleString()}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">出队总数</p>
            <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{instances.reduce((a, i) => a + (i.dequeueTotal || 0), 0).toLocaleString()}</span>
          </div>
          <div className="app-card p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">平均等待</p>
            <span className="text-2xl font-semibold text-violet-600 dark:text-violet-400">{(queueAnalytics.waitStats?.avg || histogramStats.queueWait?.avg || 0).toFixed(1)}ms</span>
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">队列深度趋势</h3>
            <LineChart data={trends.queueDepth || []} color="#f59e0b" height={120} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">通道分布</h3>
            <PieChart data={queueAnalytics.byLane || []} size={100} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">渠道分布</h3>
            <PieChart data={queueAnalytics.byChannel || []} size={100} />
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">通道入队排名</h3>
            <TopList data={queueAnalytics.byLane || []} />
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Top 5 实例 (入队数)</h3>
            <TopList data={queueAnalytics.topInstances || []} />
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">等待时间统计</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 bg-violet-50/50 dark:bg-violet-950/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{(queueAnalytics.waitStats?.avg || 0).toFixed(1)}ms</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">平均等待</div>
              </div>
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{queueAnalytics.waitStats?.max || 0}ms</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">最大等待</div>
              </div>
            </div>
          </div>
          <div className="app-card p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">队列深度统计</h3>
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{queueAnalytics.depthStats?.max || 0}</div>
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">最大队列深度</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedInstance) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-200 dark:bg-black/60" onClick={() => { setSelectedInstance(null); setDetailTab("overview"); }} />
        <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl dark:border-gray-700/60 dark:bg-gray-900/95">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700/60">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">实例详情</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedInstance.name}</p>
              </div>
              <span className={["inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", getStatusBadgeClass(selectedInstance.status)].join(" ")}>
                {selectedInstance.status}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedInstance(null); setDetailTab("overview"); }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto">
            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">基本信息</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "实例ID", value: selectedInstance.id },
                  { label: "主机名", value: selectedInstance.hostName },
                  { label: "运行时", value: selectedInstance.runtime },
                  { label: "最后活跃", value: selectedInstance.lastActive },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.value || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-700/60">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">总览指标</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { label: "活跃会话", value: (selectedInstance.activeSessions || 0).toLocaleString(), color: "text-blue-600 dark:text-blue-400" },
                  { label: "卡顿会话", value: selectedInstance.stuckSessions || 0, color: selectedInstance.stuckSessions > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-600 dark:text-gray-400" },
                  { label: "Token消耗", value: selectedInstance.tokenConsumption || "0", color: "text-violet-600 dark:text-violet-400" },
                  { label: "总成本", value: selectedInstance.totalCost || "$0", color: "text-rose-600 dark:text-rose-400" },
                  { label: "队列深度", value: selectedInstance.queueDepth || 0, color: "text-amber-600 dark:text-amber-400" },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/60">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                    <div className="mt-1">
                      <span className={["text-lg font-semibold", item.color].join(" ")}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-gray-100 dark:border-gray-700/60">
              <nav className="flex px-6 gap-1">
                {INSTANCE_DETAIL_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDetailTab(tab.key)}
                    className={[
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                      detailTab === tab.key
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {detailTab === "overview" && (
                <div className="space-y-6">
                  <div className="app-card p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">核心指标趋势</h4>
                    <LineChart data={trends.session || []} color="#8b5cf6" height={120} />
                  </div>
                </div>
              )}
              {detailTab === "session" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "会话总数", value: (selectedInstance.sessionTotal || 0).toLocaleString() },
                      { label: "活跃会话", value: (selectedInstance.activeSessions || 0).toLocaleString() },
                      { label: "卡顿会话", value: selectedInstance.stuckSessions || 0 },
                      { label: "成功率", value: selectedInstance.sessionTotal > 0 ? ((selectedInstance.sessionTotal - selectedInstance.stuckSessions) / selectedInstance.sessionTotal * 100).toFixed(1) + "%" : "100%" },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                        <div className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="app-card p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">会话状态趋势</h4>
                    <LineChart data={trends.session || []} color="#3b82f6" height={100} />
                  </div>
                </div>
              )}
              {detailTab === "token" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "Token总消耗", value: selectedInstance.tokenConsumption || "0" },
                      { label: "Input Token", value: selectedInstance.inputTokens || "0" },
                      { label: "Output Token", value: selectedInstance.outputTokens || "0" },
                      { label: "队列深度", value: selectedInstance.queueDepth || 0 },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                        <div className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="app-card p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Token消耗趋势</h4>
                    <LineChart data={trends.token || []} color="#8b5cf6" height={100} />
                  </div>
                </div>
              )}
              {detailTab === "cost" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "今日成本", value: selectedInstance.totalCost || "$0" },
                      { label: "每小时成本", value: overview.costStats?.hourlyRate || "$0" },
                      { label: "单Token成本", value: overview.costStats?.perToken || "$0" },
                      { label: "模型", value: distributions.costModel?.[0]?.name || "N/A" },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                        <div className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="app-card p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">成本趋势</h4>
                    <LineChart data={trends.cost || []} color="#f43f5e" height={100} />
                  </div>
                </div>
              )}
              {detailTab === "message" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "已处理消息", value: (selectedInstance.messageProcessed || 0).toLocaleString() },
                      { label: "排队消息", value: (selectedInstance.messageQueued || 0).toLocaleString() },
                      { label: "平均耗时", value: `${histogramStats.messageDuration?.avg || 0}ms` },
                      { label: "最大耗时", value: `${histogramStats.messageDuration?.max || 0}ms` },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                        <div className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="app-card p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">消息处理趋势</h4>
                    <LineChart data={trends.messageProcessed || []} color="#10b981" height={100} />
                  </div>
                </div>
              )}
              {detailTab === "queue" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: "当前队列深度", value: selectedInstance.queueDepth || 0 },
                      { label: "入队总数", value: (selectedInstance.enqueueTotal || 0).toLocaleString() },
                      { label: "出队总数", value: (selectedInstance.dequeueTotal || 0).toLocaleString() },
                      { label: "平均等待", value: `${histogramStats.queueWait?.avg || 0}ms` },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                        <div className="mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="app-card p-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">队列深度趋势</h4>
                    <LineChart data={trends.queueDepth || []} color="#f59e0b" height={100} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700/60">
            <button
              type="button"
              onClick={() => { setSelectedInstance(null); setDetailTab("overview"); }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <div className="flex items-start gap-3">
            <Icon name="alert" className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">数据加载失败</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200 underline"
              >
                点击重试
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {TIME_RANGES.slice(0, 6).map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => handleQuickTimeSelect(range.value)}
                  className={[
                    "px-3 py-1.5 text-sm font-medium transition-colors",
                    timeMode === "quick" && selectedTimeRange === range.value
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  ].join(" ")}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTimePicker(!showTimePicker)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors",
                  timeMode === "custom"
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                ].join(" ")}
              >
                <Icon name="calendar" className="h-4 w-4" />
                {timeMode === "custom" ? "自定义时间" : "精确时间"}
              </button>
              {showTimePicker && (
                <div className="absolute right-0 top-full mt-2 z-50 w-80 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">开始时间</label>
                      <input
                        type="datetime-local"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">结束时间</label>
                      <input
                        type="datetime-local"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                        className="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowTimePicker(false)}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyCustomTime}
                        disabled={!customStartTime || !customEndTime}
                        className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        应用
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">粒度: {granularityLabel}</span>
          </div>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>自动刷新:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {REFRESH_INTERVALS.map((interval) => (
                <option key={interval.value} value={interval.value}>{interval.label}</option>
              ))}
            </select>
            {refreshInterval > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">({countdown}秒后刷新)</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon name="refresh" className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")} />
            手动刷新
          </button>
        </div>
      </div>

      <div className="border-b border-gray-100 dark:border-gray-700/60">
        <nav className="flex gap-1">
          {PAGE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPageTab(tab.key)}
              className={[
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                pageTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {pageTab === "overview" && renderOverviewTab()}
      {pageTab === "session" && renderSessionTab()}
      {pageTab === "token" && renderTokenTab()}
      {pageTab === "cost" && renderCostTab()}
      {pageTab === "message" && renderMessageTab()}
      {pageTab === "queue" && renderQueueTab()}

      {renderDetailModal()}
    </div>
  );
}
