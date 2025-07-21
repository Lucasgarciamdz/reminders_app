import Dexie, { Table } from 'dexie';
import { LocalReminder, SyncOperation, AppSettings } from '../types';

class OfflineDatabase extends Dexie {
  reminders!: Table<LocalReminder>;
  syncQueue!: Table<SyncOperation>;
  settings!: Table<AppSettings>;

  constructor() {
    super('RemindersOfflineDB');
    
    this.version(1).stores({
      reminders: '++id, localId, text, completed, reminderDate, priority, syncStatus, lastModified',
      syncQueue: '++id, type, reminderId, localId, timestamp, retryCount',
      settings: '&key, value, updatedAt',
    });
  }
}

class OfflineStorageService {
  private db: OfflineDatabase;

  constructor() {
    this.db = new OfflineDatabase();
  }

  // Reminder operations
  async getLocalReminders(): Promise<LocalReminder[]> {
    return await this.db.reminders.orderBy('reminderDate').toArray();
  }

  async saveLocalReminder(reminder: LocalReminder): Promise<void> {
    reminder.lastModified = Date.now();
    await this.db.reminders.put(reminder);
  }

  async updateLocalReminder(id: number, updates: Partial<LocalReminder>): Promise<void> {
    const updatedData = {
      ...updates,
      lastModified: Date.now(),
      syncStatus: 'PENDING' as const,
    };
    await this.db.reminders.update(id, updatedData);
  }

  async deleteLocalReminder(id: number): Promise<void> {
    await this.db.reminders.delete(id);
  }

  async getLocalReminderById(id: number): Promise<LocalReminder | undefined> {
    return await this.db.reminders.get(id);
  }

  async getLocalReminderByLocalId(localId: string): Promise<LocalReminder | undefined> {
    return await this.db.reminders.where('localId').equals(localId).first();
  }

  async getPendingReminders(): Promise<LocalReminder[]> {
    return await this.db.reminders.where('syncStatus').equals('PENDING').toArray();
  }

  async getConflictReminders(): Promise<LocalReminder[]> {
    return await this.db.reminders.where('syncStatus').equals('CONFLICT').toArray();
  }

  // Sync queue operations
  async addToSyncQueue(operation: SyncOperation): Promise<void> {
    await this.db.syncQueue.add(operation);
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    return await this.db.syncQueue.orderBy('timestamp').toArray();
  }

  async removeSyncOperation(id: string): Promise<void> {
    await this.db.syncQueue.where('id').equals(id).delete();
  }

  async updateSyncOperation(id: string, updates: Partial<SyncOperation>): Promise<void> {
    await this.db.syncQueue.update(id, updates);
  }

  async clearSyncQueue(): Promise<void> {
    await this.db.syncQueue.clear();
  }

  async getFailedSyncOperations(): Promise<SyncOperation[]> {
    return await this.db.syncQueue.where('retryCount').above(0).toArray();
  }

  // Settings operations
  async getSetting<T = any>(key: string): Promise<T | undefined> {
    const setting = await this.db.settings.get(key);
    return setting?.value;
  }

  async setSetting<T = any>(key: string, value: T): Promise<void> {
    await this.db.settings.put({
      key,
      value,
      updatedAt: Date.now(),
    });
  }

  async deleteSetting(key: string): Promise<void> {
    await this.db.settings.delete(key);
  }

  async getAllSettings(): Promise<AppSettings[]> {
    return await this.db.settings.toArray();
  }

  // Bulk operations
  async bulkSaveReminders(reminders: LocalReminder[]): Promise<void> {
    const remindersWithTimestamp = reminders.map(reminder => ({
      ...reminder,
      lastModified: Date.now(),
    }));
    await this.db.reminders.bulkPut(remindersWithTimestamp);
  }

  async bulkDeleteReminders(ids: number[]): Promise<void> {
    await this.db.reminders.bulkDelete(ids);
  }

  // Database management
  async clearAllData(): Promise<void> {
    await this.db.reminders.clear();
    await this.db.syncQueue.clear();
    await this.db.settings.clear();
  }

  async getStorageInfo(): Promise<{
    remindersCount: number;
    syncQueueCount: number;
    settingsCount: number;
  }> {
    const [remindersCount, syncQueueCount, settingsCount] = await Promise.all([
      this.db.reminders.count(),
      this.db.syncQueue.count(),
      this.db.settings.count(),
    ]);

    return {
      remindersCount,
      syncQueueCount,
      settingsCount,
    };
  }

  // Search operations
  async searchReminders(query: string): Promise<LocalReminder[]> {
    const lowerQuery = query.toLowerCase();
    return await this.db.reminders
      .filter(reminder => 
        reminder.text.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  }

  async getRemindersByDateRange(startDate: string, endDate: string): Promise<LocalReminder[]> {
    return await this.db.reminders
      .where('reminderDate')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getRemindersByPriority(priority: string): Promise<LocalReminder[]> {
    return await this.db.reminders
      .where('priority')
      .equals(priority)
      .toArray();
  }

  async getCompletedReminders(): Promise<LocalReminder[]> {
    return await this.db.reminders
      .where('completed')
      .equals(1)
      .toArray();
  }

  async getIncompleteReminders(): Promise<LocalReminder[]> {
    return await this.db.reminders
      .where('completed')
      .equals(0)
      .toArray();
  }
}

// Create and export a singleton instance
export const offlineStorageService = new OfflineStorageService();
export default offlineStorageService;