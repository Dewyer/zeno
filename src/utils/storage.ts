import { BaseDirectory, readTextFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';

const STORAGE_FILE = 'zeno_data.json';

export interface Alarm {
  id: string;
  message: string;
  time: Date;
  isActive: boolean;
  duration?: number;
  elapsedTime?: number;
  keep: boolean;
}

interface AppData {
  alarms: Alarm[];
  commandHistory: string[];
}

const DEFAULT_DATA: AppData = {
  alarms: [],
  commandHistory: [],
};

// Convert Date objects to ISO strings for storage
function serializeAlarms(alarms: Alarm[]): any[] {
  return alarms.map(alarm => ({
    ...alarm,
    time: alarm.time.toISOString(),
  }));
}

// Convert ISO strings back to Date objects
function deserializeAlarms(alarms: any[]): Alarm[] {
  return alarms.map(alarm => ({
    ...alarm,
    time: new Date(alarm.time),
  }));
}

async function ensureFileExists(): Promise<void> {
  try {
    const fileExists = await exists(STORAGE_FILE, { baseDir: BaseDirectory.AppLocalData });
    if (!fileExists) {
      console.log('Creating new storage file...');
      await writeTextFile(STORAGE_FILE, JSON.stringify(DEFAULT_DATA, null, 2), {
        baseDir: BaseDirectory.AppLocalData,
      });
    }
  } catch (error) {
    console.error('Error ensuring file exists:', error);
    throw error;
  }
}

async function loadAppData(): Promise<AppData> {
  try {
    await ensureFileExists();
    const content = await readTextFile(STORAGE_FILE, {
      baseDir: BaseDirectory.AppLocalData,
    });
    console.log('Loaded content:', content);
    const data = JSON.parse(content);
    return {
      alarms: deserializeAlarms(data.alarms || []),
      commandHistory: data.commandHistory || [],
    };
  } catch (error) {
    console.error('Failed to load app data:', error);
    return DEFAULT_DATA;
  }
}

async function saveAppData(data: AppData): Promise<void> {
  try {
    await ensureFileExists();
    const serializedData = {
      ...data,
      alarms: serializeAlarms(data.alarms),
    };
    console.log('Saving app data:', serializedData);
    await writeTextFile(STORAGE_FILE, JSON.stringify(serializedData, null, 2), {
      baseDir: BaseDirectory.AppLocalData,
    });
  } catch (error) {
    console.error('Failed to save app data:', error);
  }
}

export async function loadAppState(): Promise<AppData> {
  return loadAppData();
}

export async function saveAppState(alarms: Alarm[], commandHistory: string[]): Promise<void> {
  const data: AppData = {
    alarms,
    commandHistory,
  };
  await saveAppData(data);
}

// For backward compatibility
export async function loadAlarms(): Promise<Alarm[]> {
  const data = await loadAppData();
  return data.alarms;
}

export async function loadCommandHistory(): Promise<string[]> {
  const data = await loadAppData();
  return data.commandHistory;
}

export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  const data = await loadAppData();
  data.alarms = alarms;
  await saveAppData(data);
}

export async function saveCommandHistory(history: string[]): Promise<void> {
  const data = await loadAppData();
  data.commandHistory = history;
  await saveAppData(data);
} 