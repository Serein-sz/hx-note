#!/usr/bin/env bun
/**
 * Git 同步脚本 - 拉取远程更新并推送本地提交
 * 用法: bun run git-sync.ts
 */

import { $ } from "bun";

async function sync() {
  try {
    // 检查是否在 git 仓库中
    await $`git rev-parse --git-dir`.quiet();

    // 获取当前分支名
    const branch = (await $`git branch --show-current`.text()).trim();
    console.log(`📍 当前分支: ${branch}`);

    // 检查工作区是否干净
    const status = await $`git status --porcelain`.text();
    const hasChanges = status.trim().length > 0;

    if (hasChanges) {
      console.log("⚠️ 检测到未提交的更改，先自动提交...");
      await $`git add -A`;
      const message = `auto-sync: ${new Date().toLocaleString("zh-CN")}`;
      await $`git commit -m ${message}`;
      console.log(`✅ 已自动提交: ${message}`);
    }

    // 拉取远程更新（使用 rebase 保持提交历史整洁）
    console.log("⬇️ 正在拉取远程更新...");
    await $`git pull --rebase origin ${branch}`;
    console.log("✅ 拉取完成");

    // 推送本地提交
    console.log("⬆️ 正在推送本地提交...");
    await $`git push origin ${branch}`;
    console.log("✅ 推送完成");

    console.log("🎉 同步成功！");

  } catch (error) {
    console.error("❌ 同步失败:", error);
    process.exit(1);
  }
}

sync();
