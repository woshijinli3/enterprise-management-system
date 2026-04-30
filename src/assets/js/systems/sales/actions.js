'use strict';

window.salesSystem = window.salesSystem || {};

salesSystem.actions = (function(store) {
  /**
   * 新增客户档案。
   * @param {Object} payload 客户表单数据。
   * @returns {Object} 写入本地状态的新客户记录。
   */
  function createCustomer(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('C', state.customers),
        name: payload.name,
        contact: payload.contact || '待定',
        phone: payload.phone || '',
        email: payload.email || '',
        city: payload.city || '北京',
        level: payload.level || '普通',
        totalAmount: Number(payload.totalAmount) || 0
      };

      state.customers.push(item);
      return item;
    });
  }

  /**
   * 删除客户档案。
   * @param {string} id 客户编号。
   * @returns {void}
   */
  function deleteCustomer(id) {
    store.mutate((state) => {
      state.customers = state.customers.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增销售订单并计算订单金额。
   * @param {Object} payload 销售订单表单数据。
   * @returns {Object} 写入本地状态的新销售订单。
   */
  function createOrder(payload) {
    return store.mutate((state) => {
      const quantity = Number(payload.quantity) || 0;
      const unitPrice = Number(payload.unitPrice) || 0;
      const item = {
        id: EnterpriseState.nextId('SO', state.orders),
        customerId: payload.customerId || '',
        customerName: payload.customerName,
        product: payload.product,
        quantity,
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
   * 新增产品定价策略并计算折扣。
   * @param {Object} payload 定价策略表单数据。
   * @returns {Object} 写入本地状态的新定价策略。
   */
  function createPricing(payload) {
    return store.mutate((state) => {
      const standardPrice = Number(payload.standardPrice) || 0;
      const currentPrice = Number(payload.currentPrice) || standardPrice;
      const item = {
        id: EnterpriseState.nextId('PR', state.pricing),
        product: payload.product,
        standardPrice,
        currentPrice,
        discount: standardPrice ? Number((currentPrice / standardPrice).toFixed(2)) : 1,
        validFrom: payload.validFrom || '2026-04-19',
        validTo: payload.validTo || '2026-12-31',
        status: payload.status || '生效中'
      };

      state.pricing.push(item);
      return item;
    });
  }

  /**
   * 更新客户档案。
   * @param {string} id 客户编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的客户记录，未找到时返回 null。
   */
  function updateCustomer(id, payload) {
    return store.mutate((state) => {
      const item = state.customers.find((c) => c.id === id);
      if (!item) return null;
      if (payload.name !== undefined) item.name = payload.name;
      if (payload.contact !== undefined) item.contact = payload.contact;
      if (payload.phone !== undefined) item.phone = payload.phone;
      if (payload.email !== undefined) item.email = payload.email;
      if (payload.city !== undefined) item.city = payload.city;
      if (payload.level !== undefined) item.level = payload.level;
      if (payload.totalAmount !== undefined) item.totalAmount = Number(payload.totalAmount) || 0;
      return item;
    });
  }

  /**
   * 更新销售订单。
   * @param {string} id 订单编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的订单记录。
   */
  function updateOrder(id, payload) {
    return store.mutate((state) => {
      const item = state.orders.find((o) => o.id === id);
      if (!item) return null;
      if (payload.customerName !== undefined) item.customerName = payload.customerName;
      if (payload.product !== undefined) item.product = payload.product;
      if (payload.quantity !== undefined) item.quantity = Number(payload.quantity) || 0;
      if (payload.unitPrice !== undefined) item.unitPrice = Number(payload.unitPrice) || 0;
      if (payload.status !== undefined) item.status = payload.status;
      if (payload.deliveryDate !== undefined) item.deliveryDate = payload.deliveryDate;
      item.amount = item.quantity * item.unitPrice;
      return item;
    });
  }

  /**
   * 删除销售订单。
   * @param {string} id 订单编号。
   * @returns {void}
   */
  function deleteOrder(id) {
    store.mutate((state) => {
      state.orders = state.orders.filter((item) => item.id !== id);
    });
  }

  /**
   * 更新产品定价策略。
   * @param {string} id 定价编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的定价记录。
   */
  function updatePricing(id, payload) {
    return store.mutate((state) => {
      const item = state.pricing.find((p) => p.id === id);
      if (!item) return null;
      if (payload.product !== undefined) item.product = payload.product;
      if (payload.standardPrice !== undefined) item.standardPrice = Number(payload.standardPrice) || 0;
      if (payload.currentPrice !== undefined) item.currentPrice = Number(payload.currentPrice) || 0;
      if (payload.validFrom !== undefined) item.validFrom = payload.validFrom;
      if (payload.validTo !== undefined) item.validTo = payload.validTo;
      if (payload.status !== undefined) item.status = payload.status;
      item.discount = item.standardPrice ? Number((item.currentPrice / item.standardPrice).toFixed(2)) : 1;
      return item;
    });
  }

  /**
   * 删除产品定价策略。
   * @param {string} id 定价编号。
   * @returns {void}
   */
  function deletePricing(id) {
    store.mutate((state) => {
      state.pricing = state.pricing.filter((item) => item.id !== id);
    });
  }

  return {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    createOrder,
    updateOrder,
    deleteOrder,
    createPricing,
    updatePricing,
    deletePricing
  };
})(salesSystem.store);
