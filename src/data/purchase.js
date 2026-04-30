'use strict';

/**
 * 采购管理种子数据。
 * 输入：由普通 script 标签在采购页面加载到全局作用域。
 * 输出：purchaseSystem.store 在 localStorage 为空时复制供应商、订单和分析记录。
 *
 * 原因：项目没有后端接口，种子数据负责保证清空浏览器数据后仍能展示完整业务闭环。
 */
const purchaseData = {
  suppliers: [
    { id: 'S001', name: '京东方科技', contact: '刘总监', phone: '13700001001', category: '屏幕面板', rating: 5, status: '合作中' },
    { id: 'S002', name: '高通中国', contact: '陈经理', phone: '13700001002', category: '手机芯片', rating: 5, status: '合作中' },
    { id: 'S003', name: '比亚迪电子', contact: '黄总', phone: '13700001003', category: '电池/结构件', rating: 4, status: '合作中' },
    { id: 'S004', name: '舜宇光学', contact: '周经理', phone: '13700001004', category: '摄像头模组', rating: 4, status: '合作中' },
    { id: 'S005', name: '立讯精密', contact: '吴总', phone: '13700001005', category: '连接器/代工', rating: 5, status: '合作中' },
  ],

  orders: [
    { id: 'PUR001', supplierId: 'S001', supplierName: '京东方科技', item: 'OLED屏幕模组', quantity: 50000, unit: '片', unitPrice: 380, amount: 19000000, status: '已到货', createDate: '2026-03-01', deliveryDate: '2026-03-15' },
    { id: 'PUR002', supplierId: 'S002', supplierName: '高通中国', item: '骁龙8 Gen3 芯片', quantity: 50000, unit: '颗', unitPrice: 680, amount: 34000000, status: '运输中', createDate: '2026-03-05', deliveryDate: '2026-03-22' },
    { id: 'PUR003', supplierId: 'S003', supplierName: '比亚迪电子', item: '5000mAh锂电池', quantity: 80000, unit: '块', unitPrice: 45, amount: 3600000, status: '待发货', createDate: '2026-03-10', deliveryDate: '2026-03-28' },
    { id: 'PUR004', supplierId: 'S004', supplierName: '舜宇光学', item: '5000万像素摄像头模组', quantity: 50000, unit: '套', unitPrice: 120, amount: 6000000, status: '待审核', createDate: '2026-03-15', deliveryDate: '2026-04-05' },
  ],

  analysis: {
    monthly: [
      { month: '2025-10', amount: 42000000, orders: 12 },
      { month: '2025-11', amount: 58000000, orders: 18 },
      { month: '2025-12', amount: 65000000, orders: 22 },
      { month: '2026-01', amount: 38000000, orders: 10 },
      { month: '2026-02', amount: 52000000, orders: 15 },
      { month: '2026-03', amount: 62600000, orders: 20 },
    ]
  }
};
