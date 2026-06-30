import { useState, useCallback } from 'react';
import type { ChecklistStatus } from '../constants/preparednessChecklist';

const STORAGE_KEY = 'ews-mktbi:kpw-checklist';

function loadFromStorage(): Record<string, ChecklistStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(data: Record<string, ChecklistStatus>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore write errors
  }
}

export function usePreparednessChecklist() {
  const [data, setData] = useState<Record<string, ChecklistStatus>>(loadFromStorage);

  const getStatus = useCallback(
    (officeId: string): ChecklistStatus => data[officeId] ?? {},
    [data]
  );

  const toggleItem = useCallback((officeId: string, itemId: string) => {
    setData((prev) => {
      const officeStatus = prev[officeId] ?? {};
      const updated = {
        ...prev,
        [officeId]: { ...officeStatus, [itemId]: !officeStatus[itemId] },
      };
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const getCompletionCount = useCallback(
    (officeId: string, items: string[]) => {
      const status = data[officeId] ?? {};
      return items.filter((id) => status[id]).length;
    },
    [data]
  );

  return { getStatus, toggleItem, getCompletionCount };
}
