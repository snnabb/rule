#!/usr/bin/env node
'use strict';
// Local JSON adapter. Execute only an override script that you trust.
const fs = require('node:fs');
const path = require('node:path');

const [, , scriptPath, inputPath, outputPath] = process.argv;
if (!scriptPath || !inputPath || !outputPath) {
  console.error('用法：node apply-override.cjs <覆写.js> <原完整配置.json> <新配置.json>');
  process.exitCode = 1;
} else {
  try {
    const input = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8').replace(/^\uFEFF/, ''));
    const override = require(path.resolve(scriptPath));
    if (typeof override.main !== 'function') throw new Error('脚本没有导出 main(config)');
    const result = override.main(input);
    // 拒绝覆盖已有文件，避免误写原配置。
    fs.writeFileSync(path.resolve(outputPath), JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    console.log(`已生成：${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`生成失败：${error.message}`);
    process.exitCode = 1;
  }
}
