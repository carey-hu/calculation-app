# 计算助手 - 优化测试版

一个用于数学计算训练的 Web App，支持 iOS PWA 模式，专为小学生设计的进位加、退位减、大九九除法专项练习工具。

## 📱 功能特点

- **16 种计算模式**：覆盖一位数到三位数的加减乘除
- **3D 空间思维训练**：立体拼合/积木训练模块
- **历史记录**：本地保存最近 5000 条训练数据
- **趋势图表**：ECharts 可视化正确率和耗时趋势
- **PWA 支持**：可添加到 iPhone 主屏幕，像原生 App 一样使用
- **iOS 风格 UI**：毛玻璃效果、安全区适配

---

## 🚀 快速开始

### 方式一：EdgeOne Pages 自动部署（推荐）

1. **Fork 或上传到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/calculation-app.git
   git push -u origin main
   ```

2. **登录 EdgeOne Pages 控制台**
   - 访问 [EdgeOne Pages](https://console.cloud.tencent.com/edgeone/pages)
   - 点击「新建项目」

3. **绑定 GitHub 仓库**
   - 选择你的仓库
   - EdgeOne 会自动检测 `edgeone.json` 配置
   - 构建命令：`npm install && npm run build`
   - 输出目录：`dist`

4. **等待部署完成**
   - 部署成功后会获得一个访问域名
   - 也可以绑定自定义域名

### 方式二：本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 在浏览器打开
# 默认地址：http://localhost:5173
```

### 方式三：手动构建部署

```bash
# 1. 构建生产版本
npm run build

# 2. 预览构建结果
npm run preview

# 3. 将 dist 目录上传到任意静态托管服务
```

---

## 📁 项目结构

```
calculation-app-optimized/
├── index.html              # 入口 HTML（含 PWA 配置）
├── package.json            # 依赖配置
├── vite.config.js          # Vite 构建配置
├── edgeone.json            # EdgeOne Pages 部署配置
├── public/                 # 静态资源（不经过构建处理）
│   └── icon.png            # App 图标（PWA 用）
├── README.md               # 项目说明
└── src/
    ├── main.js             # Vue 应用入口
    ├── App.vue             # 根组件（状态协调中心）
    │
    ├── components/         # 🧩 通用组件
    │   ├── MeshBackground.vue   # 动态背景装饰
    │   ├── ModeSelector.vue     # 模式选择器
    │   ├── NumKeypad.vue        # 数字键盘
    │   └── ToastMessage.vue     # Toast 提示
    │
    ├── views/              # 📄 页面视图
    │   ├── HomeView.vue         # 首页
    │   ├── SelectDivisorView.vue # 除数选择页
    │   ├── GameView.vue         # 游戏界面
    │   ├── ResultView.vue       # 结果页面
    │   ├── HistoryView.vue      # 历史记录页
    │   └── CubicView.vue        # 3D 积木页
    │
    ├── composables/        # 🔧 组合式函数（业务逻辑）
    │   ├── useGameState.js      # 游戏状态管理
    │   ├── useToast.js          # Toast 提示逻辑
    │   ├── useCubicMode.js      # 3D 积木逻辑
    │   └── useChart.js          # 图表功能
    │
    ├── config/             # ⚙️ 配置文件
    │   └── gameModes.js         # 游戏模式配置 ⭐重要
    │
    ├── utils/              # 🛠️ 工具函数
    │   ├── math.js              # 数学相关工具
    │   └── storage.js           # 本地存储工具
    │
    └── styles/             # 🎨 样式文件
        └── variables.css        # CSS 变量定义
```

---

## ✨ 优化亮点

| 对比项 | 优化前 | 优化后 |
|--------|--------|--------|
| 文件结构 | 单文件 850 行 | 20+ 文件，职责清晰 |
| 模式配置 | 硬编码在组件中 | 独立配置文件 |
| 业务逻辑 | 混在模板中 | Composables 分离 |
| 组件复用 | 无 | 通用组件可复用 |
| 新增模式 | 需改多处代码 | 只需改配置文件 |
| 可维护性 | 困难 | 简单 |

---

## 📝 如何添加新功能

### 🎮 添加新的计算模式（最常见）

只需编辑 `src/config/gameModes.js` 这一个文件！

#### 第一步：在 `GAME_MODES` 对象中添加新模式

