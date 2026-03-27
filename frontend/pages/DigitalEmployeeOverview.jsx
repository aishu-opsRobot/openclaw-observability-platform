/** 数字员工 · 员工概览（演示） */
export default function DigitalEmployeeOverview() {
  const cards = [
    {
      title: "在岗数字员工",
      value: "24",
      hint: "含试运行",
      accent: "from-primary/10 to-blue-50 dark:from-primary/20 dark:to-gray-900",
    },
    {
      title: "今日对话量",
      value: "12.8k",
      hint: "较昨日 +6%",
      accent: "from-emerald-50 to-emerald-50/50 dark:from-emerald-950/50 dark:to-gray-900",
    },
    {
      title: "平均响应 (P95)",
      value: "1.2s",
      hint: "目标小于 2s",
      accent: "from-violet-50 to-violet-50/40 dark:from-violet-950/40 dark:to-gray-900",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="app-card p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">概览说明</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          汇总 OpenClaw 数字员工的在岗规模、会话与性能指标。数据为演示，可对接实际统计服务。
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <article
            key={c.title}
            className="relative overflow-hidden app-card p-6 transition hover:shadow-card-hover dark:hover:shadow-none"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.accent} opacity-90`} />
            <div className="relative">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{c.title}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{c.value}</p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{c.hint}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
