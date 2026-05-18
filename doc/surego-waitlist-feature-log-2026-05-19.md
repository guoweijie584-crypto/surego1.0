# SureGo 候补功能打通记录

记录时间：2026-05-19

## 本轮目标

将活动满员后的候补链路从“文案占位”补齐为可提交、可查看、可管理、可通知、可补位通过的完整闭环。

## 已完成改动

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 活动详情页 | 已完成 | 满员且允许候补时展示“候补开放”“加入候补”，不再直接禁用主按钮。 |
| 报名页 | 已完成 | 满员时切换为候补申请，提交 `waitlist` 状态，成功后进入候补成功页。 |
| 报名 API | 已完成 | 新增 `waitlist` 状态归一、候补排序 `waitlistRank`、候补加入通知、补位成功通知。 |
| 活动云函数 | 已完成 | 统一人数、名额、候补开关字段，`listMine` 返回 waitlist 分组。 |
| 报名云函数 | 已完成 | 满员自动写入候补，候补不增加报名人数；补位通过前校验是否有空位。 |
| 发起人管理页 | 已完成 | 候补计数、候补申请卡片、候补成员行、补位通过/移出候补操作已接入。 |
| 凭证页 | 已完成 | 识别候补中状态，候补未补位不生成入场凭证。 |
| 核销页 | 已完成 | 候补用户可见但不能签到，避免候补未补位直接入场。 |
| 我的活动/个人页/日历 | 已完成 | 候补状态进入申请中列表，状态文案展示为“候补中”。 |
| 消息页 | 已完成 | 候补通知可归入候补分类，点击候补消息进入参与状态页。 |

## 当前业务规则

- 活动已满且候补开启时，用户提交后进入 `waitlist`，不占用 `participantCount`。
- 活动未满时，仍按原有规则进入 `pending` 或 `approved`。
- 发起人只能在存在空位时将候补用户补位通过；通过后状态变为 `approved`，并增加活动人数。
- 候补用户在补位通过前不能签到，也不会看到入场二维码。
- 若活动显式关闭候补，满员后仍不可报名。

## 数据字段

- `surego-applications.status`: 新增/使用 `waitlist` 状态。
- `surego-applications.waitlistRank` / `waitlist_rank`: 候补队列顺位。
- `surego-activities.waitlist` / `allowWaitlist` / `allow_waitlist`: 候补开关，默认开启。
- `surego-activities.participantCount` / `participant_count`: 已通过人数。
- `surego-activities.maxParticipants` / `max_participants`: 最大名额。
- `surego-activities.hasParticipantLimit` / `has_participant_limit`: 是否限额。

## 验证记录

- 已执行 `git diff --check`，未发现空白格式错误。
- 已执行变更 JS 与 Vue `<script setup>` 静态语法检查，通过 33 个文件。
- 当前项目 `package.json` 无测试脚本，未执行完整自动化测试。
