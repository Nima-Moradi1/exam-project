import "server-only";

export type StoredAsset = { url: string; pathname: string; storageKey: string; contentType: string; sizeBytes: number };

export interface MediaStorageProvider {
  upload(pathname: string, file: File): Promise<StoredAsset>;
  remove(url: string): Promise<void>;
}
