# SureGo 问题记录

记录时间：2026-05-17

本文基于当前仓库内文档、页面、`common/api`、云函数、数据库 schema 和本地检查脚本整理。结论只引用已存在代码与文档，不包含未验证推断。

## 检查结论概览

- 云函数接入静态检查通过：`node scripts/surego-cloud-integration-check.mjs`
- 部署范围检查通过：`node scripts/surego-deployment-scope-check.mjs`
- 公开主页专项检查通过：`node scripts/surego-public-profile-check.mjs`
- `smoke/release` 检查失败点集中在首页与搭子页 CSS 间距精确断言，不是核心业务链路缺失。
- 报名资格专项脚本失败：`scripts/surego-registration-eligibility-check.mjs` 在 sandbox 中缺少 `shouldUseReferenceMockPreview`，脚本自身需先修正。

## P0 / 高优先级

### 1. 活动详情成员统计返回值不匹配

- 状态：已修复，2026-05-17。详情页已改为先写入真实活动详情，再异步同步当前用户报名状态，不再依赖 `memberGroups.members/pending`。
- 位置：`pages/activity/detail.vue`
- 证据：页面将 `listActivityMembers(detail.id)` 返回值当作 `memberGroups.members` 与 `memberGroups.pending` 使用。
- 位置：`common/api/member.js`
- 证据：`listActivityMembers(activityId)` 实际返回数组 `[creator, ...members]`。
- 影响：活动详情页加载时可能因读取 `memberGroups.members.length` 报错，阻断详情页渲染。
- 建议：要么详情页改用数组长度，要么改为调用 `getActivityMemberSummary()`；如果需要待审核数，应额外取 `listApplications()` 过滤 `pending`。

### 2. 举报字段前后端不一致

- 位置：`pages/activity/detail.vue`
- 证据：详情页提交举报时传 `targetType: 'activity'`、`targetId: activity.value.id`。
- 位置：`uniCloud-aliyun/cloudfunctions/surego-moderation/index.js`
- 证据：云函数 `createReport` 写入时读取 `payload.activityId`、`payload.activityTitle`。
- 影响：举报记录可能缺失 `activity_id` 和 `activity_title`，运营后台无法准确定位被举报活动。
- 建议：详情页改传 `activityId`、`activityTitle`，必要时保留 `targetType/targetId` 作为审计字段。

### 3. 消息云函数权限边界偏松

- 位置：`uniCloud-aliyun/cloudfunctions/surego-message/index.js`
- 证据：`create` 动作使用 `payload.userId || payload.user_id` 写入收件人，只要求调用者已登录。
- 影响：任意登录用户理论上可通过客户端调用给任意用户创建消息。
- 建议：限制 `surego-message:create` 的调用来源或权限；业务通知优先由对应业务云函数内部写入，不直接暴露任意收件人写入能力。

### 4. 搭子群聊状态与 schema 枚举不一致

- 位置：`common/api/partner.js`、`uniCloud-aliyun/cloudfunctions/surego-partner/index.js`
- 证据：群聊会话写入 `status: 'group'`。
- 位置：`uniCloud-aliyun/database/surego-conversations.schema.json`
- 证据：`status` enum 只有 `open`、`closed`。
- 影响：如果 schema 校验生效，群聊会话写入可能失败。
- 建议：将群聊类型从 `status` 拆到 `conversation_type`，或把 schema enum 扩展为业务实际需要的状态。

## P1 / 中优先级

### 5. 登录桥接顺序与发布文档不一致

- 位置：`docs/surego-release-checklist.md`
- 证据：文档写明先尝试 `uni.login + uni-id-co.loginByWeixin`，失败后回退 `user-center`。
- 位置：`common/api/auth.js`
- 证据：实际 `loginWithWeixin()` 先调用 `loginWithUserCenter()`，再调用 `loginWithUniIdCo()`。
- 影响：联调排障会按错误顺序判断问题，也可能与试运行验收标准不一致。
- 建议：统一代码或文档；如果目标是优先 `uni-id-co`，应调整 `auth.js` 调用顺序。

### 6. 城市默认值混乱

