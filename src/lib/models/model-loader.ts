const DB_NAME = 'dewatermark-models';
const STORE_NAME = 'models';
const DB_VERSION = 1;

function getDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function cacheModel(key: string, data: ArrayBuffer): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getCachedModel(key: string): Promise<ArrayBuffer | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function isModelCached(key: string): Promise<boolean> {
  const data = await getCachedModel(key);
  return data !== null;
}

export async function clearModelCache(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function loadModel(modelPath: string, onProgress?: (p: number) => void): Promise<ArrayBuffer> {
  const cached = await getCachedModel(modelPath);
  if (cached) {
    if (onProgress) onProgress(100);
    return cached;
  }

  const response = await fetch(modelPath);
  if (!response.ok) throw new Error(`Failed to fetch model: ${response.statusText}`);

  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  
  if (!total) {
    const buffer = await response.arrayBuffer();
    await cacheModel(modelPath, buffer);
    if (onProgress) onProgress(100);
    return buffer;
  }

  const reader = response.body!.getReader();
  let received = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    if (value) {
      chunks.push(value);
      received += value.length;
      if (onProgress) {
        onProgress(Math.round((received / total) * 100));
      }
    }
  }

  const buffer = new Uint8Array(received);
  let position = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, position);
    position += chunk.length;
  }

  const result = buffer.buffer;
  await cacheModel(modelPath, result);
  return result;
}
