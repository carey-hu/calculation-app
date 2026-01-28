Calculation App (计算助手)
一个基于 Vue 3 + Vite 开发的综合性心算训练与空间思维辅助应用。专为提高数学计算速度、精确度以及空间想象力而设计，包含多种专项训练模式、历史数据分析及 3D 积木操作功能。

✨ 主要功能 (Features)
1. 🧮 核心计算训练
包含基础到高阶的多种数学训练模式：

基础运算：进位加法、退位减法、大九九除法。

商首位专项：针对除法商的首位数字进行快速判断训练。

三位数专项：三乘一、三除一（含估算）、三数混合加减。

五除三专项（高阶）：

反向放缩法：除数 111-199 范围内的特殊除法。

平移法：特定商范围的快速计算。

任意五除三：支持 3% 误差容忍度 的估算训练。

误差分析：在估算模式下，结果页会自动计算并显示你的答案与精确结果的误差率及精确值。

2. 🧊 3D 空间思维 (Cubic Mode)
基于 Three.js 开发的 3D 积木游乐场，用于锻炼空间想象力：

自由搭建：支持点击地面放置方块，点击方块侧面进行叠加。

多视角切换：支持正视图、侧视图、俯视图及等轴测视图（ISO）的快速切换。

切面分析 (Slice Mode)：支持自定义 X/Y/Z 轴倾斜角度和位置的切面功能，观察立体图形的截面。

颜色与编辑：多种颜色积木切换，支持删除模式。

3. 📊 数据记录与分析
历史记录：本地存储最近 5000 条训练记录。

可视化图表：集成 ECharts，按训练模式展示正确率趋势和耗时变化。

详情回顾：可点击任意历史记录回看当时的答题详情（错题、耗时等）。

4. 🎨 UI/UX 设计
拟态风格 (Glassmorphism)：全局采用磨砂玻璃质感设计。

响应式布局：适配移动端与桌面端体验。

沉浸式背景：动态流体 Orb 背景动画。

🛠️ 技术栈 (Tech Stack)
核心框架: Vue 3 (Composition API)

构建工具: Vite

3D 引擎: Three.js

图表库: ECharts

🚀 快速开始 (Setup)
1. 安装依赖
确保你的环境中有 Node.js (推荐 v18+)。

Bash
npm install
2. 本地开发
启动开发服务器：

Bash
npm run dev
3. 生产构建
打包项目用于部署：

Bash
npm run build
构建完成后，静态文件将生成在 dist 目录中。

☁️ 部署指南 (EdgeOne / Vercel / Netlify)
本项目为纯静态 SPA (Single Page Application)，可轻松部署到各类边缘计算或静态托管平台。

针对腾讯云 EdgeOne Pages 的配置：
构建命令 (Build Command): npm run build

输出目录 (Output Directory): dist

Node 版本: 建议设置环境变量 NODE_VERSION 为 18 或 20。

注意: 确保 vite.config.js 中已正确处理 @ 别名（使用 fileURLToPath 而非 __dirname），以避免构建报错。

📂 项目结构
目前项目核心逻辑已高度整合，主要结构如下：

Plaintext
├── src/
│   ├── App.vue             # 核心入口（包含路由逻辑、游戏引擎、UI视图）
│   ├── main.js             # Vue 实例挂载
│   └── styles/
│       └── variables.css   # 全局样式变量
├── public/                 # 静态资源
├── index.html              # HTML 模板
├── package.json            # 依赖配置
└── vite.config.js          # Vite 构建配置
📝 更新日志
v2.0.0:

架构重构：整合为单文件组件，优化状态管理。

新增功能：3D 切面模式、五除三专项估算误差率显示。

修复：EdgeOne 部署兼容性问题 (ESM 路径解析)。

UI：全新的磨砂玻璃视觉风格。

License MIT