- 位置：`common/utils/city.js`
- 证据：默认城市为天津，默认 code 为 `120100`。
- 位置：`pages/discover/index.vue`、`pages/discover/city.vue`
- 证据：页面默认 `selectedCityCode` 为 `330100`。
- 位置：`uniCloud-aliyun/cloudfunctions/surego-partner/index.js`
- 证据：搭子帖云端默认 `city: '杭州'`。
- 影响：天津校园定位与杭州 code 混用，可能导致发现页筛选、城市统计、搭子发布数据不一致。
- 建议：统一默认城市策略；如果当前试运行目标是天津大学，应统一为天津/`120100` 或明确校园 code 与行政 code 的映射。

### 7. 候补规则不完整

- 位置：`pages/activity/detail.vue`、`pages/manage/dashboard.vue`
- 证据：页面存在“加入候补”“候补同学”等 UI 文案。
- 位置：`uniCloud-aliyun/database/surego-applications.schema.json`
- 证据：申请状态主要为 `pending/approved/rejected`。
- 影响：候补看起来是产品能力，但缺少完整状态、排序、转正、通知、容量释放后的业务闭环。
- 建议：确认是否保留候补能力；保留则补 schema、云函数、前端状态与通知链路；不保留则移除候补入口文案。

### 8. 报名资格专项脚本自身失效

- 位置：`scripts/surego-registration-eligibility-check.mjs`
- 证据：运行时报 `ReferenceError: shouldUseReferenceMockPreview is not defined`。
- 影响：该脚本无法有效验证报名资格规则，容易让回归检查产生盲区。
- 建议：在 sandbox 中补充 `shouldUseReferenceMockPreview`，或调整脚本转换方式以保留/注入运行依赖。

## P2 / 低优先级与优化项

### 9. 发布检查存在 CSS 字符串精确断言失败

- 位置：`pages/home/index.vue`、`pages/partners/index.vue`
- 证据：`surego-smoke-check.mjs` 与 `surego-release-check.mjs` 均失败在 `.scene-row`、`.sort-tabs`、`.section-title--inline`、`.scene-scroll-row` 的间距 token。
- 影响：当前不指向业务缺陷，但会阻塞发布检查通过。
- 建议：确认目标视觉间距后，调整 CSS 或检查脚本，避免用过脆的整块字符串断言。

### 10. DCloud 示例资产仍保留在仓库

- 位置：`uniCloud-aliyun/cloudfunctions`、`uniCloud-aliyun/database`、部分未注册示例页面。
- 证据：部署范围检查输出大量 `Do not upload demo ...` warning。
- 影响：仓库维护噪音大；如果人工误操作全量上传，会污染云空间。
- 建议：继续严格按 `docs/surego-cloud-trial-deployment.md` 上传；中长期可将示例资产移出主发布目录或归档。

### 11. 模板元信息未完全清理

- 位置：`README.md`、`package.json`、`changelog.md`
- 证据：仍保留 `hello uniCloud` / DCloud 模板描述。
- 影响：对外协作、交付和部署说明容易误导。
- 建议：补充 SureGo 项目 README、运行方式、部署边界、账号角色、试运行限制。

### 12. 支付、聊天、海报二维码仍是试运行/占位能力

- 位置：`pages/payment/index.vue`、`pages/order/detail.vue`
- 证据：明确使用“试运行订单确认，不发生真实扣款”文案。
- 位置：`pages/partner/conversation.vue`
- 证据：会话页目前是会话信息展示，不是完整实时聊天。
- 位置：`pages/share/poster.vue`
- 证据：海报二维码区域为 SureGo/路径提示，不是真实小程序码生成链路。
- 影响：这些能力不能按生产级支付、聊天、真实二维码传播来验收。
- 建议：在产品方案和验收清单里明确试运行边界；若进入正式版，应单独设计支付、IM、真实小程序码生成。

## 后续处理建议

1. 先修 P0：活动详情崩溃、举报字段、消息创建权限、群聊 schema。
2. 再修 P1：登录顺序、城市默认值、候补规则、专项脚本。
3. 最后处理发布检查断言、模板文档、示例资产归档与试运行占位能力产品化。
