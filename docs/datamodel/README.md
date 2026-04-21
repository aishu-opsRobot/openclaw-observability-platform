# opsRobot 数据源总览（Data Model）

本目录描述 **opsRobot** 库中各业务数据表的来源、字段与用途，供采集、建模、查询与审计对齐使用。详细字段级说明请打开对应 Markdown 文档。

## 采集与入库架构

日志与配置类数据通常经 **Vector** 采集、清洗后写入 **Apache Doris**；整体流水线见：

[数据流水线架构（OTel / Vector / Doris）](../architecture/data-pipeline.md)

## 数据源索引

以下 **Doris 表名**、路径与概要均与各文档「一、基本信息」一致；字段级说明以对应 Markdown 为准。


| 文档                                                 | Doris 表名              | 数据名称（文档）             | 数据概要                                                  | 原始路径（与各文档「基本信息」一致）                                         |
| -------------------------------------------------- | --------------------- | -------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| [agent_models.md](./agent_models.md)               | `agent_models`        | Agent 模型配置数据         | 各 Agent 关联模型的基础配置、成本、能力范围及关联关系                        | `~/openclaw/agents/agentname/agent/modelsjson`             |
| [agent_sessions.md](./agent_sessions.md)           | `agent_sessions`      | OpenClaw Agent 会话元数据 | 会话标识、智能体/渠道、模型与 Token、技能快照、系统提示与上下文等                  | `~/openclaw/agents/{agentName}/sessions/sessions.jsonl`    |
| [agent_sessions_logs.md](./agent_sessions_logs.md) | `agent_sessions_logs` | Agent 会话日志           | 会话全生命周期事件：模型切换、消息、工具调用、错误、Token 等                     | `~/openclaw/agents/{agentName}/sessionS/{sessionid}.jsonl` |
| [audit_logs.md](./audit_logs.md)                   | `audit_logs`          | auditlogs（审计日志）      | OpenClaw 配置写入审计：时间、命令、配置路径、变更前后哈希、进程等                 | `~/.openclaw/logs/config-audit.log`                        |
| [gateway_logs .md](./gateway_logs%20.md)           | `gateway_logs`        | gatewaylogs（网关日志）    | 网关与 WS、可观测性、安全观测、agents/modelproviders 等模块的操作/错误/状态日志 | `~/openclaw/logs/`                                         |
| [openclaw_config.md](./openclaw_config.md)         | `openclaw_config`     | OpenClaw 配置数据        | 配置实例键、采集时间、沙箱/工作空间/网关/插件列表及脱敏配置 JSON 快照               | `~/openclaw/openclaw.json`                                 |


## 表之间的逻辑关系（简图）

```text
openclaw_config / agent_models     … 配置与模型维度
        │
        ▼
agent_sessions  ──────────────►  agent_sessions_logs
   （会话头表）                    （会话明细 / 事件流）
        │
        ├──────────────────────►  gateway_logs（网关侧观测）
        │
        └──────────────────────►  audit_logs（配置变更审计）
```

实际关联以各文档中的 **sessionid**、时间戳、Agent 标识等字段为准。