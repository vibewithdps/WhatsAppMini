/**
 * Client-side AES-GCM End-to-End Encryption Helper using Web Crypto API
 */

const getChatKey = async (chatSecret = 'wa_e2e_default_secret_key_2026') => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(chatSecret.padEnd(32, '!').slice(0, 32)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('whatsapp_salt_crypto'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptMessage = async (plaintext, chatSecret) => {
  try {
    const key = await getChatKey(chatSecret);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();

    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );

    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    return `enc:${btoa(String.fromCharCode(...combined))}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return plaintext;
  }
};

export const decryptMessage = async (cipherTextWithPrefix, chatSecret) => {
  if (!cipherTextWithPrefix || !cipherTextWithPrefix.startsWith('enc:')) {
    return cipherTextWithPrefix;
  }

  try {
    const raw = atob(cipherTextWithPrefix.slice(4));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);

    const key = await getChatKey(chatSecret);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.warn('Decryption failed, displaying raw cipher:', error);
    return '[🔒 Encrypted Message]';
  }
};
