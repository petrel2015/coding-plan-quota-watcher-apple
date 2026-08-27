// 从 chrome 扩展仓库（源码单源）构建并同步扩展运行时资源到本工程的
// Quota Watcher Extension/Resources/
//
// 用法：npm run sync（可先用 CHROME_EXT_ROOT 环境变量指定扩展仓库路径，
// 默认取本仓库旁边的 ../coding-plan-quota-watcher）
//
// 流程：npm run build（两轮 vite 构建，产物含自包含 IIFE 的 background）
// → 「先清后拷」同步 7 项资源，保证 vite 带 hash 的旧 chunk 不会残留在
// Xcode 工程里。工程由 safari-web-extension-converter 首次生成后提交进
// 仓库，日常改动走本脚本刷新即可。
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extRoot = resolve(
  root,
  process.env.CHROME_EXT_ROOT || "../coding-plan-quota-watcher",
);
const resourcesDir = join(root, "Quota Watcher Extension", "Resources");

if (!existsSync(join(extRoot, "manifest.json"))) {
  console.error(
    `✗ 未找到扩展仓库 ${extRoot}：请把 coding-plan-quota-watcher checkout 到本仓库旁边，` +
      "或用 CHROME_EXT_ROOT 环境变量指定其路径。",
  );
  process.exit(1);
}

// 运行时必需文件（与 Chrome 商店 zip 打包口径一致，见扩展仓库 scripts/package.mjs）
const TOP_FILES = ["manifest.json", "common.css", "dashboard.html", "settings.html"];
const TOP_DIRS = ["_locales", "icons"];
const BUILD_DIR = "dist";

console.log(`→ 在 ${extRoot} 执行 npm run build ...`);
const build = spawnSync("npm", ["run", "build"], {
  cwd: extRoot,
  stdio: "inherit",
});
if (build.status !== 0) {
  console.error("✗ 扩展构建失败，中止同步。");
  process.exit(build.status ?? 1);
}

// 先清后拷
for (const name of [...TOP_FILES, ...TOP_DIRS, BUILD_DIR]) {
  rmSync(join(resourcesDir, name), { recursive: true, force: true });
}
for (const name of TOP_FILES) {
  copyFileSync(join(extRoot, name), join(resourcesDir, name));
}
for (const name of TOP_DIRS) {
  mkdirSync(join(resourcesDir, name), { recursive: true });
  cpSync(join(extRoot, name), join(resourcesDir, name), { recursive: true });
}
cpSync(join(extRoot, BUILD_DIR), join(resourcesDir, BUILD_DIR), { recursive: true });

console.log(`✓ 已同步扩展资源到 ${join("Quota Watcher Extension", "Resources")}`);
