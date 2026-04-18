# TypeScript 命名规范

## 目标

- 统一 TypeScript/React 项目命名风格，降低沟通和维护成本。
- 通过“看到名字就知道角色”的方式提升可读性。

## 基础规则

- 语义优先：名称应表达业务意图，避免 `data`、`info`、`temp` 这类泛化命名。
- 避免缩写：除非是通用缩写（如 `id`、`URL`、`API`）。
- 单一语言：代码命名统一使用英文，注释和文档可使用中文。
- 避免无意义后缀：如 `Manager2`、`NewService`。

## 命名风格约定

### 1) React 组件

- **组件名使用大驼峰（PascalCase）**。
- 组件文件名建议与组件名一致（可使用 kebab-case 文件名，见“文件命名”章节）。

示例：

- `HomeMap`
- `AuthPanel`
- `UserProfileCard`

### 2) 类型、接口、枚举

- 类型别名（`type`）使用大驼峰：`UserProfile`。
- 接口（`interface`）使用大驼峰：`LoginRequest`。
- **不使用 `IUser` 这类 `I` 前缀**，除非历史代码已大量使用且暂时无法统一。
- 枚举（`enum`）使用大驼峰：`PlotStatus`。
- 枚举成员使用大驼峰或全大写，团队统一一种即可（推荐大驼峰）。

### 3) 变量与函数

- 普通变量使用小驼峰（camelCase）：`userName`、`plotPrice`。
- 函数名使用动词开头的小驼峰：`fetchUser`、`createBuilding`。
- 布尔值使用可读前缀：`isReady`、`hasPermission`、`canPurchase`。
- 事件处理函数建议 `handleXxx`：`handleSubmit`、`handleLogin`。

### 4) 常量

- 全局常量、配置常量使用全大写下划线（UPPER_SNAKE_CASE）：`MAX_RETRY_COUNT`。
- 局部语义常量可使用小驼峰：`defaultPageSize`。

### 5) 类与实例

- 类名使用大驼峰：`UserRepository`、`BuildingPolicy`。
- 类实例使用小驼峰：`userRepository`、`buildingPolicy`。

### 6) 泛型参数

- 简单泛型可用 `T`、`K`、`V`。
- 业务泛型使用有语义的名称：`TUser`、`TResult`、`TError`。

## 文件与目录命名

### 文件命名

- 普通 TypeScript 文件使用 `kebab-case`：`auth-options.ts`、`plot-service.ts`。
- React 组件文件推荐 `kebab-case`：`home-map.tsx`、`auth-panel.tsx`。
- 如团队更偏好与组件名一致，也可使用 `PascalCase.tsx`，但项目内必须统一。

### 目录命名

- 目录统一使用 `kebab-case`：`client-components`、`domain-services`。
- 功能分层目录建议语义化：`features`、`domain`、`application`、`infrastructure`。

## 禁止项

- 禁止拼音命名：`yonghuList`。
- 禁止无语义命名：`aaa`、`tmpFn`、`obj2`。
- 禁止混用多种同类命名方式（如同一层同时出现 `user_profile.ts` 与 `user-profile.ts`）。

## 示例速查

- 组件：`HomeMap`
- Hook：`useAuth`
- 类型：`UserProfile`
- 接口：`CreatePlotRequest`
- 枚举：`PlotStatus`
- 常量：`DEFAULT_PAGE_SIZE`、`API_TIMEOUT_MS`
- 变量：`currentUser`
- 函数：`getUserById`
- 布尔：`isLoggedIn`
- 文件：`home-map.tsx`、`auth-options.ts`

## 落地建议

- 使用 ESLint + TypeScript ESLint 规则约束命名。
- 在 PR Review 中将命名规范作为必查项。
- 对历史代码采用“增量治理”：新代码严格执行，旧代码按模块逐步重构。
