# 企业管理系统前端：整体分析报告与 4 人团队开发策略

> **历史说明**：本文档包含早期 `modules/` 迁移策略。当前代码已经采用 `systems/<domain>/store/actions/renderers/pages` 分层，新的维护规则以 `docs/JS_ARCHITECTURE.md` 为准。

## 1. 文档目的

本文档将当前仓库的整体分析结论沉淀为正式文档，用于指导：

- 从 0 开发时的文件编写顺序
- 4 人团队的并行开发边界
- 共享文件的冲突控制策略
- 在“每人每周仅 2 小时”的前提下，按双周推进的提交计划

本文档基于仓库当前真实结构整理，不按“理想架构”假设，不把它误判为前后端分离项目。

---

## 2. 项目真实形态

当前项目位于 `web/` 子目录，是一个基于原生 HTML、CSS、JavaScript 的静态前端原型项目。

### 2.1 关键证据

- `web/package.json`：只包含本地静态服务脚本，没有后端框架依赖
- `web/start.js`：本地启动脚本，用于寻找端口并启动 `http-server`
- `web/src/pages/**/*.html`：共 37 个页面，包含首页、登录页、注册页及 6 个业务子系统页面
- `web/src/data/*.js`：6 个业务域的模拟数据文件
- `web/src/assets/js/main.js`：全局初始化入口
- `web/src/assets/js/modules/auth.js`：登录态鉴权与跳转
- `web/src/assets/js/modules/navigation.js`：侧边栏高亮、用户渲染、退出绑定
- `web/src/assets/js/modules/mobile-nav.js`：移动端侧边栏交互
- `web/src/components/header.html` / `sidebar.html`：后台页公共壳组件
- `web/src/assets/css/main.css`：统一样式入口，导入全部基础/组件/页面样式

### 2.2 重要事实

这个仓库的主要业务逻辑并没有很好地下沉到 `src/assets/js/modules/*.js`，而是大量直接写在各页面内联 `<script>` 中。也就是说：

- 共享样式和共享 JS 是“名义上的公共层”
- 业务页面实际仍然高度依赖页面内联逻辑
- 每个业务域内部多个页面共用一个 `src/data/<domain>.js`
- 后台页普遍重复加载 `header.html` 和 `sidebar.html`

这决定了从 0 开发时必须优先稳住共享底座和数据契约，再批量开发页面。

---

## 3. 架构分层

从仓库结构看，可以拆成 5 层。

### 3.1 运行与项目配置层

主要文件：

- `web/package.json`
- `web/start.js`
- `web/README.md`
- `web/docs/*`

职责：

- 本地开发启动
- 目录说明与开发规范沉淀
- 团队协作约定

特点：

- 改动少，但对团队整体协作影响大
- 适合在项目最开始就定好，不适合频繁变更

### 3.2 共享样式层

主要文件：

- `web/src/assets/css/base/*`
- `web/src/assets/css/components/*`
- `web/src/assets/css/pages/*`
- `web/src/assets/css/main.css`

职责：

- 主题变量
- 基础 reset / typography
- 通用组件样式（按钮、表单、表格、卡片、模态框、头部、侧边栏）
- 页面级样式入口聚合

特点：

- `main.css` 是统一入口，天然是高冲突文件
- 各业务域页面样式文件是中冲突文件
- `variables.css` 一旦变动会波及全站

### 3.3 共享脚本层

主要文件：

- `web/src/assets/js/utils/dom.js`
- `web/src/assets/js/utils/storage.js`
- `web/src/assets/js/utils/format.js`
- `web/src/assets/js/utils/validate.js`
- `web/src/assets/js/modules/auth.js`
- `web/src/assets/js/modules/navigation.js`
- `web/src/assets/js/modules/mobile-nav.js`
- `web/src/assets/js/main.js`

职责：

- DOM 工具
- 存储工具
- 格式化与表单验证
- 登录守卫、导航高亮、退出登录
- 移动端侧边栏
- DOMContentLoaded 后的全局初始化

特点：

- `main.js`、`auth.js`、`navigation.js`、`mobile-nav.js` 是所有后台页的共同依赖
- 这部分改动范围广，必须严格控制 owner

### 3.4 共享组件层

主要文件：

- `web/src/components/header.html`
- `web/src/components/sidebar.html`
- `web/src/components/footer.html`

职责：

- 提供后台页公共头部与侧边栏
- 统一页面壳层

特点：

- 一次修改会影响全部后台页面
- 是最典型的高冲突共享面

### 3.5 业务页面与数据层

主要文件：

