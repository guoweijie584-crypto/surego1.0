# SureGo 试运营发布检查清单

## uni-id login bridge

- SureGo login now tries `uni.login` + `uni-id-co.loginByWeixin` first.
- If `uni-id-co` is not uploaded or configured, it falls back to the legacy `user-center` cloud function.
- If both cloud paths fail, it falls back to local mock login so local development and demos still run.
- Before real cloud verification, upload/configure `uni-id-co` and confirm `uni_id_token`, `uni_id_token_expired`, and `uni-id-pages-userInfo` are written after login.

## 发布前静态检查

- 运行 `node scripts\surego-smoke-check.mjs`，确认业务路由、云函数骨架、schema 和禁用 API 检查通过。
- 运行 `node scripts\surego-cloud-integration-check.mjs`，确认 mock/uniCloud 双模式 facade 和云函数 action 覆盖完整。
- 运行 `node scripts\surego-release-check.mjs`，确认 `pages.json` 已移除 DCloud 示例路由，业务页面不直接调用 `uniCloud.callFunction`。
- 确认 `common/config/runtime.js` 默认仍为 `USE_UNICLOUD = false`，未上传云函数时小程序仍可本地跑通。

## HBuilderX 与微信开发者工具

- 在 HBuilderX 中填写真实微信小程序 AppID，当前 `manifest.json` 的 `mp-weixin.appid` 仍留空。
- 运行到微信开发者工具，确认首页首屏为 `pages/home/index`，没有进入 DCloud 示例页。
- 检查微信开发者工具无编译错误；重点关注自定义导航、canvas 海报、保存相册、uni-icons 和 uniCloud 依赖。
- 真机预览至少覆盖 iPhone 小屏、普通安卓宽度和一台大屏设备。

## 核心业务路径

- 浏览路径：首页 -> 活动详情 -> 报名/申请 -> 成功页。
- 创建路径：底部 `+` -> 创建活动 -> 预览 -> 创建成功 -> 管理页。
- 参与者路径：详情 -> 报名 -> 参与者中心 -> 订单详情 -> 试运营订单确认 -> 入场凭证。
- 局长路径：详情 -> 管理页 -> 审核申请 -> 签到核销 -> 票券统计。
- 增长路径：详情分享弹层 -> 微信转发 -> 海报页 -> 生成海报 -> 保存相册失败/成功提示。
- 运营路径：用户中心 -> 运营控制台 -> 举报处理 -> 活动审核/下架/恢复 -> 消息通知。

## uniCloud 上线准备

- 上传并部署 `surego-activity`、`surego-application`、`surego-order`、`surego-message`、`surego-checkin`、`surego-moderation`。
- 上传数据库 schema：活动、报名、订单、消息、签到、举报、审计日志。
- 云端模式联调前再将 `USE_UNICLOUD` 改为 `true`，先用两个测试微信用户验证多角色隔离。
- 验证 A 创建活动、B 报名、A 审核、B 查看凭证、B 确认试运营订单、A 核销、运营处理举报的完整链路。

## 微信发布合规

- 补齐小程序隐私协议，覆盖用户信息、相册保存、位置、扫码、云存储等能力说明。
- 确认真实支付尚未接入，支付页明确为试运营订单确认，不出现真实扣款承诺。
- 海报页不请求真实小程序码接口，二维码区域仍为占位视觉。
- 地图选点、打开地图、扫码 fallback、原生转发应可用；朋友圈、聊天、局长主页仍为试运营弱入口，提示文案应清楚且不阻断核心流程。

## 回滚方式

- 发布前记录当前 Git 提交号和 HBuilderX 版本号。
- 如果微信开发者工具编译失败，先回退 `manifest.json` AppID/发布配置，再检查 `pages.json` 业务路由。
- 如果云端联调失败，将 `USE_UNICLOUD` 改回 `false`，保留 mock 模式演示能力。
- 如果页面样式出现严重错位，优先回退最近的视觉改动提交，不回退数据 facade 和 schema 提交。
