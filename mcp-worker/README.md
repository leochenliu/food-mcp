# McDonald's Ordering MCP Server (Cloudflare Worker)

把原项目里「模拟的 MCP 工具」抽成**真实的、可远程调用的 MCP 服务**，部署在 Cloudflare Workers 上，与 React 演示 UI 完全解耦。

技术栈：`agents` (McpAgent) + `@modelcontextprotocol/sdk` + Streamable HTTP 传输。
每个 MCP 客户端连接对应一个 Durable Object 会话，购物车 / 环境状态保存在会话内。

## 目录结构

```
mcp-worker/
├── wrangler.toml        # Worker 配置（DO 绑定 + nodejs_compat）
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts         # McpAgent 入口 + 8 个 MCP 工具注册
    ├── catalog.ts       # 菜单 / 优惠券数据（与 UI 解耦的独立副本）
    ├── order.ts         # recalculateOrder 金额重算（唯一计费真相源）
    └── types.ts         # 领域类型
```

## 暴露的 MCP 工具

| 工具 | 说明 |
|------|------|
| `add_item_to_cart` | 按 SKU + 数量加购，校验库存与早餐时段 |
| `remove_item_from_cart` | 按 SKU 移除购物车项 |
| `set_delivery_scenario` | 切换外卖/自提，计算外送费 |
| `bind_coupon` | 绑定优惠券（MCD50 / MCD_BREAKFAST_15 / MCD_BURGER_20），校验时段与门槛 |
| `redeem_points_hashbrown` | 500 积分兑换免费脆薯饼 |
| `lock_order` | 锁定订单、冻结价格与库存 |
| `create_order` | 生成订单 UUID 与取餐码 |
| `list_nutrition` | 汇总购物车营养指标 |
| `sync_state` | **内部桥接工具**：由宿主（`food-mcp` 的 `server.ts`）在每次工具调用前调用，把当前购物车 / 环境 / 技能开关灌入本会话，使无状态的宿主与有状态的 Worker 保持一致。**不会**暴露给 LLM |

所有金额永远由 `recalculateOrder()` 在服务端计算，工具只改状态、不自行算价（安全隔离）。

## 本地开发 / 测试

```bash
npm install
npm run dev                 # wrangler dev，默认 http://localhost:8788
```

用 MCP Inspector 验证（另开终端）：

```bash
npx @modelcontextprotocol/inspector@latest
```

在 Inspector 中填入 `http://localhost:8788/mcp` → Connect → List Tools，即可看到并调用 8 个工具。

## 部署到 Cloudflare

```bash
npx wrangler login          # 浏览器登录你的 Cloudflare 账号
npm run deploy              # = wrangler deploy
```

部署成功后，远程端点为：

```
https://mcd-mcp-server.leochenliu.workers.dev/mcp
```

（`<你的账号>` 已替换为本账号实际的 `workers.dev` 子域 `leochenliu`；若你换账号部署，请相应修改子域部分。）

任何支持远程 MCP 的客户端（Claude Desktop 通过 `mcp-remote`、AI Playground 等）均可直接连接。

## 说明

- 目前为**免认证**公开服务（任何人可连接调用）。如需登录鉴权，可接入 Cloudflare Access 或第三方 OAuth（GitHub / Google 等）。
- 本 Worker 是独立部署单元，不依赖主项目的 `MINIMAX_API_KEY`；它与 LLM 无关，只负责事务工具。
- 旧版 `server.ts` 中的 MCP 调用仍是本地模拟；如需让主项目改用本远程 MCP，可后续将 `MCP_TOOLS` 的执行指向该端点。