- `web/src/pages/employee/*`
- `web/src/pages/sales/*`
- `web/src/pages/purchase/*`
- `web/src/pages/warehouse/*`
- `web/src/pages/production/*`
- `web/src/pages/equipment/*`
- `web/src/data/employee.js`
- `web/src/data/sales.js`
- `web/src/data/purchase.js`
- `web/src/data/warehouse.js`
- `web/src/data/production.js`
- `web/src/data/equipment.js`

职责：

- 每个业务域的首页、列表、详情、统计、流程、预警等页面
- 每个业务域的数据结构和模拟数据

特点：

- 同一个域的多个页面共享同一数据文件
- 同一个域的多个页面通常共享同一个页面样式文件
- 页面本身低冲突，但域内共享数据和域样式是中冲突

---

## 4. 当前代码结构暴露出的真实问题

### 4.1 页面重复模式很多

后台页面普遍存在重复模式：

- 重复 `fetch` 加载 `header.html`
- 重复 `fetch` 加载 `sidebar.html`
- 重复调用 `appNav.init()`
- 重复等待组件加载后执行 `MobileNav.init()`
- 重复引入 `utils + auth + navigation + mobile-nav + main.js + data.js`

这说明项目天然适合“页面家族化”开发，而不是逐页零散开发。

### 4.2 大量逻辑停留在内联脚本

虽然 `src/assets/js/modules/` 目录存在，但多个业务域模块文件基本未真正承载页面逻辑。结果是：

- 同类页面逻辑难以复用
- 批量修复困难
- 从 0 开发时如果继续沿用这一方式，后续维护成本会持续升高

### 4.3 共享文件冲突风险极高

特别是：

- `web/src/assets/css/main.css`
- `web/src/assets/js/main.js`
- `web/src/components/header.html`
- `web/src/components/sidebar.html`
- `web/src/assets/js/modules/auth.js`
- `web/src/assets/js/modules/navigation.js`
- `web/src/assets/js/modules/mobile-nav.js`

这些文件一旦在同一周期被多人同时修改，冲突会非常频繁。

### 4.4 LSP 也在提示结构性问题

当前仓库已有一些质量信号：

- 多个 HTML 页面有按钮缺少 `type`
- 多页存在未使用变量或未使用函数
- 多页存在模板字符串与写法规范问题

这些问题不是本次分析主题，但它们说明共享模式尚未完全稳定，进一步证明应先固化底层规范和样板页，而不是先铺满所有页面。

---

## 5. 从 0 开发时的正确文件编写顺序

### 第 0 阶段：先写规则和项目入口

优先顺序：

1. `web/README.md`
2. `web/docs/DEV_STANDARDS.md`
3. `web/docs/CSS_JS_SPEC.md`
4. `web/package.json`
5. `web/start.js`

原因：

- 团队总工时极少
- 如果不先锁命名、目录、样式和脚本约定，后续返工成本会比开发成本更高

### 第 1 阶段：先写共享底座

优先顺序：

1. `web/src/assets/css/base/variables.css`
2. `web/src/assets/css/base/reset.css`
3. `web/src/assets/css/base/typography.css`
4. `web/src/assets/css/components/button.css`
5. `web/src/assets/css/components/form.css`
6. `web/src/assets/css/components/table.css`
7. `web/src/assets/css/components/card.css`
8. `web/src/assets/css/components/modal.css`
9. `web/src/assets/css/components/header.css`
10. `web/src/assets/css/components/sidebar.css`
11. `web/src/assets/css/main.css`
12. `web/src/assets/js/utils/dom.js`
13. `web/src/assets/js/utils/storage.js`
14. `web/src/assets/js/utils/format.js`
15. `web/src/assets/js/utils/validate.js`
16. `web/src/assets/js/modules/auth.js`
17. `web/src/assets/js/modules/navigation.js`
18. `web/src/assets/js/modules/mobile-nav.js`
19. `web/src/assets/js/main.js`
20. `web/src/components/header.html`
21. `web/src/components/sidebar.html`
22. `web/src/components/footer.html`

原因：

- 后台 34 个页面都依赖这层
- 这是整个仓库真正的“平台层”
- 这层不稳，后面所有业务页都会返工

### 第 2 阶段：先做独立页面和后台样板页

优先顺序：

23. `web/src/assets/css/pages/landing.css`
24. `web/src/pages/landing.html`
25. `web/src/assets/js/modules/landing.js`
26. `web/src/assets/css/pages/login.css`
27. `web/src/pages/login.html`
28. `web/src/pages/register.html`
29. `web/src/pages/dashboard.html`

原因：

- `landing`、`login`、`register` 与后台业务域耦合低
- `dashboard.html` 是后台公共壳的集成样板

### 第 3 阶段：按业务域推进，先数据再页面

每个业务域内部顺序应统一为：

1. `src/data/<domain>.js`
2. `src/assets/css/pages/<domain>.css`
3. `src/pages/<domain>/index.html`
4. `src/pages/<domain>/*.html`

