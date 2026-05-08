# Agent B: Static Server Engineer

复查时间: 2026-05-08
检查对象: `D:\AgentFlowStudio\scripts\static-server.js`
约束: 本轮未修改 `scripts\static-server.js`，仅重新检查并更新本报告。

## 结论

修复后 PASS

`rootCandidates` 已包含 `static-app/dist`，此前阻断项已修复。其他静态服务器要求仍满足：纯 Node HTTP、日志写入 `logs\static-server.log`、捕获 `uncaughtException` / `unhandledRejection`、自动端口 `4173-4177`、自动打开浏览器、SPA fallback、MIME 覆盖、服务不立即退出。

## 复查结果

- PASS: `rootCandidates` 已包含 `static-app/dist`
  - 当前候选包含 `static-app`、`static-app/dist`、用户传入路径、`dist`、`dist-web`、`public`。
  - 关键位置: `scripts\static-server.js:16-22`。

- PASS: 纯 Node HTTP
  - 使用 `node:http` 创建服务。
  - 未依赖 Express、Vite preview 或其他 HTTP 框架。

- PASS: 日志写入 `logs\static-server.log`
  - `logsDir` 指向项目 `logs`。
  - `logPath` 指向 `logs/static-server.log`。
  - 启动时重写日志，运行中通过 `fs.appendFileSync` 追加。

- PASS: 捕获 `uncaughtException`
  - 已注册 `process.on('uncaughtException', ...)`。
  - 捕获后写日志并设置 `process.exitCode = 1`。

- PASS: 捕获 `unhandledRejection`
  - 已注册 `process.on('unhandledRejection', ...)`。
  - 捕获后写日志并设置 `process.exitCode = 1`。

- PASS: `static-app/dist` fallback
  - `static-app/dist` 已加入静态根候选列表。
  - 当 `static-app` 不可用且 `static-app/dist/index.html` 可用时，会被选为静态根。

- PASS: 自动端口 `4173-4177`
  - 默认首选端口为 `4173`。
  - 候选端口包含 `4173`、`4174`、`4175`、`4176`、`4177`。
  - 遇到 `EADDRINUSE` 会递归尝试下一个候选端口。

- PASS: 自动打开浏览器
  - `server.listen()` 成功后调用 `openBrowser(url)`。
  - Windows 使用 `cmd /c start`，macOS 使用 `open`，其他平台使用 `xdg-open`。
  - 支持通过 `AGENTFLOW_NO_OPEN=1` 跳过自动打开。

- PASS: SPA fallback
  - 对不存在的 HTML 路由或无扩展名路径回退到 `activeRoot/index.html`。
  - 对缺失的静态资源返回 404。

- PASS: MIME 覆盖
  - 覆盖 `.html`、`.js`、`.mjs`、`.css`、`.json`、`.svg`、`.png`、`.ico`、`.jpg`、`.jpeg`、`.webp`、`.woff`、`.woff2`、`.txt`。
  - 未覆盖扩展名回退到 `application/octet-stream`。

- PASS: 服务不立即退出
  - `http.Server.listen()` 会保持 Node 事件循环。
  - 已注册 `SIGINT`、`SIGTERM` 优雅关闭。
  - 全局异常处理不会直接 `process.exit()`。

- PASS: 语法检查
  - `node --check scripts\static-server.js` 通过。

## 剩余风险

- 低到中风险: `static-app` 仍排在 `static-app/dist` 前面。如果两个目录都存在且都有 `index.html`，服务会优先使用 `static-app`，不会使用 `static-app/dist`。这不影响“包含并可 fallback 到 `static-app/dist`”的复查结论，但如果期望构建产物优先，候选顺序还需要进一步调整。

- 低风险: 部分中文日志和 fallback HTML 字符串显示为乱码，可能影响可读性，但不影响本轮静态服务器能力项。

- 低风险: `writeFallbackApp()` 在找不到可用静态目录时会自动创建 `static-app` 文件。该行为可提高可用性，但在严格只读服务场景中可能产生意外文件。
