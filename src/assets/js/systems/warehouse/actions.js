'use strict';

window.warehouseSystem = window.warehouseSystem || {};

/**
 * 仓储管理操作层：库存、入库、出库的增删改。
 * 输入来自 warehouseSystem.store。
 * 输出为 warehouseSystem.actions，供 pages 调用。
 */
warehouseSystem.actions = (function(store) {
  /**
   * 新增库存物品。
   * @param {Object} payload 库存表单数据。
   * @returns {Object} 新增的库存记录。
   */
  function createInventory(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('W', state.inventory),
        name: payload.name,
        category: payload.category || '成品',
        spec: payload.spec || '',
        unit: payload.unit || '件',
        stock: Number(payload.stock) || 0,
        minStock: Number(payload.minStock) || 0,
        location: payload.location || '',
        lastUpdate: new Date().toISOString().slice(0, 10)
      };
      state.inventory.push(item);
      return item;
    });
  }

  /**
   * 更新库存物品。
   * @param {string} id 库存编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的记录。
   */
  function updateInventory(id, payload) {
    return store.mutate((state) => {
      const item = state.inventory.find((i) => i.id === id);
      if (!item) return null;
      if (payload.name !== undefined) item.name = payload.name;
      if (payload.category !== undefined) item.category = payload.category;
      if (payload.spec !== undefined) item.spec = payload.spec;
      if (payload.unit !== undefined) item.unit = payload.unit;
      if (payload.stock !== undefined) item.stock = Number(payload.stock) || 0;
      if (payload.minStock !== undefined) item.minStock = Number(payload.minStock) || 0;
      if (payload.location !== undefined) item.location = payload.location;
      item.lastUpdate = new Date().toISOString().slice(0, 10);
      return item;
    });
  }

  /**
   * 删除库存物品。
   * @param {string} id 库存编号。
   * @returns {void}
   */
  function deleteInventory(id) {
    store.mutate((state) => {
      state.inventory = state.inventory.filter((i) => i.id !== id);
    });
  }

  /**
   * 新增入库记录。
   * @param {Object} payload 入库表单数据。
   * @returns {Object} 新增的入库记录。
   */
  function createInbound(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('IN', state.inbound),
        item: payload.item,
        quantity: Number(payload.quantity) || 0,
        unit: payload.unit || '件',
        supplier: payload.supplier || '',
        date: payload.date || new Date().toISOString().slice(0, 10),
        operator: payload.operator || '仓管员'
      };
      state.inbound.push(item);
      return item;
    });
  }

  /**
   * 新增出库记录。
   * @param {Object} payload 出库表单数据。
   * @returns {Object} 新增的出库记录。
   */
  function createOutbound(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('OUT', state.outbound),
        item: payload.item,
        quantity: Number(payload.quantity) || 0,
        unit: payload.unit || '件',
        customer: payload.customer || '',
        date: payload.date || new Date().toISOString().slice(0, 10),
        operator: payload.operator || '仓管员'
      };
      state.outbound.push(item);
      return item;
    });
  }

  /**
   * 更新货位信息。
   * @param {string} id 货位编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的记录。
   */
  function updateLocation(id, payload) {
    return store.mutate((state) => {
      const item = state.locations.find((l) => l.id === id);
      if (!item) return null;
      if (payload.code !== undefined) item.code = payload.code;
      if (payload.zone !== undefined) item.zone = payload.zone;
      if (payload.type !== undefined) item.type = payload.type;
      if (payload.capacity !== undefined) item.capacity = Number(payload.capacity) || 0;
      if (payload.used !== undefined) item.used = Number(payload.used) || 0;
      if (payload.status !== undefined) item.status = payload.status;
      return item;
    });
  }

  return {
    createInventory,
    updateInventory,
    deleteInventory,
    createInbound,
    createOutbound,
    updateLocation
  };
})(warehouseSystem.store);
