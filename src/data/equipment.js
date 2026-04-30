'use strict';

/**
 * 设备管理种子数据。
 * 输入：由普通 script 标签在设备页面加载到全局作用域。
 * 输出：equipmentSystem.store 在 localStorage 为空时复制设备、维护和故障记录。
 *
 * 原因：项目没有后端接口，种子数据负责保证清空浏览器数据后仍能展示完整业务闭环。
 */
const equipmentData = {
  equipment: [
    { id: 'EQ001', name: '雅马哈 SMT 贴片机', model: 'YSM20R', location: 'SMT产线A', status: '运行中', purchaseDate: '2022-05-10', lastMaintain: '2026-02-15', nextMaintain: '2026-05-15' },
    { id: 'EQ002', name: '回流焊炉', model: 'Heller-1913MK5', location: 'SMT产线A', status: '运行中', purchaseDate: '2021-08-20', lastMaintain: '2026-01-10', nextMaintain: '2026-04-10' },
    { id: 'EQ003', name: '自动光学检测仪', model: 'Koh Young Zenith', location: '质检区', status: '维修中', purchaseDate: '2023-03-15', lastMaintain: '2026-03-01', nextMaintain: '2026-06-01' },
    { id: 'EQ004', name: 'CNC 数控机床', model: 'DMG Mori NLX2500', location: 'CNC车间', status: '停机', purchaseDate: '2020-11-05', lastMaintain: '2025-11-05', nextMaintain: '2026-02-05' },
    { id: 'EQ005', name: '六轴工业机器人', model: 'FANUC M-20iD', location: '组装产线B', status: '运行中', purchaseDate: '2024-01-20', lastMaintain: '2026-03-10', nextMaintain: '2026-06-10' },
  ],

  maintenance: [
    { id: 'MT001', equipId: 'EQ001', equipName: '雅马哈 SMT 贴片机', type: '定期保养', planDate: '2026-05-15', status: '待执行', technician: '张伟', cost: 3000 },
    { id: 'MT002', equipId: 'EQ002', equipName: '回流焊炉', type: '温度校准', planDate: '2026-04-10', status: '待执行', technician: '王磊', cost: 2500 },
    { id: 'MT003', equipId: 'EQ003', equipName: '自动光学检测仪', type: '镜头更换', planDate: '2026-03-18', status: '进行中', technician: '张伟', cost: 12000 },
    { id: 'MT004', equipId: 'EQ004', equipName: 'CNC 数控机床', type: '主轴大修', planDate: '2026-03-20', status: '待执行', technician: '外包团队', cost: 35000 },
  ],

  faults: [
    { id: 'FT001', equipId: 'EQ003', equipName: '自动光学检测仪', faultDate: '2026-03-01', description: '检测镜头偏焦，误判率升高', severity: '严重', status: '维修中', handler: '张伟' },
    { id: 'FT002', equipId: 'EQ004', equipName: 'CNC 数控机床', faultDate: '2026-02-20', description: '主轴异响，轴承磨损严重', severity: '一般', status: '待处理', handler: '外包团队' },
    { id: 'FT003', equipId: 'EQ001', equipName: '雅马哈 SMT 贴片机', faultDate: '2026-01-15', description: '吸嘴堵塞导致抛料率上升', severity: '一般', status: '已解决', handler: '张伟' },
  ]
};
