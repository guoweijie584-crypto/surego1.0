# SureGo 对话变更记录

记录日期：2026-05-18

本文记录本轮对话开始至今已经完成并推送过的项目修改，以及本次继续进行的页面美化与资料整理。内容只基于仓库代码、文档、提交记录和已运行检查。

## 一、已完成提交

### 1. `792821b Fix SureGo activity feed and enrollment rules`

涉及文件：

- `common/api/auth.js`
- `components/surego/SuActivityCard.vue`
- `doc/surego-issue-record.md`
- `pages/activity/detail.vue`
- `pages/activity/register.vue`
- `pages/home/index.vue`
- `uniCloud-aliyun/cloudfunctions/surego-application/index.js`
- `uniCloud-aliyun/cloudfunctions/surego-user/index.js`

完成内容：

- 生成并整理了 `doc/surego-issue-record.md`，记录项目内已发现的问题、风险等级和处理建议。
- 修复活动详情页未拿到真实数据的问题，详情页优先使用真实活动详情和当前用户报名状态。
- 修复立即报名页未拿到真实数据的问题，报名页从活动详情与报名记录中读取真实字段。
- 活动卡片展示审核通过后的活动状态，避免只显示静态文案。
- 活动不处于可报名状态时禁止报名，云函数 `surego-application` 增加状态校验。
- 成行页接入真实定位展示，活动卡片可展示定位到活动地点的距离。
- 成行页支持原生下拉刷新。
- 成行页过滤审核中、已下架、已结束、超过活动当天日期的活动。
- 保留并梳理成行页推荐、最近开始、快约满、离我近的排序逻辑。
- 修复同一个微信在手机和电脑登录后可能生成两个 `surego-users` 用户资料记录的问题，云函数按 `user_id` 合并并清理重复资料。

云空间涉及：

- `uniCloud-aliyun/cloudfunctions/surego-application/index.js`
- `uniCloud-aliyun/cloudfunctions/surego-user/index.js`
- 活动展示依赖 `surego-activities`
- 报名状态依赖 `surego-applications`
- 用户资料去重依赖 `surego-users`

### 2. `8ace706 Update profile fulfillment and edit pages`

涉及文件：

- `common/api/user.js`
- `pages/user/profile.vue`
- `pages/user/edit.vue`
- `scripts/surego-smoke-check.mjs`

完成内容：

- 个人主页移除“总览”“消息”模块。
- 原“资料”模块改为“履约”页。
- 个人主页头像卡片统计由“信用分 / 报名 / 发起活动 / 搭子”改为“关注 / 粉丝”。
- 个人主页头像卡片增加“编辑资料”入口。
- 履约页展示信用分值、履约成功率、活动报名次数、活动发起次数、搭子发布次数、搭子配对成功次数、口碑评价。
- 原资料板块中的标签印象、关注粉丝、社交账号、认证、资料完整度迁移至编辑资料页。
- 编辑资料页重新设计为头像头部、基础资料、标签与印象、账号与认证、保存按钮的页面结构。
- `common/api/user.js` 增加关注、粉丝、履约、口碑字段透传，避免后续云端返回字段被本地用户资料构建逻辑丢弃。
- 更新 `surego-smoke-check.mjs`，移除与“总览/消息”旧需求冲突的断言，并修复 CSS 检查对 CRLF 换行过于敏感的问题。

关注功能核对结论：

- 已有 `surego-follows` 数据表，`target_type` 支持 `partner_post`、`activity`、`user`。
- 当前真实打通的是搭子帖子关注：`common/api/partner.js` 的 `followPartnerPost()` 调用 `surego-partner` 云函数 `followPost`。
- 用户主页 `pages/user/detail.vue` 的“关注 TA”目前只是本地 `followed` 状态切换，没有写入 `surego-follows`。
- `surego-users.schema.json` 当前没有 `following_count`、`follower_count` 字段。
- 因此“用户关注 / 粉丝”未完整打通，当前页面只会读取已有字段，没有字段时显示 `0`。

## 二、本次新增修改

涉及文件：

- `pages/user/profile.vue`
- `pages/user/edit.vue`
- `doc/surego-change-record-2026-05-17.md`

完成内容：

- 梳理并新增本记录文档。
- 优化“我的”页视觉：
  - 头像卡片收紧整体尺寸和间距。
  - 编辑资料入口移入头像信息区右上角，与状态徽标对齐。
  - 社交账号图标改为固定四列小图标，避免挤压和换行不齐。
  - 关注/粉丝统计区统一高度、边框和间距。
  - 顶部“活动 / 搭子 / 履约”改为等宽分段按钮。
  - 二级筛选按钮改为稳定三列网格，避免长短按钮参差。
  - 活动卡片、履约卡片、管理按钮的圆角、间距、字号做统一收敛。
- 优化编辑资料页视觉：
  - 头像头部尺寸收敛，减少头图占比。
  - 基础资料卡片字段高度、间距、圆角统一。
  - 标签胶囊统一高度，避免不齐。
  - 关注/粉丝、账号行、认证行统一为边框分组。
  - 保存按钮改为 SureGo 主蓝色，和程序整体主操作风格一致。

## 三、数据库字段报备

个人主页和履约页要展示真实数据，建议补齐以下字段或聚合能力。

`surego-users` 建议新增或聚合返回：

- `following_count`：关注数。
- `follower_count`：粉丝数。
- `fulfillment_success_rate`：履约成功率。
- `fulfillment_success_count`：履约成功次数。
- `fulfillment_total_count`：应履约总次数。
- `partner_match_success_count`：搭子配对成功次数。
- `reputation_review_count`：口碑评价数。
- `reputation_tags`：口碑标签。

建议新建 `surego-user-reviews`：

- `reviewed_user_id`：被评价用户。
- `reviewer_id`：评价人。
- `source_type`：来源类型，例如 `activity`、`partner_post`。
- `source_id`：来源记录 ID。
- `rating`：评分。
- `tags`：评价标签。
- `content`：评价内容。
- `created_at`：创建时间。

可实时聚合的数据：

- 活动报名次数可从 `surego-applications` 按当前 `user_id` 聚合。
- 活动发起次数可从 `surego-activities` 按 `creator_id` 聚合。
- 如果首页频繁展示，为降低读放大，也可以在 `surego-users` 中冗余 `activity_signup_count`、`activity_hosted_count`。

## 四、验证记录

已运行并通过：

- `node scripts/surego-smoke-check.mjs`

推送记录：

- 当前远端分支：`origin/codex/big-refactor`
- 最近已推送提交：`8ace706 Update profile fulfillment and edit pages`

## 五、仍需后续处理

- 用户关注 / 粉丝功能未打通，需要新增用户关注 API 和云函数动作，或扩展现有 `surego-follows` 查询能力。
- 履约成功率、搭子配对成功次数、口碑评价目前缺少完整数据表和云端聚合。
- 认证页当前更多是前端流程展示，未看到完整认证状态写入字段。
- `doc/surego-issue-record.md` 中仍保留若干 P0/P1 风险，后续应继续按优先级处理。
