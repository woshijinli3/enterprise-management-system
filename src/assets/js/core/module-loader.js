'use strict';

const appScriptLoader = (function() {
  const BUSINESS_SYSTEMS = {
    employee: 'employeeSystem',
    equipment: 'equipmentSystem',
    production: 'productionSystem',
    purchase: 'purchaseSystem',
    sales: 'salesSystem',
    warehouse: 'warehouseSystem'
  };

  const BUSINESS_SCRIPT_ORDER = ['store', 'actions', 'renderers', 'pages'];
  const SHARED_SCRIPTS = ['state', 'view', 'charts'];

  /**
   * 加载一个经典脚本并用 data-runtime-script 去重。
   * @param {string} src 脚本相对当前页面的可访问路径。
   * @param {string} key 当前运行时内唯一的脚本标识。
   * @returns {Promise<void>} 脚本加载完成时 resolve，加载失败时 reject。
   *
   * 原因：项目没有打包器，各业务页仍通过普通 script 标签运行；运行时注入要避免同一业务域重复加载。
   */
  function loadScript(src, key) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-runtime-script="' + key + '"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.dataset.runtimeScript = key;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load script: ' + src));
      document.body.appendChild(script);
    });
  }

  /**
   * 加载所有业务域共享的状态和视图工具。
   * @param {string} rootPath 当前页面回到 src 根目录的相对路径。
   * @returns {Promise<void>} shared 脚本按顺序加载完成后 resolve。
   *
   * 原因：systems/<domain> 依赖 EnterpriseState 和 EnterpriseView，必须先于业务实现加载。
   */
  async function loadSharedScripts(rootPath) {
    for (const name of SHARED_SCRIPTS) {
      await loadScript(rootPath + 'assets/js/shared/' + name + '.js', 'shared-' + name);
    }
  }

  /**
   * 按固定顺序加载当前业务域脚本。
   * @param {{section: string, rootPath: string}} pageMeta 当前页面所属业务域和资源根路径。
   * @returns {Promise<string|undefined>} 返回业务系统的全局变量名，非业务页返回 undefined。
   *
   * 原因：data/store/actions/renderers/pages 存在依赖顺序，必须由统一加载器串行装配。
   */
  async function loadBusinessScripts(pageMeta) {
    const systemGlobal = BUSINESS_SYSTEMS[pageMeta.section];
    if (!systemGlobal) {
      return undefined;
    }

    if (window[systemGlobal] && typeof window[systemGlobal].init === 'function') {
      return systemGlobal;
    }

    await loadSharedScripts(pageMeta.rootPath);

    await loadScript(
      pageMeta.rootPath + 'data/' + pageMeta.section + '.js',
      pageMeta.section + '-data'
    );

    for (const name of BUSINESS_SCRIPT_ORDER) {
      await loadScript(
        pageMeta.rootPath + 'assets/js/systems/' + pageMeta.section + '/' + name + '.js',
        pageMeta.section + '-' + name
      );
    }

    return systemGlobal;
  }

  /**
   * 初始化当前业务系统。
   * @param {{section: string, rootPath: string}} pageMeta 当前页面元信息。
   * @returns {Promise<void>} 业务系统完成初始化后 resolve。
   *
   * 原因：main.js 只认识页面元信息，具体子系统由加载器解析为 window.xxxSystem。
   */
  async function initBusinessSystem(pageMeta) {
    const systemGlobal = await loadBusinessScripts(pageMeta);
    if (!systemGlobal) {
      return;
    }

    const systemApi = window[systemGlobal];
    if (systemApi && typeof systemApi.init === 'function') {
      systemApi.init();
    }
  }

  return {
    loadScript,
    initBusinessSystem
  };
})();

window.appScriptLoader = appScriptLoader;
