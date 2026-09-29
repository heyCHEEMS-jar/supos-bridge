# Change Log

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
