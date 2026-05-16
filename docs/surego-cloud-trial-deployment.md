# SureGo 云端试运行部署清单

本清单用于 HBuilderX/微信开发者工具联调阶段。目标是只上传 SureGo 业务资产，避免把 DCloud 示例函数、示例页面或示例 collection 一起部署到目标阿里云 uniCloud 空间。

## 只上传 SureGo 业务云函数

手动上传/部署以下云函数：

- `surego-activity`
- `surego-application`
- `surego-order`
- `surego-message`
- `surego-checkin`
- `surego-moderation`
- `surego-partner`
- `surego-user`
- `user-center`

不要全量上传 `uniCloud-aliyun/cloudfunctions`。仓库里仍保留 DCloud 示例函数，例如 `add`、`get`、`remove`、`update`、`redis-test`、`cloud-object-demo`、`secure-network`、`uni-admin` 等，它们不是 SureGo 试运行链路的一部分。

## 只上传 SureGo 业务数据库资产

手动上传/初始化以下业务 collection 的 schema/index/init data：

- `surego-activities.schema.json`
- `surego-activities.index.json`
- `surego-activities.init_data.json`
- `surego-applications.schema.json`
- `surego-applications.index.json`
- `surego-orders.schema.json`
- `surego-orders.index.json`
- `surego-checkins.schema.json`
- `surego-checkins.index.json`
- `surego-partner-posts.schema.json`
- `surego-partner-posts.index.json`
- `surego-partner-posts.init_data.json`
- `surego-partner-intents.schema.json`
- `surego-partner-intents.index.json`
- `surego-conversations.schema.json`
- `surego-conversations.index.json`
- `surego-messages.schema.json`
- `surego-messages.index.json`
- `surego-follows.schema.json`
- `surego-follows.index.json`
- `surego-reports.schema.json`
- `surego-reports.index.json`
- `surego-audit-logs.schema.json`
- `surego-audit-logs.index.json`
- `surego-users.schema.json`
- `surego-users.index.json`
- `surego-users.init_data.json`

登录与角色链路还需要同一个云空间中的 uni-id 配置和角色数据：

- `uni-id-roles.init_data.json`
- `uni-id-roles.index.json`
- `uni-id-permissions.init_data.json`
- `uni-id-permissions.index.json`
- `uni-id-users.init_data.json`

不要全量上传 `uniCloud-aliyun/database`。`book`、`order`、`permission-test-*`、`validate-demo`、`user-info`、`unicloud-test`、`opendb-*` 等示例表不是试运行数据。

## 联调前检查

1. 运行静态检查：
   - `node scripts\surego-smoke-check.mjs`
   - `node scripts\surego-cloud-integration-check.mjs`
   - `node scripts\surego-release-check.mjs`
   - `node scripts\surego-deployment-scope-check.mjs`
2. 在 HBuilderX 确认 `.hbuilderx/launch.json` 指向目标阿里云 uniCloud 空间。
3. 确认 `common/config/runtime.js` 为 `APP_MODE = 'trial'`、`USE_UNICLOUD = true`、`REFERENCE_MOCK_PREVIEW = false`。
4. 如果要本地严格验证云端登录，将 `TRIAL_STRICT_CLOUD_AUTH` 临时设为 `true`，此时本地 develop 环境也不会启用 mock fallback。
5. 用两个真实微信用户跑通：登录资料、活动创建审核、报名审核、试运行订单确认、签到、黑客松组队意向、接受后会话、举报处理。
