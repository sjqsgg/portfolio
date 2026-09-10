# 字体、字号与响应式公式

[返回主规范](REFERENCE.md)

## 字体家族与真实字形

CSS 主字体：`helvetica-neue-lt-pro, sans-serif`。Adobe CSS 加载 300/400/500/700 正体；另有 `helvetica-neue-lt-pro-cond` 700，以及 `gazzetta-variable` 100–900 正/斜体。加载声明不代表每个字体都用于可见页面。

浏览器 CDP 实测：普通导航/正文为 `HelveticaNeueLTPro-Roman`；英文 h1/h2/首页职业为 `HelveticaNeueLTPro-Md`。日文在本机回退到 `HiraKakuProN-W3`。3D 姓名牌的 Gazzetta 是源代码 canvas font 设定；不可用 DOM 平台字体测量证明它的每个像素。

来源：[Adobe 字体声明](sources/adobe-font-declarations.css)。没有归档字体二进制；实现时需要自己的合法字体加载方式，不能把系统 Helvetica 当作精确等价。

## S：常规 CSS 字号

`vw` 为视口宽的 1%；括号中的加法是 CSS 数学表达式。不要把 min/max 层次简化成猜测的固定值。letter-spacing 0 在本机 computed style 可能序列化为 normal。

| 编号 | 元素 | font-size | 字重 | 行高倍率 | 字距 |
|---|---|---|---|---|---|
| T-01 | 导航／首页职业／页名／资料 | `max(12px,min(.8vw,7.8px + .28vw))` | 400；职业500 | `1；资料1.2–1.3` | `.045em；资料.018em` |
| T-02 | 首页姓名 | `max(24px,2.8vw)` | 500 | `.98` | `0` |
| T-03 | 页眉／About语言 | `max(13px,min(1vw,9.75px + .35vw))` | 500 | `.95` | `.035em；按钮.045em` |
| T-04 | Projects说明 | `max(21.5px,min(2.3vw,22.1px + .805vw))` | 500 | `1.08` | `0` |
| T-05 | About英文标题 | `max(34px,min(5vw,46.8px + 1.75vw))` | 500 | `.96` | `0` |
| T-06 | About日文标题 | `max(30px,min(4vw,36.4px + 1.4vw))` | 500（字形回退另记） | `.96` | `0` |
| T-07 | About正文 | `max(14px,min(1.2vw,10.4px + .42vw))` | 400 | `1.65` | `normal` |
| T-08 | Contact标题 | `max(34px,min(5.2vw,49.4px + 1.82vw))` | 500 | `.96` | `0` |
| T-09 | Contact链接 | `max(18px,min(1.8vw,15.6px + .63vw))` | 500 | `1` | `0` |
| T-10 | 详情标题 | `max(36px,min(5.5vw,54.6px + 1.925vw))` | 500 | `.88` | `0` |
| T-11 | 详情正文 | `max(15px,min(1.4vw,11.7px + .49vw))` | 400 | `1.55` | `normal` |
| T-12 | 图库悬停资料 | `max(11px,min(.733vw,7.15px + .25655vw))` | 400 | `1` | `.045em` |
| T-13 | 图库悬停标题 | `max(14px,min(.933vw,9.1px + .32655vw))` | 500 | `1` | `0` |
| T-14 | Loading文字 | `clamp(12px,1.35vw,15px)` | 500 | `1` | `.14em` |
| T-15 | SVG光标标签 | `max(10px,min(.667vw,6.5px + .23345vw))` | 700 | `SVG text` | `.035em` |

## S：≤620px 覆盖

| 编号 | 元素 | font-size | 字重 | 行高倍率 |
|---|---|---|---|---|
| T-01a | 首页 dt | max(10px,min(2.94vw,6.5px + 1.029vw)) | 400 | 1 |
| T-01b | 首页 dd | max(11px,min(3.235vw,7.15px + 1.13225vw)) | 400 | 1.25 |
| T-04m | Projects说明 | max(25px,min(7.6vw,21.45px + 2.66vw)) | 500 | 1.08 |
| T-09m | Contact链接 | max(18px,min(5.6vw,16.9px + 1.96vw)) | 500 | 1.08 |
| T-10m | 详情标题 | max(32px,min(9.6vw,31.2px + 3.36vw)) | 500 | .96 |
| T-11m | 详情正文 | max(14px,min(4.118vw,9.1px + 1.4413vw)) | 400 | 1.48 |
| T-03m | 详情语言按钮 | max(12px,min(3.529vw,7.8px + 1.23515vw)) | 继承400 | 1 |

## B：关键元素字号实测（CSS px）

| 页面/元素 | 390×844 | 768×1024 | 1512×820 | 1920×1080 |
|---|---|---|---|---|
| 首页姓名 | 24px | 24px | 42.336px | 53.76px |
| 首页职业 | 12px | 12px | 12.0336px | 13.176px |
| 导航 | 12px | 12px | 12.0336px | 13.176px |
| Projects说明 | 29.64px | 21.5px | 34.2716px | 37.556px |
| About EN标题 | 34px | 38.4px | 73.26px | 80.4px |
| About JA标题 | 30px | 30.72px | 57.568px | 63.28px |
| About正文 | 14px | 14px | 16.7504px | 18.464px |
| Contact标题 | 34px | 39.936px | 76.9184px | 84.344px |
| Contact链接 | 21.84px | 18px | 25.1256px | 27.696px |
| 详情标题 | 37.44px | 42.24px | 83.16px | 91.56px |
| 详情正文 | 14.7211px | 15px | 19.1088px | 21.108px |

表格按 DOM 中的对应正文顺序读取；详情代表样本是 WIRED，详情标题大小规则与其余项目相同，文本长度影响换行和块高。完整 font-family、line-height、letter-spacing、fontWeight 见逐状态 JSON。

## 3D 纹理字号（S，不是 CSS px）

| 纹理 | 字体 | 画布 font | 颜色 |
|---|---|---|---|
| 姓名/职业牌 | gazzetta-variable | 500 152px/1 | 黄底黑字 |
| Projects 跑马灯 | helvetica-neue-lt-pro | 400 72px/1 | #133afd 底，#f7f5ef 字 |
| Contact 牌 | helvetica-neue-lt-pro | 700 172px/1 | #fff 底，#0047bd 字与箭头 |

以上画布为 1024²，最终显示尺寸还取决于 UV、模型、镜头、透视和屏幕。