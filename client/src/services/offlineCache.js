import localforage from 'localforage';

const materialsStore = localforage.createInstance({ name: 'kosora', storeName: 'materials' });
const examsStore = localforage.createInstance({ name: 'kosora', storeName: 'exams' });
const resultsStore = localforage.createInstance({ name: 'kosora', storeName: 'results' });
const queueStore = localforage.createInstance({ name: 'kosora', storeName: 'queue' });

export const offlineCache = {
  materials: {
    get: async (id) => materialsStore.getItem(`material_${id}`),
    set: async (id, data) => materialsStore.setItem(`material_${id}`, data),
    getAll: async () => {
      const keys = await materialsStore.keys();
      const items = [];
      for (const key of keys) {
        items.push(await materialsStore.getItem(key));
      }
      return items;
    },
    clear: async () => materialsStore.clear()
  },
  exams: {
    get: async (id) => examsStore.getItem(`exam_${id}`),
    set: async (id, data) => examsStore.setItem(`exam_${id}`, data),
    getAll: async () => {
      const keys = await examsStore.keys();
      const items = [];
      for (const key of keys) {
        items.push(await examsStore.getItem(key));
      }
      return items;
    },
    clear: async () => examsStore.clear()
  },
  results: {
    get: async (id) => resultsStore.getItem(`result_${id}`),
    set: async (id, data) => resultsStore.setItem(`result_${id}`, data),
    getAll: async () => {
      const keys = await resultsStore.keys();
      const items = [];
      for (const key of keys) {
        items.push(await resultsStore.getItem(key));
      }
      return items;
    },
    clear: async () => resultsStore.clear()
  },
  queue: {
    add: async (action) => {
      const actions = await queueStore.getItem('pending_actions') || [];
      actions.push({ ...action, timestamp: Date.now() });
      await queueStore.setItem('pending_actions', actions);
    },
    getAll: async () => queueStore.getItem('pending_actions') || [],
    clear: async () => queueStore.setItem('pending_actions', []),
    remove: async (index) => {
      const actions = await queueStore.getItem('pending_actions') || [];
      actions.splice(index, 1);
      await queueStore.setItem('pending_actions', actions);
    }
  }
};

export const isOnline = () => navigator.onLine;

export const syncQueue = async (apiClient) => {
  if (!isOnline()) return;

  const actions = await offlineCache.queue.getAll();
  for (const [index, action] of actions.entries()) {
    try {
      await apiClient[action.method](action.url, action.data);
      await offlineCache.queue.remove(index);
    } catch (err) {
      console.error('Sync failed for action:', action, err);
    }
  }
};
