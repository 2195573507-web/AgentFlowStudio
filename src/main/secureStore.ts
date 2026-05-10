import { safeStorage } from 'electron';

export type SecureSecretPurpose = 'provider.apiKey' | 'auth.session';

export interface SecureSecretEnvelope {
  __secure: true;
  version: 1;
  provider: 'electron.safeStorage';
  purpose: SecureSecretPurpose;
  encoding: 'base64';
  ciphertext: string;
  last4: string;
  createdAt: string;
}

export interface SecureStorageAdapter {
  isEncryptionAvailable(): boolean;
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}

function defaultAdapter(): SecureStorageAdapter {
  return safeStorage;
}

export function isSecureStoreAvailable(adapter: SecureStorageAdapter = defaultAdapter()): boolean {
  try {
    return adapter.isEncryptionAvailable();
  } catch {
    return false;
  }
}

export function isProtectedSecret(value: unknown): value is SecureSecretEnvelope {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as SecureSecretEnvelope).__secure === true &&
      (value as SecureSecretEnvelope).version === 1 &&
      (value as SecureSecretEnvelope).provider === 'electron.safeStorage' &&
      (value as SecureSecretEnvelope).encoding === 'base64' &&
      typeof (value as SecureSecretEnvelope).ciphertext === 'string',
  );
}

export function protectSecret(
  plaintext: string,
  purpose: SecureSecretPurpose,
  adapter: SecureStorageAdapter = defaultAdapter(),
  now = new Date(),
): SecureSecretEnvelope {
  if (!plaintext) throw new Error('Cannot protect an empty secret.');
  if (!isSecureStoreAvailable(adapter)) {
    throw new Error('Secure storage is not available on this system.');
  }
  const encrypted = adapter.encryptString(plaintext);
  return {
    __secure: true,
    version: 1,
    provider: 'electron.safeStorage',
    purpose,
    encoding: 'base64',
    ciphertext: encrypted.toString('base64'),
    last4: plaintext.slice(-4),
    createdAt: now.toISOString(),
  };
}

export function unprotectSecret(
  envelope: unknown,
  adapter: SecureStorageAdapter = defaultAdapter(),
): string | null {
  if (!isProtectedSecret(envelope)) return null;
  if (!isSecureStoreAvailable(adapter)) return null;
  try {
    return adapter.decryptString(Buffer.from(envelope.ciphertext, 'base64'));
  } catch {
    return null;
  }
}

export function maskSecret(value: unknown): string {
  if (isProtectedSecret(value)) {
    return value.last4 ? `Saved key ending in ${value.last4}` : '[PROTECTED]';
  }
  if (typeof value !== 'string' || value.length === 0) return '';
  if (value === '[REDACTED]' || value.startsWith('Saved key ending in ')) return value;
  return `Saved key ending in ${value.slice(-4)}`;
}
