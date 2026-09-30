# SupOS Bridge

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![esbuild](https://img.shields.io/badge/esbuild-FFCF00?logo=esbuild&logoColor=black)
![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?logo=visualstudiocode&logoColor=white)

supOS 可编程组件 `scriptUtil` / `$os` API 的代码片段、补全提示与悬浮文档。

---

## 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)

## 安装

在 VS Code 扩展面板搜索 `SupOS Bridge` 安装。

## 使用

打开工作区后会自动把类型声明写到 `node_modules/@types/supos/index.d.ts`，需要在 `tsconfig.json` / `jsconfig.json` 的 `compilerOptions.types` 里加上 `"supos"`，例如 `{ "compilerOptions": { "types": ["supos"] } }`，之后在 JS/TS 里输入 API 即可看到补全和文档。

如果没生效，运行命令 `SupOS Bridge: 生成类型声明 (supos.d.ts)` 或 `SupOS Bridge: 重启扩展`。
