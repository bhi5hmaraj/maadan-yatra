import { DataProvider } from '@refinedev/core';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY_PREFIX = 'maadan_yatra_';

function getStorageKey(resource: string): string {
  return `${STORAGE_KEY_PREFIX}${resource}`;
}

function getAll<T>(resource: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(getStorageKey(resource));
  return data ? JSON.parse(data) : [];
}

function saveAll<T>(resource: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(resource), JSON.stringify(data));
}

function normalizeComparable(value: unknown): string | number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

export const localStorageDataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    let data = getAll<Record<string, unknown>>(resource);

    // Apply filters
    if (filters && filters.length > 0) {
      data = data.filter((item) => {
        return filters.every((filter) => {
          if ('field' in filter && 'value' in filter) {
            const value = item[filter.field];
            const filterValue = filter.value;

            switch (filter.operator) {
              case 'eq':
                return value === filterValue;
              case 'ne':
                return value !== filterValue;
              case 'contains':
                return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
              default:
                return true;
            }
          }
          return true;
        });
      });
    }

    // Apply sorting
    if (sorters && sorters.length > 0) {
      data.sort((a, b) => {
        for (const sorter of sorters) {
          const aValue = normalizeComparable(a[sorter.field]);
          const bValue = normalizeComparable(b[sorter.field]);

          if (aValue < bValue) return sorter.order === 'asc' ? -1 : 1;
          if (aValue > bValue) return sorter.order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply pagination
    const total = data.length;
    const current = pagination?.current ?? 1;
    const pageSize = pagination?.pageSize ?? 10;

    if (pagination?.mode !== 'off') {
      const start = (current - 1) * pageSize;
      const end = start + pageSize;
      data = data.slice(start, end);
    }

    return {
      data: data as never[],
      total,
    };
  },

  getOne: async ({ resource, id }) => {
    const data = getAll<Record<string, unknown>>(resource);
    const item = data.find((d) => d.id === id);

    if (!item) {
      throw new Error(`${resource} with id ${id} not found`);
    }

    return { data: item as never };
  },

  create: async ({ resource, variables }) => {
    const data = getAll<Record<string, unknown>>(resource);
    const now = new Date().toISOString();

    const newItem = {
      ...variables,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    data.push(newItem);
    saveAll(resource, data);

    return { data: newItem as never };
  },

  update: async ({ resource, id, variables }) => {
    const data = getAll<Record<string, unknown>>(resource);
    const index = data.findIndex((d) => d.id === id);

    if (index === -1) {
      throw new Error(`${resource} with id ${id} not found`);
    }

    const updatedItem = {
      ...data[index],
      ...variables,
      id,
      updatedAt: new Date().toISOString(),
    };

    data[index] = updatedItem;
    saveAll(resource, data);

    return { data: updatedItem as never };
  },

  deleteOne: async ({ resource, id }) => {
    const data = getAll<Record<string, unknown>>(resource);
    const index = data.findIndex((d) => d.id === id);

    if (index === -1) {
      throw new Error(`${resource} with id ${id} not found`);
    }

    const deletedItem = data[index];
    data.splice(index, 1);
    saveAll(resource, data);

    return { data: deletedItem as never };
  },

  getApiUrl: () => '',

  getMany: async ({ resource, ids }) => {
    const data = getAll<Record<string, unknown>>(resource);
    const items = data.filter((d) => ids.includes(d.id as string));

    return { data: items as never[] };
  },

  createMany: async ({ resource, variables }) => {
    const data = getAll<Record<string, unknown>>(resource);
    const now = new Date().toISOString();

    const newItems = (variables as Record<string, unknown>[]).map((item) => ({
      ...item,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }));

    data.push(...newItems);
    saveAll(resource, data);

    return { data: newItems as never[] };
  },

  deleteMany: async ({ resource, ids }) => {
    let data = getAll<Record<string, unknown>>(resource);
    const deletedItems = data.filter((d) => ids.includes(d.id as string));

    data = data.filter((d) => !ids.includes(d.id as string));
    saveAll(resource, data);

    return { data: deletedItems as never[] };
  },

  updateMany: async ({ resource, ids, variables }) => {
    const data = getAll<Record<string, unknown>>(resource);
    const now = new Date().toISOString();

    const updatedItems: Record<string, unknown>[] = [];

    ids.forEach((id) => {
      const index = data.findIndex((d) => d.id === id);
      if (index !== -1) {
        data[index] = {
          ...data[index],
          ...variables,
          updatedAt: now,
        };
        updatedItems.push(data[index]);
      }
    });

    saveAll(resource, data);

    return { data: updatedItems as never[] };
  },

  custom: async () => {
    throw new Error('Custom method not implemented');
  },
};
