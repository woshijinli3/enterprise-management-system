'use strict';

/**
 * 员工管理种子数据。
 * 输入：由普通 script 标签在员工页面加载到全局作用域。
 * 输出：employeeSystem.store 在 localStorage 为空时复制这些员工、考勤、招聘和绩效记录。
 *
 * 原因：项目没有后端接口，种子数据负责保证清空浏览器数据后仍能展示完整业务闭环。
 */
const employeeData = {
  employees: [
    { id: 'E001', name: '张伟', gender: '男', dept: '技术部', position: '硬件工程师', phone: '13800001001', email: 'zhangwei@xiaomai.com', entryDate: '2023-03-15', salary: 20000, status: '在职' },
    { id: 'E002', name: '李娜', gender: '女', dept: '销售部', position: '销售经理', phone: '13800001002', email: 'lina@xiaomai.com', entryDate: '2022-07-01', salary: 22000, status: '在职' },
    { id: 'E003', name: '王磊', gender: '男', dept: '生产部', position: '生产主管', phone: '13800001003', email: 'wanglei@xiaomai.com', entryDate: '2021-11-20', salary: 18000, status: '在职' },
    { id: 'E004', name: '赵敏', gender: '女', dept: '人事部', position: 'HR专员', phone: '13800001004', email: 'zhaomin@xiaomai.com', entryDate: '2023-06-10', salary: 12000, status: '在职' },
    { id: 'E005', name: '陈浩', gender: '男', dept: '技术部', position: '软件工程师', phone: '13800001005', email: 'chenhao@xiaomai.com', entryDate: '2022-09-05', salary: 22000, status: '在职' },
    { id: 'E006', name: '刘洋', gender: '男', dept: '采购部', position: '采购专员', phone: '13800001006', email: 'liuyang@xiaomai.com', entryDate: '2023-01-18', salary: 13000, status: '在职' },
    { id: 'E007', name: '孙丽', gender: '女', dept: '财务部', position: '财务主管', phone: '13800001007', email: 'sunli@xiaomai.com', entryDate: '2020-05-12', salary: 19000, status: '在职' },
    { id: 'E008', name: '周强', gender: '男', dept: '生产部', position: '品质工程师', phone: '13800001008', email: 'zhouqiang@xiaomai.com', entryDate: '2023-08-22', salary: 16000, status: '在职' },
    { id: 'E009', name: '吴静', gender: '女', dept: '销售部', position: '销售专员', phone: '13800001009', email: 'wujing@xiaomai.com', entryDate: '2024-02-01', salary: 10000, status: '在职' },
    { id: 'E010', name: '郑凯', gender: '男', dept: '技术部', position: '产品经理', phone: '13800001010', email: 'zhengkai@xiaomai.com', entryDate: '2021-04-08', salary: 25000, status: '在职' },
  ],

  attendance: [
    { id: 'A001', empId: 'E001', empName: '张伟', month: '2026-03', workDays: 22, actualDays: 21, lateTimes: 1, leaveDays: 0, overtimeHours: 12 },
    { id: 'A002', empId: 'E002', empName: '李娜', month: '2026-03', workDays: 22, actualDays: 22, lateTimes: 0, leaveDays: 0, overtimeHours: 15 },
    { id: 'A003', empId: 'E003', empName: '王磊', month: '2026-03', workDays: 22, actualDays: 22, lateTimes: 0, leaveDays: 0, overtimeHours: 20 },
    { id: 'A004', empId: 'E005', empName: '陈浩', month: '2026-03', workDays: 22, actualDays: 22, lateTimes: 0, leaveDays: 0, overtimeHours: 18 },
    { id: 'A005', empId: 'E010', empName: '郑凯', month: '2026-03', workDays: 22, actualDays: 21, lateTimes: 2, leaveDays: 0, overtimeHours: 8 },
  ],

  recruitment: [
    { id: 'R001', position: '硬件工程师', dept: '技术部', headcount: 3, status: '招聘中', publishDate: '2026-03-01', deadline: '2026-04-01', applicants: 22 },
    { id: 'R002', position: '销售专员', dept: '销售部', headcount: 5, status: '招聘中', publishDate: '2026-03-05', deadline: '2026-04-05', applicants: 35 },
    { id: 'R003', position: '工业设计师', dept: '技术部', headcount: 2, status: '已完成', publishDate: '2026-02-01', deadline: '2026-03-01', applicants: 18 },
    { id: 'R004', position: 'SMT工艺工程师', dept: '生产部', headcount: 2, status: '待发布', publishDate: '2026-03-20', deadline: '2026-04-20', applicants: 0 },
  ],

  performance: [
    { id: 'P001', empId: 'E001', empName: '张伟', dept: '技术部', period: '2026-Q1', score: 92, grade: 'A', comment: '主导完成手机主板改版，性能提升15%' },
    { id: 'P002', empId: 'E002', empName: '李娜', dept: '销售部', period: '2026-Q1', score: 96, grade: 'A+', comment: '超额完成季度销售目标，拓展3家新渠道' },
    { id: 'P003', empId: 'E003', empName: '王磊', dept: '生产部', period: '2026-Q1', score: 88, grade: 'B+', comment: '产线良率提升至98.5%' },
    { id: 'P004', empId: 'E005', empName: '陈浩', dept: '技术部', period: '2026-Q1', score: 94, grade: 'A', comment: '完成手表固件重大版本迭代' },
    { id: 'P005', empId: 'E010', empName: '郑凯', dept: '技术部', period: '2026-Q1', score: 90, grade: 'A', comment: '扫地机器人新品定义清晰，市场反响好' },
  ]
};
