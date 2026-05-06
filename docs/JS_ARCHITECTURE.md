# 前端 JavaScript 架构说明

本项目是无后端的静态前端原型，业务闭环依赖页面脚本、模拟数据和 `localStorage`。当前架构继续使用经典 `<script>` 与全局命名空间，不使用 `type="module"`、打包器或后端接口。

## 目录分层

```text
src/assets/js/
├── main.js              # 应用启动编排
├── core/                # 鉴权、导航、路由、页面壳、模块加载、光标等运行时能力
├── pages/               # landing、login、register、dashboard 等页面控制器
├── shared/              # 跨业务域复用的状态和视图工具
├── systems/             # 业务域真实实现
└── utils/               # 基础工具函数
```

## 启动流程

`main.js` 只负责启动编排：

1. 计算当前页面相对路径。
2. 动态加载 `utils` 和 `core` 运行时。
3. 按页面清单加载 `pages/<page>.js` 控制器及专属工具。
4. 执行登录鉴权。
5. 加载 header、sidebar、footer。
6. 初始化导航与移动端菜单。
7. 根据页面业务域加载 `data/<domain>.js` 与 `systems/<domain>`。
8. 初始化页面控制器或业务系统。

业务域脚本加载顺序固定为：

```text
shared/state.js
shared/confirm-dialog.js
shared/view.js
shared/charts.js
data/<domain>.js
systems/<domain>/store.js
systems/<domain>/actions.js
systems/<domain>/renderers.js
systems/<domain>/pages.js
```

## 业务域职责

每个 `systems/<domain>` 目录按职责拆分：

- `store.js`：维护 localStorage 状态、模拟数据默认值和状态快照。
- `actions.js`：封装新增、编辑、删除等业务操作，不直接写 DOM。
- `renderers.js`：封装状态映射、统计卡片、徽章、进度条等展示辅助。
- `pages.js`：根据当前页面绑定事件、调用 actions、刷新 DOM。

业务入口统一暴露为 `window.employeeSystem`、`window.salesSystem` 等 `xxxSystem` 全局对象，由 `module-loader.js` 直接调用 `init()`。历史 `window.xxxModule` 兼容门面已废弃。

## 共享组件化工具

`shared/view.js` 承担跨子系统页面组件逻辑：

- `renderRows`：统一渲染业务表格和空状态
- `filterByKeyword`：统一处理员工、客户、供应商、订单列表搜索
- `promptFields`：统一处理无后端原型中的新增记录采集
- `confirmDelete`：统一处理业务记录删除确认和刷新回调
- `createModalController`：统一处理业务弹窗标题、错误提示和编辑状态
- `renderStats`、`renderBadge`、`renderProgress`：统一后台统计卡片、状态徽章和生产进度条

业务页面只负责组织本页面的业务字段、事件绑定和刷新流程，不直接重复实现通用交互。

## 约束

- 不在业务页面恢复内联业务脚本。
- HTML 页面只保留 `assets/js/main.js` 单入口，具体依赖交给运行时加载器。
- 不使用 `export/import`，除非后续单独升级构建体系。
- 保持现有 localStorage key，例如 `xm_employee_state`、`xm_sales_state`。
- 新业务优先放入 `systems/<domain>`，页面级交互放入 `pages/`。
