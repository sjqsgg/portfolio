# 资源与技术参数

[返回主规范](REFERENCE.md)

## 公开资源来源

| 资源 | 来源 | 本地记录 |
|---|---|---|
| 页面CSS | https://www.hirotos.com/_next/static/chunks/0eww1-_2ge2d5.css | [CSSOM样式快照](sources/computed-stylesheet.css) |
| Adobe字体 | https://use.typekit.net/nof0axs.css | [字体声明](sources/adobe-font-declarations.css) |
| 主应用脚本 | https://www.hirotos.com/_next/static/chunks/0prlkf15mqsq4.js | 已读参数归入主文档与specification.json；原脚本SHA-256见manifest |
| 3D模型 | https://www.hirotos.com/models/model.glb | [glTF结构及材质元数据](evidence/model-metadata.json) |
| 贴纸清单 | https://www.hirotos.com/stickers/manifest.json | [manifest](evidence/sticker-manifest.json) |
| 视频纹理 | https://www.hirotos.com/videos/hirotos_showreel.mp4 | 只记录来源与渲染参数，未下载视频文件 |
| 城市HDR | https://raw.githubusercontent.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/potsdamer_platz_1k.hdr | 浏览器请求已确认，未打包资源文件 |

截图和录像均由浏览器采集；录像是访问过程，不是下载的原站视频。资源文件的完整复制不是这份视觉规范的交付范围。

## 八项目图片与外链

