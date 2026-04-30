'use strict';

window.employeeSystem = window.employeeSystem || {};

employeeSystem.actions = (function(store) {
  /**
   * 新增员工档案。
   * @param {Object} payload 员工表单数据。
   * @returns {Object} 写入本地状态的新员工记录。
   */
  function createEmployee(payload) {
    return store.mutate((state) => {
      const employee = {
        id: EnterpriseState.nextId('E', state.employees),
        name: payload.name,
        gender: payload.gender || '男',
        dept: payload.dept || '未分配',
        position: payload.position || '待定',
        phone: payload.phone || '',
        email: payload.email || '',
        entryDate: payload.entryDate || '',
        salary: Number(payload.salary) || 0,
        status: payload.status || '试用期'
      };

      state.employees.push(employee);
      return employee;
    });
  }

  /**
   * 更新员工档案基础字段。
   * @param {string} id 员工编号。
   * @param {Object} payload 员工表单数据。
   * @returns {Object|null} 更新后的员工记录；未找到员工时返回 null。
   */
  function updateEmployee(id, payload) {
    return store.mutate((state) => {
      const employee = state.employees.find((item) => item.id === id);
      if (!employee) return null;

      Object.assign(employee, {
        name: payload.name,
        gender: payload.gender,
        dept: payload.dept,
        position: payload.position,
        phone: payload.phone,
        email: payload.email,
        entryDate: payload.entryDate,
        salary: Number(payload.salary) || 0
      });
      return employee;
    });
  }

  /**
   * 删除员工档案。
   * @param {string} id 员工编号。
   * @returns {void}
   */
  function deleteEmployee(id) {
    store.mutate((state) => {
      state.employees = state.employees.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增招聘计划。
   * @param {Object} payload 招聘计划表单数据。
   * @returns {Object} 写入本地状态的新招聘计划。
   */
  function createRecruitment(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('R', state.recruitment),
        position: payload.position,
        dept: payload.dept || '人事部',
        headcount: Number(payload.headcount) || 1,
        status: payload.status || '待发布',
        publishDate: payload.publishDate || '2026-04-19',
        deadline: payload.deadline || '2026-05-19',
        applicants: Number(payload.applicants) || 0
      };

      state.recruitment.push(item);
      return item;
    });
  }

  /**
   * 删除招聘计划。
   * @param {string} id 招聘计划编号。
   * @returns {void}
   */
  function deleteRecruitment(id) {
    store.mutate((state) => {
      state.recruitment = state.recruitment.filter((item) => item.id !== id);
    });
  }

  /**
   * 更新招聘计划。
   * @param {string} id 招聘计划编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的记录。
   */
  function updateRecruitment(id, payload) {
    return store.mutate((state) => {
      const item = state.recruitment.find((r) => r.id === id);
      if (!item) return null;
      if (payload.position !== undefined) item.position = payload.position;
      if (payload.dept !== undefined) item.dept = payload.dept;
      if (payload.headcount !== undefined) item.headcount = Number(payload.headcount) || 1;
      if (payload.status !== undefined) item.status = payload.status;
      if (payload.publishDate !== undefined) item.publishDate = payload.publishDate;
      if (payload.deadline !== undefined) item.deadline = payload.deadline;
      if (payload.applicants !== undefined) item.applicants = Number(payload.applicants) || 0;
      return item;
    });
  }

  /**
   * 新增考勤记录。
   * @param {Object} payload 考勤表单数据。
   * @returns {Object} 新增的考勤记录。
   */
  function createAttendance(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('A', state.attendance),
        empId: payload.empId || '',
        empName: payload.empName || '',
        month: payload.month || '',
        workDays: Number(payload.workDays) || 0,
        actualDays: Number(payload.actualDays) || 0,
        lateTimes: Number(payload.lateTimes) || 0,
        leaveDays: Number(payload.leaveDays) || 0,
        overtimeHours: Number(payload.overtimeHours) || 0
      };
      state.attendance.push(item);
      return item;
    });
  }

  /**
   * 更新考勤记录。
   * @param {string} id 考勤编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的记录。
   */
  function updateAttendance(id, payload) {
    return store.mutate((state) => {
      const item = state.attendance.find((a) => a.id === id);
      if (!item) return null;
      if (payload.empId !== undefined) item.empId = payload.empId;
      if (payload.empName !== undefined) item.empName = payload.empName;
      if (payload.month !== undefined) item.month = payload.month;
      if (payload.workDays !== undefined) item.workDays = Number(payload.workDays) || 0;
      if (payload.actualDays !== undefined) item.actualDays = Number(payload.actualDays) || 0;
      if (payload.lateTimes !== undefined) item.lateTimes = Number(payload.lateTimes) || 0;
      if (payload.leaveDays !== undefined) item.leaveDays = Number(payload.leaveDays) || 0;
      if (payload.overtimeHours !== undefined) item.overtimeHours = Number(payload.overtimeHours) || 0;
      return item;
    });
  }

  /**
   * 删除考勤记录。
   * @param {string} id 考勤编号。
   * @returns {void}
   */
  function deleteAttendance(id) {
    store.mutate((state) => {
      state.attendance = state.attendance.filter((a) => a.id !== id);
    });
  }

  /**
   * 新增绩效记录。
   * @param {Object} payload 绩效表单数据。
   * @returns {Object} 新增的绩效记录。
   */
  function createPerformance(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('P', state.performance),
        empId: payload.empId || '',
        empName: payload.empName || '',
        dept: payload.dept || '',
        period: payload.period || '',
        score: Number(payload.score) || 0,
        grade: payload.grade || 'B',
        comment: payload.comment || ''
      };
      state.performance.push(item);
      return item;
    });
  }

  /**
   * 更新绩效记录。
   * @param {string} id 绩效编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的记录。
   */
  function updatePerformance(id, payload) {
    return store.mutate((state) => {
      const item = state.performance.find((p) => p.id === id);
      if (!item) return null;
      if (payload.empId !== undefined) item.empId = payload.empId;
      if (payload.empName !== undefined) item.empName = payload.empName;
      if (payload.dept !== undefined) item.dept = payload.dept;
      if (payload.period !== undefined) item.period = payload.period;
      if (payload.score !== undefined) item.score = Number(payload.score) || 0;
      if (payload.grade !== undefined) item.grade = payload.grade;
      if (payload.comment !== undefined) item.comment = payload.comment;
      return item;
    });
  }

  /**
   * 删除绩效记录。
   * @param {string} id 绩效编号。
   * @returns {void}
   */
  function deletePerformance(id) {
    store.mutate((state) => {
      state.performance = state.performance.filter((p) => p.id !== id);
    });
  }

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    createPerformance,
    updatePerformance,
    deletePerformance
  };
})(employeeSystem.store);
