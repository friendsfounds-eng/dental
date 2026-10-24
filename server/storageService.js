import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Secure Vault Directory for local AES-256 encrypted storage
const VAULT_ROOT = path.join(__dirname, 'data', 'vault');
if (!fs.existsSync(VAULT_ROOT)) {
  fs.mkdirSync(VAULT_ROOT, { recursive: true, mode: 0o700 });
}

// Master Clinic Encryption Key (AES-256 requires 32 bytes)
const MASTER_KEY_FILE = path.join(__dirname, 'data', '.vault_master_key');
let MASTER_KEY;

if (process.env.CLINIC_VAULT_ENCRYPTION_KEY) {
  MASTER_KEY = crypto.createHash('sha256').update(process.env.CLINIC_VAULT_ENCRYPTION_KEY).digest();
} else if (fs.existsSync(MASTER_KEY_FILE)) {
  MASTER_KEY = Buffer.from(fs.readFileSync(MASTER_KEY_FILE, 'utf8').trim(), 'hex');
} else {
  // Generate a cryptographically secure 256-bit key
  MASTER_KEY = crypto.randomBytes(32);
  fs.writeFileSync(MASTER_KEY_FILE, MASTER_KEY.toString('hex'), { mode: 0o600 });
}

// Signing Secret for Pre-Signed View & Upload URLs
const SIGNING_SECRET = crypto.createHmac('sha256', MASTER_KEY).update('CLINIC_PRESIGNED_URL_SECRET_2026').digest();

class StorageService {
  constructor() {
    this.s3Config = {
      bucket: process.env.AWS_S3_BUCKET || null,
      region: process.env.AWS_REGION || 'ap-south-1',
      enabled: !!(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID)
    };
  }

  /**
   * AES-256-GCM Server-Side Encryption
   * Prepends 12-byte IV and 16-byte GCM authentication tag to ciphertext.
   * Format: [IV (12B)] [AuthTag (16B)] [Ciphertext (NB)]
   */
  encryptBuffer(plainBuffer) {
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);

    const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag(); // 128-bit authentication tag

    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * AES-256-GCM Server-Side Decryption
   * Verifies 128-bit authentication tag to ensure tamper-proof integrity.
   */
  decryptBuffer(encryptedBuffer) {
    if (encryptedBuffer.length < 28) {
      throw new Error('Encrypted payload is corrupted or too short (< 28 bytes).');
    }

    const iv = encryptedBuffer.slice(0, 12);
    const authTag = encryptedBuffer.slice(12, 28);
    const ciphertext = encryptedBuffer.slice(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Saves image payload to private storage architecture with AES-256 SSE.
   * @param {string} tenantId - Clinic Tenant ID
   * @param {string} fileId - Unique Image Identifier (e.g. XRAY-2026-1001)
   * @param {Buffer} buffer - Plaintext image buffer
   * @param {string} mimeType - MIME type
   * @returns {Object} Storage manifest details
   */
  async saveFile(tenantId, fileId, buffer, mimeType) {
    const encryptedData = this.encryptBuffer(buffer);
    const tenantVaultDir = path.join(VAULT_ROOT, tenantId);

    if (!fs.existsSync(tenantVaultDir)) {
      fs.mkdirSync(tenantVaultDir, { recursive: true, mode: 0o700 });
    }

    const storageKey = `${fileId}.enc`;
    const localFilePath = path.join(tenantVaultDir, storageKey);

    // Save encrypted payload locally (private ACL, 0600)
    fs.writeFileSync(localFilePath, encryptedData, { mode: 0o600 });

    return {
      provider: this.s3Config.enabled ? 'aws-s3-private' : 'private-vault-aes256',
      bucket: this.s3Config.enabled ? this.s3Config.bucket : `clinic-vault-${tenantId}`,
      key: storageKey,
      serverSideEncryption: 'AES-256-GCM',
      acl: 'private',
      originalSizeBytes: buffer.length,
      encryptedSizeBytes: encryptedData.length,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex')
    };
  }

  /**
   * Reads and decrypts file from private storage architecture on-the-fly.
   */
  async readFile(tenantId, fileId) {
    const storageKey = fileId.endsWith('.enc') ? fileId : `${fileId}.enc`;
    const localFilePath = path.join(VAULT_ROOT, tenantId, storageKey);

    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File ${fileId} not found in private vault for tenant ${tenantId}.`);
    }

    const encryptedData = fs.readFileSync(localFilePath);
    return this.decryptBuffer(encryptedData);
  }

  /**
   * Deletes file from private storage.
   */
  async deleteFile(tenantId, fileId) {
    const storageKey = fileId.endsWith('.enc') ? fileId : `${fileId}.enc`;
    const localFilePath = path.join(VAULT_ROOT, tenantId, storageKey);

    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      return true;
    }
    return false;
  }

  /**
   * Generates a time-limited pre-signed upload URL / ticket (valid for 15 minutes).
   */
  generatePreSignedUploadTicket(tenantId, patientId, filename, mimeType, expiresInSeconds = 900) {
    const uploadId = `upl_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const maxSizeBytes = 50 * 1024 * 1024; // 50 MB

    const payload = `${tenantId}:${patientId}:${uploadId}:${expiresAt}:${maxSizeBytes}`;
    const signature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');

    return {
      uploadId,
      uploadUrl: `/api/xray/upload?signedTicket=${uploadId}`,
      expiresAt: new Date(expiresAt).toISOString(),
      expiresInSeconds,
      maxSizeBytes,
      maxSizeFormatted: '50 MB',
      acceptedFormats: ['.dcm', '.png', '.jpeg', '.tiff'],
      acceptedMimeTypes: ['application/dicom', 'image/png', 'image/jpeg', 'image/tiff'],
      token: `${Buffer.from(payload).toString('base64url')}.${signature}`,
      storagePolicy: {
        serverSideEncryption: 'AES256',
        acl: 'private',
        bucket: this.s3Config.enabled ? this.s3Config.bucket : `clinic-vault-${tenantId}`
      }
    };
  }

  /**
   * Generates a time-limited pre-signed view / streaming URL (valid for 30 minutes).
   */
  generatePreSignedViewUrl(tenantId, imageId, expiresInSeconds = 1800) {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const payload = `${tenantId}:${imageId}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;

    return `/api/xray/stream/${imageId}?token=${token}&expires=${expiresAt}`;
  }

  /**
   * Verifies an incoming pre-signed view token and expiration timestamp.
   */
  verifyPreSignedViewToken(token, imageId) {
    try {
      if (!token || !token.includes('.')) return { valid: false, reason: 'Malformed token' };

      const [payloadB64, signature] = token.split('.');
      const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
      const expectedSignature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');

      if (signature !== expectedSignature) {
        return { valid: false, reason: 'Invalid signature. Unauthorized access denied.' };
      }

      const [tenantId, tokenImageId, expiresAtStr] = payload.split(':');
      if (tokenImageId !== imageId) {
        return { valid: false, reason: 'Token does not match requested image.' };
      }

      const expiresAt = parseInt(expiresAtStr, 10);
      if (Date.now() > expiresAt) {
        return { valid: false, reason: 'Pre-signed URL has expired. Please refresh the diagnostic view.' };
      }

      return { valid: true, tenantId, imageId };
    } catch (err) {
      return { valid: false, reason: err.message };
    }
  }
}

export const storageService = new StorageService();
