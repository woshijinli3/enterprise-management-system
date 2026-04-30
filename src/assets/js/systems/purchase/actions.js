'use strict';

window.purchaseSystem = window.purchaseSystem || {};

purchaseSystem.actions = (function(store) {
  /**
   * 新增供应商档案。
   * @param {Object} payload 供应商表单数据。
   * @returns {Object} 写入本地状态的新供应商记录。
   */
  function createSupplier(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('S', state.suppliers),
        name: payload.name,
        contact: payload.contact || '待定',
        phone: payload.phone || '',
        category: payload.category || '原材料',
        rating: Number(payload.rating) || 3,
        status: payload.status || '合作中'
      };

      state.suppliers.push(item);
      return item;
    });
  }

  /**
   * 删除供应商档案。
   * @param {string} id 供应商编号。
   * @returns {void}
   */
  function deleteSupplier(id) {
    store.mutate((state) => {
      state.suppliers = state.suppliers.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增采购订单并计算订单金额。
   * @param {Object} payload 采购订单表单数据。
   * @returns {Object} 写入本地状态的新采购订单。
   */
  function createOrder(payload) {
    return store.mutate((state) => {
      const quantity = Number(payload.quantity) || 0;
      const unitPrice = Number(payload.unitPrice) || 0;
      const item = {
        id: EnterpriseState.nextId('PUR', state.orders),
        supplierId: payload.supplierId || '',
        supplierName: payload.supplierName,
        item: payload.item,
        quantity,
        unit: payload.unit || '件',
        unitPrice,
        amount: quantity * unitPrice,
        status: payload.status || '待审核',
        createDate: payload.createDate || '2026-04-19',
        deliveryDate: payload.deliveryDate || '2026-05-05'
      };

      state.orders.push(item);
      return item;
    });
  }

  /**
   * 更新供应商档案。
   * @param {string} id 供应商编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的供应商记录，未找到时返回 null。
   */
  function updateSupplier(id, payload) {
    return store.mutate((state) => {
      const item = state.suppliers.find((s) => s.id === id);
      if (!item) return null;
      if (payload.name !== undefined) item.name = payload.name;
      if (payload.contact !== undefined) item.contact = payload.contact;
      if (payload.phone !== undefined) item.phone = payload.phone;
      if (payload.category !== undefined) item.category = payload.category;
      if (payload.rating !== undefined) item.rating = Number(payload.rating) || 3;
      if (payload.status !== undefined) item.status = payload.status;
      return item;
    });
  }

  /**
   * 更新采购订单。
   * @param {string} id 订单编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的订单记录。
   */
  function updateOrder(id, payload) {
    return store.mutate((state) => {
      const item = state.orders.find((o) => o.id === id);
      if (!item) return null;
      if (payload.supplierName !== undefined) item.supplierName = payload.supplierName;
      if (payload.item !== undefined) item.item = payload.item;
      if (payload.quantity !== undefined) item.quantity = Number(payload.quantity) || 0;
      if (payload.unit !== undefined) item.unit = payload.unit;
      if (payload.unitPrice !== undefined) item.unitPrice = Number(payload.unitPrice) || 0;
      if (payload.status !== undefined) item.status = payload.status;
      if (payload.deliveryDate !== undefined) item.deliveryDate = payload.deliveryDate;
      item.amount = item.quantity * item.unitPrice;
      return item;
    });
  }

  /**
   * 删除采购订单。
   * @param {string} id 订单编号。
   * @returns {void}
   */
  function deleteOrder(id) {
    store.mutate((state) => {
      state.orders = state.orders.filter((item) => item.id !== id);
    });
  }

  return {
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createOrder,
    updateOrder,
    deleteOrder
  };
})(purchaseSystem.store);