```javascript
// src/config/gameModes.js

import { shuffle, buildBasePool, randomInt } from '@/utils/math'

export const GAME_MODES = {
  // ... 现有模式保持不变

  // ========== 添加新模式示例 ==========
  
  // 示例1：简单的乘法口诀
  multiplication: {
    name: '乘法口诀',           // 在首页显示的名称
    title: '乘法口诀完成！',     // 完成后的标题
    hintNote: '输入正确答案',    // 答题时的提示
    gen: (n) => {               // 题目生成函数，n 是题目数量
      const pool = []
      for (let i = 0; i < n; i++) {
        const a = randomInt(2, 9)
        const b = randomInt(2, 9)
        pool.push({
          dividend: a,          // 显示在前面的数
          divisor: b,           // 显示在后面的数
          ans: a * b,           // 正确答案
          symbol: '×'           // 运算符号
        })
      }
      return pool
    }
  },

  // 示例2：带自定义答案检查的模式（允许误差）
  estimation: {
    name: '估算',
    title: '估算练习完成！',
    hintNote: '误差 10% 以内即可',
    // 自定义答案检查函数
    check: (userAnswer, correctAnswer) => {
      const error = Math.abs(userAnswer - correctAnswer) / correctAnswer
      return {
        ok: error <= 0.1,  // 误差 10% 以内算对
        display: Math.round(correctAnswer)  // 显示的正确答案
      }
    },
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const a = randomInt(100, 999)
        const b = randomInt(2, 9)
        pool.push({
          dividend: a,
          divisor: b,
          ans: a * b,
          symbol: '×'
        })
      }
      return pool
    }
  },

  // 示例3：题目显示较长，需要小字体
  longExpression: {
    name: '连续运算',
    title: '连续运算完成！',
    hintNote: '按顺序计算',
    isSmallFont: true,  // 使用小字体显示题目
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const a = randomInt(10, 50)
        const b = randomInt(10, 50)
        const c = randomInt(1, 10)
        pool.push({
          dividend: `${a}+${b}`,  // 可以是表达式字符串
          divisor: c,
          ans: a + b + c,
          symbol: '+'
        })
      }
      return pool
    }
  }
}
```

#### 第二步：在 `MODE_GROUPS` 中添加到分组

```javascript
// src/config/gameModes.js

export const MODE_GROUPS = {
  // 添加到现有分组
  single: {
    label: '一位数专项 (仅填尾数)',
    modes: ['plus', 'minus', 'multiplication']  // ← 添加到这里
  },

  // 或者创建新的分组
  custom: {
    label: '自定义练习',
    modes: ['estimation', 'longExpression']
  }
}
```

#### 完成！

保存文件后，新模式会自动出现在首页的对应分组中。

---

### 📄 添加新页面

1. **创建视图组件** `src/views/NewView.vue`
2. **创建业务逻辑**（如需要）`src/composables/useNewFeature.js`
3. **在 `App.vue` 中引入并添加条件渲染**

```vue
<!-- src/App.vue -->
<template>
  <!-- ... -->
  <NewView 
    v-if="viewState === 'newPage'"
    @back="viewState = 'home'"
  />
</template>

<script setup>
import NewView from '@/views/NewView.vue'
// ...
</script>
```

---

### 🎨 自定义样式

修改 `src/styles/variables.css` 中的 CSS 变量：

```css
:root {
  /* 主题色 */
  --color-primary: #007aff;    /* 蓝色 - 可改成你喜欢的颜色 */
  --color-success: #34c759;    /* 绿色 */
  --color-warning: #ff9500;    /* 橙色 */
  --color-danger: #ff3b30;     /* 红色 */
  
  /* 圆角大小 */
  --border-radius-sm: 12px;
  --border-radius-md: 16px;
  --border-radius-lg: 20px;
  
  /* 更多变量见文件... */
}
```

---

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.3+ | 前端框架 |
| Vite | 4.3+ | 构建工具 |
| ECharts | 5.4+ | 图表可视化 |
| Three.js | 0.160+ | 3D 积木模块 |

---

## 📱 PWA 使用说明

### 在 iPhone 上添加到主屏幕

1. 用 Safari 打开部署后的网址
2. 点击底部「分享」按钮
3. 选择「添加到主屏幕」
4. 输入名称，点击「添加」
5. 现在可以像原生 App 一样从主屏幕启动

### 特性

- 全屏显示（隐藏浏览器地址栏）
- 支持刘海屏/灵动岛安全区
- 本地存储练习记录

---

## ❓ 常见问题

### Q: 部署后访问白屏？

检查浏览器控制台错误，常见原因：
1. `base` 路径配置错误 - 修改 `vite.config.js` 中的 `base`
2. 资源 404 - 确保 `dist` 目录完整上传

### Q: EdgeOne 构建失败？

查看构建日志，常见原因：
1. Node.js 版本问题 - 可在 `package.json` 指定版本
2. 依赖安装失败 - 检查网络或依赖版本

### Q: 历史记录丢失？

历史记录存储在浏览器 localStorage 中，以下情况会丢失：
- 清除浏览器数据
- 使用无痕/隐私模式
- 更换浏览器或设备

---

## 📄 License

MIT License

---

## 🙏 致谢

感谢使用本项目！如有问题或建议，欢迎提 Issue。
