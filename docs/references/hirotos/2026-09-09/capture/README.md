# 采集脚本

这些脚本记录采集方法；后续核对优先读取已归档结果，不需要重新运行。依赖项目现有 Playwright 与 Chrome；录像另需 Playwright ffmpeg。脚本只读网页并在原站执行本地浏览交互，不发信、不提交表单。

`audit.mjs` 主桌面/手机采集；`supplement.mjs` 宽屏/平板/JA/偏好测试（首轮贴纸命名曾命中Projects牌，归档时已按实际结果改名）；`motion.mjs` 正确杆体贴纸＋转场；`loading.mjs` 等待实际加载文字。重新运行会覆盖证据，因此不要为日常核对执行。