# Calculation App（计算助手）

一个基于 **React + TypeScript + Vite** 的心算训练与空间思维练习应用。核心逻辑集中在少数模块中，包含多种计算训练模式、历史记录统计、以及 3D 立体拼搭练习。界面为移动端友好的柔和色调风格。

## 功能概览

### 1) 计算训练
- **数量关系训练**：混合生成和差倍比、比例、等量替换、盈亏与还原类口算题，每题只需输入一个数值答案。
- **大九九除法**：训练、竞速两种题量设置。
- **商首位训练**：随机除数的首位判断，支持进入"除数选择模式"指定除数练习。
- **一位数专项**：进位加 / 退位减（仅填写个位尾数）。
- **两位数专项**：双进位加、双退位减、四数相加（完整答案）。
- **三位数专项**：进位加、退位减、任意加/减、加减混合、三乘一、三除一、进位/退位判断、确本位、和/差去尾、**首位差与退位、次位差与退位、末位差与退位**。
- **五位数除三位数专项**：反向放缩、平移法、任意五除三（允许 3% 误差）。
- **估算容错**：部分除法训练支持"相邻整数"或"误差 3% 内"判定，并在结果页提示精确值/误差率。

### 2) 3D 空间思维（积木训练）
- 3D 画布支持点击放置/叠加方块。
- 支持正、后、左、右、俯视与轴测视角切换。
- 支持切面模式（可调 X/Y/Z 倾斜与位置）观察截面。
- 支持颜色切换、删除模式、清空积木。

### 3) 训练记录与趋势分析
- 历史记录保存在 **localStorage**，默认保留最近 5000 条。
- 使用 **ECharts** 展示按模式分类的正确率与耗时趋势。

## 技术栈
- **React 18**
- **TypeScript**
- **Vite**
- **Three.js**（3D 积木模式）
- **three-bvh-csg**（CSG 截面布尔运算）
- **ECharts**（训练趋势图表）
- **Tailwind CSS**（样式）
- **Framer Motion**（动画）

## 项目结构

```
├── public/
│   └── icon.png              # 应用图标
├── src/
│   ├── App.tsx               # 视图组件与路由逻辑
│   ├── main.tsx              # React 应用入口
│   ├── hooks.ts              # 核心业务 hooks（游戏、历史、图表、导出、3D）
│   ├── types.ts              # 类型定义
│   ├── index.css             # Tailwind + 自定义设计系统
│   ├── lib/
│   │   ├── game-modes.ts     # 30+ 种心算模式定义
│   │   ├── history.ts        # 本地历史持久化
│   │   ├── history-api.ts    # 云端同步 API
│   │   ├── chart.ts          # ECharts 图表数据聚合
│   │   ├── random.ts         # 随机数工具
│   │   ├── formatters.ts     # 格式化工具
│   │   ├── date-utils.ts     # 日期工具
│   │   ├── export-excel.ts   # CSV 导出
│   │   ├── export-text.ts    # 文本报告导出
│   │   ├── ui-labels.ts      # UI 标签映射
│   │   └── utils.ts          # 通用工具
│   └── three/
│       ├── scene.ts          # 3D 场景初始化与体素交互
│       ├── section.ts        # CSG 截面模式
│       ├── shapes.ts         # 24 种考题形状定义
│       └── types.ts          # Three.js 相关类型
├── edge-functions/
│   └── api/history.js        # 历史记录云端 API
├── index.html                # Vite HTML 模板
├── package.json              # 依赖与脚本
├── tailwind.config.js        # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
└── vite.config.js            # Vite 配置
```

## 本地开发

```bash
npm install
npm run dev
```

## 构建与预览

```bash
npm run build
npm run preview
```

## 备注
- 该项目为单页应用（SPA），可直接部署到静态托管平台。
- 3D 模式与训练记录均在前端完成，云端同步为可选功能。