推荐业务域顺序：

1. `employee`
2. `sales`
3. `purchase`
4. `warehouse`
5. `production`
6. `equipment`

原因：

- `employee`、`sales` 更适合先沉淀通用列表、筛选、弹窗、统计模式
- `purchase`、`warehouse` 可复用类似结构
- `production`、`equipment` 的状态展示和逻辑复杂度相对更高，适合在共享模式稳定后再做

---

## 6. 哪些文件可以同步开发，哪些会有冲突

### 6.1 可同步开发的文件类型

以下工作适合并行，冲突较低：

- `web/src/pages/landing.html` 与后台域页面并行
- `web/src/pages/login.html` / `register.html` 与业务页并行
- 不同业务域页面目录并行
  - `src/pages/sales/*`
  - `src/pages/purchase/*`
  - `src/pages/warehouse/*`
  - `src/pages/employee/*`
  - `src/pages/production/*`
  - `src/pages/equipment/*`
- 不同业务域的数据文件并行
  - `src/data/sales.js`
  - `src/data/purchase.js`
  - `src/data/warehouse.js`
  - 等

前提是：

- 共享壳层已经稳定
- 每个业务域有明确唯一 owner

### 6.2 高冲突文件

这些文件必须固定 owner，同一双周内原则上只允许 1 人主改：

- `web/src/assets/css/main.css`
- `web/src/assets/js/main.js`
- `web/src/assets/css/base/variables.css`
- `web/src/components/header.html`
- `web/src/components/sidebar.html`
- `web/src/assets/js/modules/auth.js`
- `web/src/assets/js/modules/navigation.js`
- `web/src/assets/js/modules/mobile-nav.js`

### 6.3 中冲突文件

这些文件建议“按业务域独占”：

- `web/src/assets/css/pages/employee.css`
- `web/src/assets/css/pages/sales.css`
- `web/src/assets/css/pages/purchase.css`
- `web/src/assets/css/pages/warehouse.css`
- `web/src/assets/css/pages/production.css`
- `web/src/assets/css/pages/equipment.css`
- `web/src/data/employee.js`
- `web/src/data/sales.js`
- `web/src/data/purchase.js`
- `web/src/data/warehouse.js`
- `web/src/data/production.js`
- `web/src/data/equipment.js`

原因：

- 一个域内多个页面共用同一份数据结构
- 一个域内多个页面往往依赖同一页样式文件

### 6.4 低冲突文件

适合个人独立推进：

- `web/src/pages/<domain>/具体子页.html`
- `web/src/pages/landing.html`
- `web/src/pages/login.html`
- `web/src/pages/register.html`

注意：

- 这些文件“低冲突”不等于“随便写”
- 它们仍然受共享 CSS、共享组件、共享初始化逻辑约束

---

## 7. 4 人团队最合适的分工方式

在“每人每周只开发 2 小时”的约束下，最优分工不是平均分页面数，而是按冲突面与责任边界分。

### 角色 A：共享 UI / 样式负责人

负责：

- `base/*.css`
- `components/*.css`
- `main.css`
- `header.html`
- `sidebar.html`

目标：

- 保证视觉与布局一致
- 控制共享样式入口变更频率

### 角色 B：共享 JS / 交互负责人

负责：

- `utils/*.js`
- `main.js`
- `auth.js`
- `navigation.js`
- `mobile-nav.js`

目标：

- 保证页面初始化流程稳定
- 保证登录守卫、导航高亮、移动端交互一致

### 角色 C：业务域负责人 1

建议负责：

- `employee/*`
- `sales/*`
- `data/employee.js`
- `data/sales.js`

目标：

- 先沉淀列表/筛选/详情/弹窗类模式

### 角色 D：业务域负责人 2

建议负责：

- `purchase/*`
- `warehouse/*`
- `production/*`
- `equipment/*`
- 对应 `data/*.js`

目标：

- 批量推进流程页、统计页、监控页、预警页

说明：

- 在任意一个双周内，一个业务域只给一个人主导
- 域内共享文件不要多人同时修改

---

## 8. 适合本项目的总体策略

### 8.1 策略一：接口优先，而不是页面优先

先锁这些契约：

- `header/sidebar` 的组件加载方式
- `main.js` 的初始化职责
- `auth/navigation/mobile-nav` 的最小 API
- 6 个 `src/data/*.js` 的字段结构

原因：

- 这些才是页面开发的真实地基
- 不先统一，页面会各写各的假设，后期大量返工

### 8.2 策略二：按“页面家族”做，不按“页面编号”做

建议把页面分为以下家族：

