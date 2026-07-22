# MaaFramework 上线验收

本目录使用官方 `@maaxyz/maa-node` 运行时。`blackbox.cjs` 通过 MaaFramework 的 Win32 控制器启动独立浏览器窗口、发送真实鼠标/键盘输入并保存逐流程截图；`whitebox.cjs` 检查生产代码、资源签名和可复用锻造规则。

运行：

```powershell
npm run test:maa
```

黑盒覆盖：首页、营地、背包三分页、大陆地图、返回营地、存档列表、角色动作、五区域怪物招式、20 套 Boss 招式，以及投入稀材与核心的装备锻造。测试报告和截图输出到 `.codex_tmp/`，不会进入版本库。
