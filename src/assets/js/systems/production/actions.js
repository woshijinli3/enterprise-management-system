'use strict';

window.productionSystem = window.productionSystem || {};

productionSystem.actions = (function(store) {
  /**
   * 新增生产计划。
   * @param {Object} payload 生产计划表单数据。
   * @returns {Object} 写入本地状态的新生产计划。
   */
  function createPlan(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('PP', state.plans),
        name: payload.name,
        startDate: payload.startDate || '2026-04-19',
        endDate: payload.endDate || '2026-05-19',
        status: payload.status || '待启动',
        products: payload.products || ['新品']
      };

      state.plans.push(item);
      return item;
    });
  }

  /**
   * 更新生产计划。
   * @param {string} id 生产计划编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的生产计划，未找到时返回 null。
   */
  function updatePlan(id, payload) {
    return store.mutate((state) => {
      const item = state.plans.find((p) => p.id === id);
      if (!item) return null;
      if (payload.name !== undefined) item.name = payload.name;
      if (payload.startDate !== undefined) item.startDate = payload.startDate;
      if (payload.endDate !== undefined) item.endDate = payload.endDate;
      if (payload.status !== undefined) item.status = payload.status;
      return item;
    });
  }

  /**
   * 删除生产计划。
   * @param {string} id 生产计划编号。
   * @returns {void}
   */
  function deletePlan(id) {
    store.mutate((state) => {
      state.plans = state.plans.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增生产订单。
   * @param {Object} payload 生产订单表单数据。
   * @returns {Object} 写入本地状态的新生产订单。
   */
  function createOrder(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('PO', state.orders),
        customer: payload.customer,
        product: payload.product,
        quantity: Number(payload.quantity) || 0,
        status: payload.status || '待生产',
        createDate: payload.createDate || '2026-04-19',
        deliveryDate: payload.deliveryDate || '2026-05-19'
      };

      state.orders.push(item);
      return item;
    });
  }

  /**
   * 更新生产订单。
   * @param {string} id 生产订单编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的生产订单，未找到时返回 null。
   */
  function updateOrder(id, payload) {
    return store.mutate((state) => {
      const item = state.orders.find((o) => o.id === id);
      if (!item) return null;
      if (payload.customer !== undefined) item.customer = payload.customer;
      if (payload.product !== undefined) item.product = payload.product;
      if (payload.quantity !== undefined) item.quantity = Number(payload.quantity) || 0;
      if (payload.status !== undefined) item.status = payload.status;
      if (payload.createDate !== undefined) item.createDate = payload.createDate;
      if (payload.deliveryDate !== undefined) item.deliveryDate = payload.deliveryDate;
      return item;
    });
  }

  /**
   * 删除生产订单。
   * @param {string} id 生产订单编号。
   * @returns {void}
   */
  function deleteOrder(id) {
    store.mutate((state) => {
      state.orders = state.orders.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增生产任务。
   * @param {Object} payload 生产任务表单数据。
   * @returns {Object} 写入本地状态的新生产任务。
   */
  function createTask(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('PT', state.tasks),
        planId: payload.planId,
        productName: payload.productName,
        quantity: Number(payload.quantity) || 0,
        progress: Number(payload.progress) || 0,
        assignee: payload.assignee,
        deadline: payload.deadline
      };

      state.tasks.push(item);
      return item;
    });
  }

  /**
   * 更新生产任务。
   * @param {string} id 生产任务编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的生产任务，未找到时返回 null。
   */
  function updateTask(id, payload) {
    return store.mutate((state) => {
      const item = state.tasks.find((t) => t.id === id);
      if (!item) return null;
      if (payload.planId !== undefined) item.planId = payload.planId;
      if (payload.productName !== undefined) item.productName = payload.productName;
      if (payload.quantity !== undefined) item.quantity = Number(payload.quantity) || 0;
      if (payload.progress !== undefined) item.progress = Number(payload.progress) || 0;
      if (payload.assignee !== undefined) item.assignee = payload.assignee;
      if (payload.deadline !== undefined) item.deadline = payload.deadline;
      return item;
    });
  }

  /**
   * 删除生产任务。
   * @param {string} id 生产任务编号。
   * @returns {void}
   */
  function deleteTask(id) {
    store.mutate((state) => {
      state.tasks = state.tasks.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增物料。
   * @param {Object} payload 物料表单数据。
   * @returns {Object} 写入本地状态的新物料。
   */
  function createMaterial(payload) {
    return store.mutate((state) => {
      const required = Number(payload.required) || 0;
      const stock = Number(payload.stock) || 0;
      const item = {
        id: EnterpriseState.nextId('PM', state.materials),
        name: payload.name,
        spec: payload.spec,
        unit: payload.unit,
        required: required,
        stock: stock,
        shortage: Math.max(0, required - stock)
      };

      state.materials.push(item);
      return item;
    });
  }

  /**
   * 更新物料。
   * @param {string} id 物料编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的物料，未找到时返回 null。
   */
  function updateMaterial(id, payload) {
    return store.mutate((state) => {
      const item = state.materials.find((m) => m.id === id);
      if (!item) return null;
      if (payload.name !== undefined) item.name = payload.name;
      if (payload.spec !== undefined) item.spec = payload.spec;
      if (payload.unit !== undefined) item.unit = payload.unit;
      if (payload.required !== undefined) item.required = Number(payload.required) || 0;
      if (payload.stock !== undefined) item.stock = Number(payload.stock) || 0;
      if (payload.shortage !== undefined) item.shortage = Number(payload.shortage) || 0;
      return item;
    });
  }

  /**
   * 删除物料。
   * @param {string} id 物料编号。
   * @returns {void}
   */
  function deleteMaterial(id) {
    store.mutate((state) => {
      state.materials = state.materials.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增质检记录。
   * @param {Object} payload 质检记录表单数据。
   * @returns {Object} 写入本地状态的新质检记录。
   */
  function createQualityRecord(payload) {
    return store.mutate((state) => {
      const item = {
        id: EnterpriseState.nextId('PQ', state.qualityRecords),
        orderId: payload.orderId,
        inspector: payload.inspector,
        date: payload.date || '2026-04-19',
        result: payload.result || '合格',
        defects: Number(payload.defects) || 0
      };

      state.qualityRecords.push(item);
      return item;
    });
  }

  /**
   * 更新质检记录。
   * @param {string} id 质检记录编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的质检记录，未找到时返回 null。
   */
  function updateQualityRecord(id, payload) {
    return store.mutate((state) => {
      const item = state.qualityRecords.find((q) => q.id === id);
      if (!item) return null;
      if (payload.orderId !== undefined) item.orderId = payload.orderId;
      if (payload.inspector !== undefined) item.inspector = payload.inspector;
      if (payload.date !== undefined) item.date = payload.date;
      if (payload.result !== undefined) item.result = payload.result;
      if (payload.defects !== undefined) item.defects = Number(payload.defects) || 0;
      return item;
    });
  }

  /**
   * 删除质检记录。
   * @param {string} id 质检记录编号。
   * @returns {void}
   */
  function deleteQualityRecord(id) {
    store.mutate((state) => {
      state.qualityRecords = state.qualityRecords.filter((item) => item.id !== id);
    });
  }

  /**
   * 新增库存物料。
   * @param {Object} payload 库存物料表单数据。
   * @returns {Object} 写入本地状态的新库存物料。
   */
  function createInventoryItem(payload) {
    return store.mutate((state) => {
      const required = Number(payload.required) || 0;
      const stock = Number(payload.stock) || 0;
      const item = {
        id: EnterpriseState.nextId('PM', state.materials),
        name: payload.name,
        spec: payload.spec,
        unit: payload.unit,
        required: required,
        stock: stock,
        shortage: Math.max(0, required - stock)
      };

      state.materials.push(item);
      return item;
    });
  }

  /**
   * 更新库存物料。
   * @param {string} id 库存物料编号。
   * @param {Object} payload 更新的字段。
   * @returns {Object|null} 更新后的库存物料，未找到时返回 null。
   */
  function updateInventoryItem(id, payload) {
    return store.mutate((state) => {
      const item = state.materials.find((m) => m.id === id);
      if (!item) return null;
      if (payload.name !== undefined) item.name = payload.name;
      if (payload.spec !== undefined) item.spec = payload.spec;
      if (payload.unit !== undefined) item.unit = payload.unit;
      if (payload.required !== undefined) item.required = Number(payload.required) || 0;
      if (payload.stock !== undefined) item.stock = Number(payload.stock) || 0;
      if (payload.shortage !== undefined) item.shortage = Number(payload.shortage) || 0;
      return item;
    });
  }

  /**
   * 删除库存物料。
   * @param {string} id 库存物料编号。
   * @returns {void}
   */
  function deleteInventoryItem(id) {
    store.mutate((state) => {
      state.materials = state.materials.filter((item) => item.id !== id);
    });
  }

  return {
    createPlan,
    updatePlan,
    deletePlan,
    createOrder,
    updateOrder,
    deleteOrder,
    createTask,
    updateTask,
    deleteTask,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    createQualityRecord,
    updateQualityRecord,
    deleteQualityRecord,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
  };
})(productionSystem.store);
