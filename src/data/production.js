'use strict';

/**
 * 生产管理种子数据。
 * 输入：由普通 script 标签在生产页面加载到全局作用域。
 * 输出：productionSystem.store 在 localStorage 为空时复制计划、任务、物料、订单和质检记录。
 *
 * 原因：项目没有后端接口，种子数据负责保证清空浏览器数据后仍能展示完整业务闭环。
 */
const productionData = {
  plans: [
    { id: 'PP001', name: '2026年Q1手机量产计划', startDate: '2026-01-01', endDate: '2026-03-31', status: '进行中', products: ['小麦手机 Pro', '小麦手机 SE'], progress: 82 },
    { id: 'PP002', name: '2026年Q2新品备货计划', startDate: '2026-04-01', endDate: '2026-06-30', status: '待启动', products: ['小麦平板 Air 2', '小麦手表 S3'], progress: 0 },
    { id: 'PP003', name: '618大促备货计划', startDate: '2026-05-01', endDate: '2026-06-10', status: '待启动', products: ['小麦手机 Pro', '小麦笔记本 Ultra', '小麦扫地机器人 X1'], progress: 15 },
  ],

  tasks: [
    { id: 'PT001', planId: 'PP001', productName: '小麦手机 Pro', quantity: 50000, progress: 90, assignee: '王磊', deadline: '2026-03-20' },
    { id: 'PT002', planId: 'PP001', productName: '小麦手机 SE', quantity: 30000, progress: 70, assignee: '王磊', deadline: '2026-03-25' },
    { id: 'PT003', planId: 'PP001', productName: '小麦平板 Air', quantity: 20000, progress: 100, assignee: '陈浩', deadline: '2026-03-10' },
    { id: 'PT004', planId: 'PP003', productName: '小麦笔记本 Ultra', quantity: 10000, progress: 0, assignee: '周强', deadline: '2026-05-20' },
  ],

  materials: [
    { id: 'PM001', name: 'OLED屏幕模组', spec: '6.67寸 2K AMOLED', unit: '片', required: 50000, stock: 35000, shortage: 15000 },
    { id: 'PM002', name: '骁龙8 Gen3 芯片', spec: 'SM8650', unit: '颗', required: 50000, stock: 52000, shortage: 0 },
    { id: 'PM003', name: '锂电池', spec: '5000mAh 6C快充', unit: '块', required: 80000, stock: 65000, shortage: 15000 },
    { id: 'PM004', name: '手机中框', spec: '铝合金CNC一体成型', unit: '个', required: 50000, stock: 48000, shortage: 2000 },
    { id: 'PM005', name: '摄像头模组', spec: '5000万像素 OIS', unit: '套', required: 50000, stock: 30000, shortage: 20000 },
  ],

  orders: [
    { id: 'PO001', customer: '京东自营', product: '小麦手机 Pro', quantity: 2000, status: '生产中', createDate: '2026-03-01', deliveryDate: '2026-03-25' },
    { id: 'PO002', customer: '苏宁易购', product: '小麦笔记本 Ultra', quantity: 800, status: '待生产', createDate: '2026-03-05', deliveryDate: '2026-04-10' },
    { id: 'PO003', customer: '天猫小米之家旗舰店', product: '小麦平板 Air', quantity: 1500, status: '已完成', createDate: '2026-02-20', deliveryDate: '2026-03-10' },
    { id: 'PO004', customer: '拼多多百亿补贴', product: '小麦手表 S2', quantity: 3000, status: '待审核', createDate: '2026-03-15', deliveryDate: '2026-04-01' },
  ],

  qualityRecords: [
    { id: 'PQ001', orderId: 'PO001', inspector: '周强', date: '2026-03-18', result: '合格', defects: 3 },
    { id: 'PQ002', orderId: 'PO003', inspector: '周强', date: '2026-03-10', result: '合格', defects: 0 },
    { id: 'PQ003', orderId: 'PO002', inspector: '周强', date: '2026-03-12', result: '不合格', defects: 12 },
  ]
};
