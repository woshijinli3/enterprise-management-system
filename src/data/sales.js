'use strict';

/**
 * 销售管理种子数据。
 * 输入：由普通 script 标签在销售页面加载到全局作用域。
 * 输出：salesSystem.store 在 localStorage 为空时复制客户、订单、报表、定价和团队记录。
 *
 * 原因：项目没有后端接口，种子数据负责保证清空浏览器数据后仍能展示完整业务闭环。
 */
const salesData = {
  customers: [
    { id: 'C001', name: '京东自营', contact: '张采销', phone: '13900001001', email: 'zhang@jd.com', city: '北京', level: 'VIP', totalAmount: 5800000 },
    { id: 'C002', name: '天猫小米之家旗舰店', contact: '李店长', phone: '13900001002', email: 'li@tmall.com', city: '杭州', level: 'VIP', totalAmount: 4200000 },
    { id: 'C003', name: '苏宁易购', contact: '王采购', phone: '13900001003', email: 'wang@suning.com', city: '南京', level: '重要', totalAmount: 3100000 },
    { id: 'C004', name: '拼多多百亿补贴', contact: '赵经理', phone: '13900001004', email: 'zhao@pdd.com', city: '上海', level: '重要', totalAmount: 2600000 },
    { id: 'C005', name: '抖音电商', contact: '陈运营', phone: '13900001005', email: 'chen@douyin.com', city: '北京', level: '普通', totalAmount: 1500000 },
  ],

  orders: [
    { id: 'SO001', customerId: 'C001', customerName: '京东自营', product: '小麦手机 Pro', quantity: 2000, unitPrice: 2999, amount: 5998000, status: '已完成', createDate: '2026-03-01', deliveryDate: '2026-03-15' },
    { id: 'SO002', customerId: 'C002', customerName: '天猫小米之家旗舰店', product: '小麦平板 Air', quantity: 1500, unitPrice: 1999, amount: 2998500, status: '配送中', createDate: '2026-03-05', deliveryDate: '2026-03-20' },
    { id: 'SO003', customerId: 'C003', customerName: '苏宁易购', product: '小麦笔记本 Ultra', quantity: 800, unitPrice: 5999, amount: 4799200, status: '待发货', createDate: '2026-03-10', deliveryDate: '2026-03-25' },
    { id: 'SO004', customerId: 'C004', customerName: '拼多多百亿补贴', product: '小麦手表 S2', quantity: 3000, unitPrice: 899, amount: 2697000, status: '待审核', createDate: '2026-03-15', deliveryDate: '2026-04-01' },
    { id: 'SO005', customerId: 'C005', customerName: '抖音电商', product: '小麦扫地机器人 X1', quantity: 500, unitPrice: 2499, amount: 1249500, status: '已完成', createDate: '2026-02-20', deliveryDate: '2026-03-10' },
  ],

  report: {
    monthly: [
      { month: '2025-10', revenue: 8500000, orders: 32, newCustomers: 2 },
      { month: '2025-11', revenue: 12800000, orders: 48, newCustomers: 5 },
      { month: '2025-12', revenue: 15200000, orders: 56, newCustomers: 3 },
      { month: '2026-01', revenue: 9600000, orders: 35, newCustomers: 2 },
      { month: '2026-02', revenue: 11300000, orders: 42, newCustomers: 4 },
      { month: '2026-03', revenue: 17742200, orders: 65, newCustomers: 6 },
    ]
  },

  pricing: [
    { id: 'PR001', product: '小麦手机 Pro', standardPrice: 3299, currentPrice: 2999, discount: 0.91, validFrom: '2026-01-01', validTo: '2026-06-30', status: '生效中' },
    { id: 'PR002', product: '小麦平板 Air', standardPrice: 2299, currentPrice: 1999, discount: 0.87, validFrom: '2026-01-01', validTo: '2026-06-30', status: '生效中' },
    { id: 'PR003', product: '小麦笔记本 Ultra', standardPrice: 6499, currentPrice: 5999, discount: 0.92, validFrom: '2026-02-01', validTo: '2026-08-31', status: '生效中' },
    { id: 'PR004', product: '小麦台式电脑 G1', standardPrice: 4999, currentPrice: 4599, discount: 0.92, validFrom: '2026-01-01', validTo: '2026-06-30', status: '生效中' },
    { id: 'PR005', product: '小麦手表 S2', standardPrice: 999, currentPrice: 899, discount: 0.90, validFrom: '2026-03-01', validTo: '2026-09-30', status: '生效中' },
    { id: 'PR006', product: '小麦扫地机器人 X1', standardPrice: 2799, currentPrice: 2499, discount: 0.89, validFrom: '2026-01-15', validTo: '2026-07-15', status: '生效中' },
  ],

  team: [
    { id: 'T001', name: '李娜', role: '销售经理', region: '华东', target: 30000000, achieved: 25800000, rate: 0.86 },
    { id: 'T002', name: '吴静', role: '销售专员', region: '华南', target: 15000000, achieved: 11200000, rate: 0.75 },
    { id: 'T003', name: '刘洋', role: '供应链专员', region: '全国', target: 20000000, achieved: 18500000, rate: 0.93 },
  ]
};
