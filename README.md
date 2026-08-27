# Quota Watcher for Apple

Quota Watcher 的 Apple 平台工程：iOS App + Safari Web Extension（watchOS 规划中），由 Apple 官方 `safari-web-extension-converter` 生成的 Xcode 工程演进而来。

> Chrome 扩展（源码主仓库）：[coding-plan-quota-watcher](https://github.com/petrel2015/coding-plan-quota-watcher-chrome-extension)

## 仓库定位与分工

扩展的 JS 源码（用量拉取、DNR 注入、dashboard 页面等）**只在 Chrome 扩展仓库单源维护**，本仓库只持有 Apple 原生壳工程：

| | 扩展仓库（chrome） | 本仓库（apple） |
|---|---|---|
| 内容 | 扩展源码、vite 构建、测试 | Xcode 工程（iOS App + appex）、同步脚本 |
| 改动时机 | 任何扩展逻辑 / 页面改动 | Swift 壳、target 配置、图标、将来 watchOS |
| 构建产物流向 | `npm run build` 产出 `dist/` | 脚本同步进 `Quota Watcher Extension/Resources/` |

## 目录结构

```
├── Quota Watcher.xcodeproj        # Xcode 工程（iOS App + Safari 扩展两个 target）
├── Quota Watcher/                 # 主 App target（打开说明页的壳）
├── Quota Watcher Extension/       # Safari Web Extension target
│   ├── SafariWebExtensionHandler.swift
│   └── Resources/                 # 扩展运行时资源（npm run sync 同步生成/刷新）
├── scripts/sync-extension.mjs     # 从扩展仓库构建并同步资源
└── package.json                   # 仅提供 npm run sync
```

## 构建与运行

前置条件：macOS + Xcode（已在 Xcode 26 / iOS 26 模拟器验证），并把 [扩展源码仓库](https://github.com/petrel2015/coding-plan-quota-watcher-chrome-extension) clone 到本仓库**旁边**（同名默认路径），或用 `CHROME_EXT_ROOT` 环境变量指定其路径。

```bash
git clone https://github.com/petrel2015/coding-plan-quota-watcher-chrome-extension.git   # 与本仓库并排
git clone https://github.com/petrel2015/coding-plan-quota-watcher-apple.git
cd coding-plan-quota-watcher-apple
npm run sync    # 在扩展仓库执行 npm run build，并把产物同步到工程 Resources/
```

然后：

1. 用 Xcode 打开 `Quota Watcher.xcodeproj`
2. 选择 iPhone 模拟器（或插上真机后选择 iOS 设备）→ Run
3. 首次运行后到「设置 → App → Safari → 扩展 → Quota Watcher」打开扩展，并允许访问 `volcengine.com`、`minimaxi.com`、`chatgpt.com`、`bigmodel.cn`、`codex-reset.com` 这几个站点
4. 在 Safari 里点地址栏左侧的扩展按钮即可打开 dashboard；日常改完扩展代码后 `npm run sync` + Xcode 重新 Run

真机安装需在 Xcode 的 Signing & Capabilities 里配置开发者签名（免费 Apple ID 可用，签名 7 天过期需重装）。

## 与 Chrome 版的差异

- **background 打包形式**：Safari 不支持 manifest 的 `background.type: "module"`，扩展仓库把 background 构建为自包含 IIFE 单文件（无 import），Chrome 与 Safari 共用同一份产物。
- **DNR resourceTypes**：Chromium 下用 `resourceTypes` 收窄 DNR 匹配；WebKit 对扩展自身请求的类别划分不同，非 Chromium 环境自动省略该条件。
- **已知限制**：
  - iOS 锁屏 / Safari 被挂起时，alarm 定时刷新会被系统节流；打开 dashboard 会立即触发到期刷新兜底；
  - 每个站点的登录 Cookie 需要先在同一台设备的 Safari 里登录对应平台；
  - DNR 注入 Cookie 在 WebKit 上的实际拉取效果建议以真机实测为准（编译与容器启动已在 Xcode 26 / iOS 26 模拟器验证）。

## Roadmap

- [ ] 真机实测 DNR Cookie 注入效果
- [ ] watchOS target（原生实现，主仓库 issue 区记录需求）
