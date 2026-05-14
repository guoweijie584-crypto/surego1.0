export const partnerPosts = [
  {
    id: 'partner_1001',
    title: '周五下班后找一个长期羽毛球搭子',
    type: 'long_term',
    typeLabel: '长期搭子',
    creatorId: 'seed_user_01',
    creator_id: 'seed_user_01',
    creator: '林同学',
    avatar: '/static/userImg/user.png',
    city: '杭州',
    location: '西湖文化广场',
    schedule: '每周五 19:30',
    connectionMode: '先聊一次水平和时间',
    description: '工作日晚上固定打球，水平新手到中级都可以，重在稳定和守时。',
    expectation: '希望你能连续约 4 周以上，能提前一天确认。',
    fitTags: ['羽毛球', '下班后', '稳定'],
    status: 'open',
    intentCount: 8,
    followCount: 21,
    createdAt: '2026-05-08T12:00:00.000Z'
  },
  {
    id: 'partner_1002',
    title: '明晚一起去看摄影展，找一位同频搭子',
    type: 'time_box',
    typeLabel: '约个时间',
    creatorId: 'seed_user_02',
    creator_id: 'seed_user_02',
    creator: '阿澄',
    avatar: '/static/userImg/user.png',
    city: '杭州',
    location: '浙江美术馆',
    schedule: '明天 18:40',
    connectionMode: '站内发意向后互相确认',
    description: '想慢慢看展，不赶场。看完可以附近喝杯咖啡聊一会儿。',
    expectation: '对摄影或城市影像感兴趣，时间观念好。',
    fitTags: ['看展', '摄影', '咖啡'],
    status: 'open',
    intentCount: 3,
    followCount: 12,
    createdAt: '2026-05-10T09:30:00.000Z'
  },
  {
    id: 'partner_1003',
    title: '找 2 位同学一起做 AI 小程序作品集项目',
    type: 'project',
    typeLabel: '项目组队',
    creatorId: 'seed_user_03',
    creator_id: 'seed_user_03',
    creator: 'Kiki',
    avatar: '/static/userImg/user.png',
    city: '杭州',
    location: '线上 + 西溪校区',
    schedule: '本周启动，持续 3 周',
    connectionMode: '先看方向，再拉小群',
    description: '计划做一个可演示的小程序原型，需要产品、前端或视觉方向的同学。',
    expectation: '每周能投入 2 次讨论，有明确产出意识。',
    fitTags: ['AI', '小程序', '作品集'],
    status: 'open',
    intentCount: 5,
    followCount: 18,
    createdAt: '2026-05-11T16:45:00.000Z'
  }
]

export function findPartnerPostById(id) {
  return partnerPosts.find((item) => String(item.id) === String(id)) || null
}