| 序号 | 标题 | 源码声明宽高比（S） | Category / Role | 目标地址 |
|---|---|---|---|---|
| 01 | d.brain | [844×594](https://www.hirotos.com/projects/dbrain.png) | Web site / DESIGN / FRONT-END DEVELOPMENT | https://www.dbrain1991.co.jp |
| 02 | WIRED | [2400×1794](https://www.hirotos.com/projects/wired.png) | Web site / DESIGN / FRONT-END DEVELOPMENT / 3D MODELING | https://wired.jp/article/wired-innovation-award-2025/ |
| 03 | PROTO 2026 | [2538×1584](https://www.hirotos.com/projects/prtfolio_proto_2026.png) | Web site / DESIGN / FRONT-END DEVELOPMENT / 3D MODELING | https://archive-proto-2026.hirotos.com |
| 04 | Noodle | [3226×1716](https://www.hirotos.com/projects/demo01.png) | Demo site / DESIGN / FRONT-END DEVELOPMENT / 3D MODELING | https://demo-01-3d-motion.hirotos.com |
| 05 | TRACK | [1371×976](https://www.hirotos.com/projects/track.png) | Demo site / DESIGN / FRONT-END DEVELOPMENT / 3D MODELING | https://demo-03-track.hirotos.com |
| 06 | PORTFOLIO 2022 | [1500×1440](https://www.hirotos.com/projects/portfolio2022.png) | Web site / DESIGN / FRONT-END DEVELOPMENT | https://archive.hirotos.com/portfolio2022/ |
| 07 | SHOWREEL 2025 | [2258×1470](https://www.hirotos.com/projects/showreel.png) | Showreel / 3D MODELING / MOTION | https://reel.hirotos.com |
| 08 | Tap to meet you | [1465×879](https://www.hirotos.com/projects/tap_to_meet_you.png) | Demo site / DESIGN / FRONT-END DEVELOPMENT / 3D MODELING | https://demo-02-tap-to-meet-you.hirotos.com/ |

表中宽×高来自源码 aspect 的分子/分母，未另读每张 PNG 文件头验证自然尺寸。图片容器通过 object-fit:cover 裁切，因此源图比例不等于卡片/详情比例。细节截图保存的是实际裁切结果。

## 模型与相机（S）

模型 862,124 bytes，glTF 2.0，Blender exporter v5.0.21，扩展 KHR_materials_clearcoat。元数据保留全部节点层级、材质和动画通道。原始 GLB 几何及完整动画采样值未打包；若未来要精确复用原模型，仍需获取原资源，不能从这些截图无损还原。

透视相机垂直 FOV = 0.16835126306094314 rad（约 9.645817°），near .1、far 1000。GLB初始aspect16:9，运行时覆盖为视口比例。相机局部 translation `[0,-1.9502892494,2.86937356]`、quaternion `[.2940705121,0,0,.9557837844]`；这是父节点空间，不能直接当世界相机位置。CameraAction 驱动节点41的rotation，49键、0–2s。

## 作者材质与运行时覆盖

glTF baseColorFactor 为线性颜色。下表保留线性RGB，不能直接乘255当截图sRGB；最终颜色还叠加灯光/曝光/HDR。

| 材质 | 原始线性RGB | metalness | roughness | 特性 |
|---|---|---|---|---|
| Material.002 | [1, 0.916131, 0.004392] | 0.091948 | 0.125131 | — |
| light1 | [0.004286, 0.004286, 0.004286] | 0 | 0.049367 | — |
| Metallic | [0.8, 0.8, 0.8] | 1 | 0 | — |
| light2 | [0.004286, 0.004286, 0.004286] | 0 | 0.049367 | — |
| light3 | [0, 0, 0] | 0 | 0.049367 | — |
| Metallic.002 | [0.8, 0.8, 0.8] | 1 | 0.171582 | — |
| Material | [1, 0.93806, 0.911329] | 0.165899 | 0.297235 | clearcoat |
| hiroto-profile | [1, 0.932183, 0.163055] | 0 | 0.2 | — |
| to_contact | [1, 1, 1] | 0 | 0.2 | — |
| to_projects | [0.120181, 0.284904, 1] | 0 | 0.2 | clearcoat |
| hirotos_showreel | [1, 1, 1] | 0 | 0.038636 | clearcoat |

| 运行时纹理材质 | metalness | roughness | emissiveIntensity | toneMapped |
|---|---|---|---|---|
| hiroto-profile | 0 | .54 | .72 | false |
| to_projects | 0 | .48 | .68 | false |
| to_contact | 0 | .50 | .86 | false |
| hirotos_showreel | 0 | .62 | .56 | false |

三灯运行时颜色 `#ff2b1f` / `#ffd21f` / `#12d7a8`；激活 emissive `2.8×(.74+.26×sin(phase))`，未激活颜色 `#050505`、emissive .05。纹理颜色可设为白/自发光白，实际图案来自 map/emissiveMap，不是所有牌面实际变白。

## 灯光与后处理

- ambient intensity .18。
- hemisphere 上色白、地色 #ddd8cf、intensity 2.15。
- 主光位置 [4.8,6.2,4.2]，颜色 #fff7ed，intensity 1.1；阴影2048，bias -.00012。
- Environment city HDR，intensity .42；网格castShadow/receiveShadow启用。
- WebGL抗锯齿、alpha、preserveDrawingBuffer true；DPR [1,2]；frameloop always；PCF阴影(type 1)。
- ACES Filmic tone mapping(type 4)，exposure 2.04；composer multisampling8/resolutionScale1，SMAA与ChromaticAberration。
- 视频texture：sRGB、flipY false、禁mipmap、Linear过滤、anisotropy最高8；对比度1.16、饱和度1.04、颜色裁到.88。

## 贴纸

4张普通贴纸 `/stickers/sticker-01.png` 至 `sticker-04.png`；2张证书 `certificate-hiroto-sato-sotd.png` 与 `developer_certificate.png`。普通scale1/转角±60°，证书scale1.8/转角±5°。图案可从贴纸预览截图和点击录像核对。

## 技术边界

识别到 Next.js/Turbopack、React、Three.js r184 与 GSAP（SplitText/FLIP/ScrambleText/CustomEase）。未基于库名猜测实际动画；参数来自业务调用。CSS档案含未使用旧规则，主规范已区分活动DOM与旧grid类。网络请求清单在 discovery.json；平台字体记录在每页JSON。