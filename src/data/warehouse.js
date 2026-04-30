'use strict';

/**
 * 仓储管理种子数据。
 * 输入：由普通 script 标签在仓储页面加载到全局作用域。
 * 输出：warehouseSystem.store 在 localStorage 为空时复制库存、入库、出库和货位记录。
 *
 * 原因：项目没有后端接口，种子数据负责保证清空浏览器数据后仍能展示完整业务闭环。
 */
const warehouseData = {
  inventory: [
    { id: 'W001', name: '小麦手机 Pro', category: '成品', spec: '12+256GB 曜石黑', unit: '台', stock: 12000, minStock: 5000, location: 'A-01-01', lastUpdate: '2026-03-18' },
    { id: 'W002', name: '小麦平板 Air', category: '成品', spec: '8+128GB 星河银', unit: '台', stock: 3200, minStock: 3000, location: 'A-01-02', lastUpdate: '2026-03-17' },
    { id: 'W003', name: 'OLED屏幕模组', category: '零部件', spec: '6.67寸 2K AMOLED', unit: '片', stock: 35000, minStock: 10000, location: 'B-02-01', lastUpdate: '2026-03-15' },
    { id: 'W004', name: '骁龙8 Gen3 芯片', category: '零部件', spec: 'SM8650', unit: '颗', stock: 52000, minStock: 15000, location: 'B-02-02', lastUpdate: '2026-03-10' },
    { id: 'W005', name: '5000mAh锂电池', category: '零部件', spec: '6C快充', unit: '块', stock: 65000, minStock: 20000, location: 'B-03-01', lastUpdate: '2026-03-05' },
    { id: 'W006', name: '小麦笔记本 Ultra', category: '成品', spec: 'i7+16+512GB', unit: '台', stock: 4500, minStock: 2000, location: 'A-02-01', lastUpdate: '2026-03-12' },
  ],

  inbound: [
    { id: 'IN001', item: 'OLED屏幕模组', quantity: 20000, unit: '片', supplier: '京东方科技', date: '2026-03-15', operator: '仓管员小张' },
    { id: 'IN002', item: '骁龙8 Gen3 芯片', quantity: 30000, unit: '颗', supplier: '高通中国', date: '2026-03-10', operator: '仓管员小李' },
    { id: 'IN003', item: '小麦手机 Pro', quantity: 5000, unit: '台', supplier: '生产部', date: '2026-03-18', operator: '仓管员小张' },
  ],

  outbound: [
    { id: 'OUT001', item: '小麦手机 Pro', quantity: 2000, unit: '台', customer: '京东自营', date: '2026-03-20', operator: '仓管员小李' },
    { id: 'OUT002', item: '小麦平板 Air', quantity: 1500, unit: '台', customer: '天猫小米之家旗舰店', date: '2026-03-10', operator: '仓管员小张' },
    { id: 'OUT003', item: '小麦笔记本 Ultra', quantity: 800, unit: '台', customer: '苏宁易购', date: '2026-03-16', operator: '仓管员小李' },
  ],

  locations: [
    { id: 'LOC001', code: 'A-01', zone: 'A区', type: '成品区(手机/平板)', capacity: 50000, used: 15200, status: '正常' },
    { id: 'LOC002', code: 'A-02', zone: 'A区', type: '成品区(电脑/穿戴)', capacity: 20000, used: 4500, status: '正常' },
    { id: 'LOC003', code: 'B-02', zone: 'B区', type: '零部件区(芯片/屏幕)', capacity: 100000, used: 87000, status: '正常' },
    { id: 'LOC004', code: 'B-03', zone: 'B区', type: '零部件区(电池/结构件)', capacity: 100000, used: 65000, status: '正常' },
  ]
};
