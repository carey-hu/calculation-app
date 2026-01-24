# 计算助手 - 优化版

一个用于数学计算训练的 Web App，支持 iOS PWA 模式。

## 🎯 项目结构

```
calculation-app-optimized/
├── index.html              # 入口HTML（PWA配置）
├── package.json            # 依赖配置
├── vite.config.js          # Vite构建配置
├── icon.png                # App图标
└── src/
    ├── main.js             # Vue入口
    ├── App.vue             # 主组件（状态协调）
    ├── components/         # 通用组件
    │   ├── MeshBackground.vue   # 背景装饰
    │   ├── ModeSelector.vue     # 模式选择器
    │   ├── NumKeypad.vue        # 数字键盘
    │   └── ToastMessage.vue     # Toast提示
    ├── views/              # 页面视图
    │   ├── HomeView.vue         # 首页
    │   ├── SelectDivisorView.vue # 除数选择
    │   ├── GameView.vue         # 游戏界面
    │   ├── ResultView.vue       # 结果页面
    │   ├── HistoryView.vue      # 历史记录
    │   └── CubicView.vue        # 3D积木
    ├── composables/        # 组合式函数（业务逻辑）
    │   ├── useGameState.js      # 游戏状态管理
    │   ├── useToast.js          # Toast提示
    │   ├── useCubicMode.js      # 3D积木逻辑
    │   └── useChart.js          # 图表功能
    ├── config/             # 配置文件
    │   └── gameModes.js         # 游戏模式配置 ⭐
    ├── utils/              # 工具函数
    │   ├── math.js              # 数学工具
    │   └── storage.js           # 本地存储
    └── styles/             # 样式文件
        └── variables.css        # CSS变量
```

## 🚀 优化内容

### 1. 模块化拆分
- **之前**: 单文件 850 行
- **之后**: 拆分为 20+ 个文件，职责清晰

### 2. 组合式函数 (Composables)
使用 Vue 3 Composition API，将业务逻辑抽离为可复用的函数：
- `useGameState` - 游戏核心状态和逻辑
- `useToast` - Toast 提示
- `useCubicMode` - 3D 积木功能
- `useChart` - ECharts 图表

### 3. 配置分离
游戏模式配置独立到 `config/gameModes.js`，添加新模式无需修改其他文件。

### 4. 组件解耦
- 视图组件只负责 UI 渲染
- 逻辑由 composables 处理
- 通过 props 和 events 通信

## 📝 如何添加新功能

### 添加新的计算模式

1. 打开 `src/config/gameModes.js`

2. 在 `GAME_MODES` 对象中添加新模式：

```javascript
export const GAME_MODES = {
  // ... 现有模式

  // 新模式示例：乘法口诀
  multiplication: {
    name: '乘法口诀',           // 显示名称
    title: '乘法口诀完成！',     // 完成标题
    hintNote: '输入正确答案',    // 提示文字
    isSmallFont: false,         // 是否使用小字体（题目较长时用）
    
    // 答案检查函数（可选，默认整数比较）
    // check: (userAnswer, correctAnswer) => ({ ok: boolean, display: string })
    
    // 题目生成函数
    gen: (n) => {
      const pool = []
      for (let i = 0; i < n; i++) {
        const a = randomInt(2, 9)
        const b = randomInt(2, 9)
        pool.push({
          dividend: a,    // 第一个数
          divisor: b,     // 第二个数
          ans: a * b,     // 答案
          symbol: '×'     // 运算符
        })
      }
      return pool
    }
  }
}
```

3. 在 `MODE_GROUPS` 中添加到对应分组：

```javascript
export const MODE_GROUPS = {
  // ... 现有分组
  
  // 添加到现有分组
  single: {
    label: '一位数专项',
    modes: ['plus', 'minus', 'multiplication']  // 添加新模式
  },
  
  // 或创建新分组
  newCategory: {
    label: '新的分类',
    modes: ['multiplication', 'otherMode']
  }
}
```

完成！新模式会自动出现在首页。

### 添加新的页面/功能模块

1. 在 `src/views/` 创建新视图组件
2. 在 `src/composables/` 创建对应的逻辑函数
3. 在 `App.vue` 中引入并添加路由逻辑

### 自定义样式

修改 `src/styles/variables.css` 中的 CSS 变量：

```css
:root {
  --color-primary: #007aff;    /* 主题色 */
  --color-success: #34c759;    /* 成功色 */
  --border-radius-md: 16px;    /* 圆角 */
  /* ... */
}
```

## 🔧 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📱 部署到 EdgeOne

1. 运行 `npm run build`
2. 将 `dist` 目录上传到 EdgeOne
3. 配置为 SPA 模式

## 🎨 设计特点

- iOS 风格毛玻璃效果
- 响应式安全区适配
- PWA 支持（添加到主屏幕）
- 流畅的动画过渡

## 📄 技术栈

- Vue 3 (Composition API)
- Vite 4
- ECharts 5 (图表)
- Three.js (3D模块)