- 前台展示页：`landing`
- 登录注册页：`login` / `register`
- 后台首页 / 仪表盘页：`dashboard` + 各域 `index`
- 表格列表页：客户、订单、员工、供应商、库存等
- 表单 / 弹窗页：新增、编辑、详情
- 状态统计页：报表、质量、绩效、分析、预警、监控

原因：

- 同族页面重复度高
- 先做样板页再复制，效率远高于逐页散打

### 8.3 策略三：共享文件集中合并

建议规则：

- `main.css`、`main.js`、`header.html`、`sidebar.html` 每个双周只开放一次集中改动窗口
- 页面开发阶段尽量不再频繁回改共享层

### 8.4 策略四：先做样板页，再批量铺开

建议顺序：

1. 做一个后台样板页（如 `dashboard.html`）
2. 做一个业务域首页样板页（如 `employee/index.html`）
3. 做一个表格列表样板页
4. 做一个统计类样板页
5. 证明模式成立后，再批量复制到其它页面

### 8.5 策略五：限制共享文件 owner

共享层只允许少数固定 owner：

- 样式共享层：1 人主责
- JS 共享层：1 人主责
- 业务域：按域分配 owner

这对低工时团队尤其重要，因为每次冲突处理都会显著吃掉真实开发时间。

---

## 9. 双周提交计划（按每周每人 2 小时）

团队总产能：

- 每周总计：8 小时
- 每双周总计：16 小时

因此每个双周不能追求“大而全”，最合理的节奏是：

- 1 个共享目标
- 1 至 2 个页面家族批次

### 第 1 个双周：基础底座

目标：

- 项目启动与文档规范
- CSS 基础层与组件层
- JS 工具层

建议提交：

1. `chore/docs`: 项目说明、开发规范、文件规范
2. `style/base`: `variables.css` / `reset.css` / `typography.css`
3. `style/components`: 通用组件样式
4. `feat/utils`: DOM / storage / format / validate

### 第 2 个双周：共享壳层

目标：

- 公共头部与侧边栏
- 全局初始化流程
- 鉴权、导航、移动端交互

建议提交：

1. `feat/layout`: `header.html` / `sidebar.html`
2. `feat/navigation`: `navigation.js` / `mobile-nav.js`
3. `feat/auth-core`: `auth.js` / `main.js`

### 第 3 个双周：独立页与后台样板

目标：

- `landing`
- `login` / `register`
- `dashboard`

建议提交：

1. `feat/landing`
2. `feat/auth-pages`
3. `feat/dashboard-shell`

### 第 4 个双周：员工域

目标：

- `data/employee.js`
- `employee.css`
- `employee/index.html`
- `info.html`
- `attendance.html`
- `recruitment.html`
- `performance.html`

### 第 5 个双周：销售域 + 采购域

目标：

- `data/sales.js` + `pages/sales/*` + `sales.css`
- `data/purchase.js` + `pages/purchase/*` + `purchase.css`

### 第 6 个双周：仓储域 + 生产域

目标：

- `data/warehouse.js` + `pages/warehouse/*` + `warehouse.css`
- `data/production.js` + `pages/production/*` + `production.css`

### 第 7 个双周：设备域 + 全局修补

目标：

- `data/equipment.js` + `pages/equipment/*` + `equipment.css`
- 全局问题修补
- 响应式和导航一致性检查

### 第 8 个双周：去重与稳定化

目标：

- 把重复页面模式进一步抽离
- 减少内联脚本重复
- 修复遗留规范问题
- 完成文档补齐

---

## 10. 结论

这个仓库从 0 开发时，最容易失败的地方不是“页面多”，而是：

1. 太早让多人同时修改共享文件
2. 没有先锁 6 个业务域数据结构
3. 没有先做样板页，直接并行散写 30 多个后台页面
4. 继续把核心逻辑堆在页面内联脚本里

因此最优方案不是“平均分页面”，而是：

**先 2 人搭共享底座，2 人稍后进入业务域；共享层稳定后，再按业务域并行批量推进。**

如果只用一句话概括本项目的最佳开发策略，那就是：

**先做平台层，再做样板页，最后按页面家族批量复制；共享文件少人负责，业务域按 owner 并行。**

---

## 11. 可直接执行的团队规则

为方便落地，建议直接采用以下规则：

1. 每个双周开始时先锁定“本周期允许改动的共享文件”
2. `main.css`、`main.js`、`header.html`、`sidebar.html` 同一周期只允许 1 人主改
3. 一个业务域在同一双周只允许 1 个 owner 主导
4. 先完成样板页 review，再批量开发同族页面
5. 所有新页面必须沿用统一引入顺序：`main.css + utils + shared modules + data + page script`
6. 双周目标必须控制在 16 小时总产能以内，宁可少做，也不要把共享层反复打散

---

*最后更新：2026-04-09*
