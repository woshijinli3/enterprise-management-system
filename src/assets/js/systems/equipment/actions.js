'use strict';

window.equipmentSystem = window.equipmentSystem || {};

equipmentSystem.actions = (function(store) {
  /**
   * 新增设备档案。
   * @param {Object} payload 设备表单数据。
   * @returns {Object} 写入本地状态的新设备记录。
   */
  function createEquipment(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('EQ', state.equipment),
        name: payload.name,
        model: payload.model || 'NEW-100',
        location: payload.location || '新车间',
        status: payload.status || '运行中',
        purchaseDate: payload.purchaseDate || '2026-04-19',
        lastMaintain: payload.lastMaintain || '2026-04-19',
        nextMaintain: payload.nextMaintain || '2026-07-19'
      };

      state.equipment.push(item);
      return item;
    });
  }

  /**
   * 更新设备档案。
   * @param {string} id 设备编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的设备记录。
   */
  function updateEquipment(id, payload) {
    return store.mutate((state) => {
      const item = state.equipment.find((e) => e.id === id);
      if (!item) return null;

      Object.assign(item, {
        name: payload.name,
        model: payload.model,
        location: payload.location,
        status: payload.status,
        purchaseDate: payload.purchaseDate,
        lastMaintain: payload.lastMaintain,
        nextMaintain: payload.nextMaintain
      });
      return item;
    });
  }

  /**
   * 删除设备档案。
   * @param {string} id 设备编号。
   * @returns {void}
   */
  function deleteEquipment(id) {
    store.mutate((state) => {
      state.equipment = state.equipment.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增设备维护计划。
   * @param {Object} payload 维护计划表单数据。
   * @returns {Object} 写入本地状态的新维护计划。
   */
  function createMaintenance(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('MT', state.maintenance),
        equipId: payload.equipId || '',
        equipName: payload.equipName,
        type: payload.type || '定期保养',
        planDate: payload.planDate || '2026-05-01',
        status: payload.status || '待执行',
        technician: payload.technician || '张工',
        cost: Number(payload.cost) || 0
      };

      state.maintenance.push(item);
      return item;
    });
  }

  /**
   * 更新设备维护计划。
   * @param {string} id 维护计划编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的维护计划记录。
   */
  function updateMaintenance(id, payload) {
    return store.mutate((state) => {
      const item = state.maintenance.find((m) => m.id === id);
      if (!item) return null;

      Object.assign(item, {
        equipName: payload.equipName,
        type: payload.type,
        planDate: payload.planDate,
        status: payload.status,
        technician: payload.technician,
        cost: Number(payload.cost) || 0
      });
      return item;
    });
  }

  /**
   * 删除设备维护计划。
   * @param {string} id 维护计划编号。
   * @returns {void}
   */
  function deleteMaintenance(id) {
    store.mutate((state) => {
      state.maintenance = state.maintenance.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增设备故障记录。
   * @param {Object} payload 故障记录表单数据。
   * @returns {Object} 写入本地状态的新故障记录。
   */
  function createFault(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('FT', state.faults),
        equipId: payload.equipId || '',
        equipName: payload.equipName,
        faultDate: payload.faultDate || '2026-04-19',
        description: payload.description || '待补充',
        severity: payload.severity || '一般',
        status: payload.status || '待处理',
        handler: payload.handler || '张工'
      };

      state.faults.push(item);
      return item;
    });
  }

  /**
   * 更新设备故障记录。
   * @param {string} id 故障记录编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的故障记录。
   */
  function updateFault(id, payload) {
    return store.mutate((state) => {
      const item = state.faults.find((f) => f.id === id);
      if (!item) return null;

      Object.assign(item, {
        equipName: payload.equipName,
        faultDate: payload.faultDate,
        description: payload.description,
        severity: payload.severity,
        status: payload.status,
        handler: payload.handler
      });
      return item;
    });
  }

  /**
   * 删除设备故障记录。
   * @param {string} id 故障记录编号。
   * @returns {void}
   */
  function deleteFault(id) {
    store.mutate((state) => {
      state.faults = state.faults.filter((item) => item.id !== id);
    });
  }

  return {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
    createFault,
    updateFault,
    deleteFault
  };
})(equipmentSystem.store);
