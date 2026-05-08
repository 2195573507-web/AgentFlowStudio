# Agent F - Runtime Smoke Tester

Date: 2026-05-08
Working directory: D:\AgentFlowStudio

## Verdict

修复后 PASS.

`npm.cmd run test:launch-static` was rerun after the fix. The default sandbox run still failed at process spawn with `spawn EPERM`, so the same command was rerun with approval outside the sandbox. The real runtime smoke test completed successfully.

## Command

```powershell
npm.cmd run test:launch-static
```

## Runtime Result

- Access port: 4173
- URL: http://127.0.0.1:4173
- HTTP status: PASS, homepage returned HTTP 200
- Title check: PASS, page title contains `AgentFlow Studio`
- Service process stayed alive for more than 5 seconds: PASS
- `static-server.log` immediate-exit check: PASS, no immediate startup/exit errors found

## Chinese Keyword Results

- 仪表盘: PASS
- 项目管理: PASS
- 提示词实验室: PASS
- 日志分析: PASS
- 安全检查: PASS
- 共享记忆中心: PASS
- 设置: PASS

## Raw Test Summary

```text
PASS start-agentflow-static.bat 存在
PASS scripts/static-server.js 存在
PASS static-app/index.html 存在
PASS 服务地址已出现：http://127.0.0.1:4173
PASS 首页 HTTP 200
PASS 页面 title 包含 AgentFlow Studio
PASS HTML 包含中文关键词：仪表盘
PASS HTML 包含中文关键词：项目管理
PASS HTML 包含中文关键词：提示词实验室
PASS HTML 包含中文关键词：日志分析
PASS HTML 包含中文关键词：安全检查
PASS HTML 包含中文关键词：共享记忆中心
PASS HTML 包含中文关键词：设置
PASS 服务进程保持运行超过 5 秒
PASS static-server.log 未发现立即退出错误
PASS Static launch verification completed.
```
