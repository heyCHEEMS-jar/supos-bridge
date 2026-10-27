# Change Log

## 0.0.22 - 2026-10-27

- 新增浏览器登录，通过平台官方页面获取并安全存储 ticket
- 新增登录命令，移除插件启动时登录，改为执行需要鉴权的操作前按需登录
- 请求缺少 ticket 或 ticket 失效时自动登录，并重新执行原请求一次
- 新增 `baseURL` 和 `loginAPIPath` 登录配置
- 新增运行时提示和扩展信息的中英文国际化

## 0.0.21 - 2026-09-30

- 原插件名 `SupOS Snippets` 更改为 `SupOS Bridge`

## 0.0.2 - 2026-09-29

- 类型声明改写到 `node_modules/@types/supos/index.d.ts`
- 移除配置 `suposSnippets.typesDir`
- 类型声明文件首次写入或内容变化后自动重启 TS 服务
- 项目结构调整：命令、常量、工具各自拆到独立模块
- 修复无参数的方法在悬浮文档末尾多出字面量 `undefined`

## 0.0.1 - 2026-09-20

- `scriptUtil` / `$os` API 代码片段与补全提示
- 生成 `supos.d.ts`，提供方法名、参数补全和悬浮文档
- 命令：生成类型声明、重启扩展
- 配置 `suposSnippets.typesDir` 指定输出目录
