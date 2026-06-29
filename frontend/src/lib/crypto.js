// Frontend encryption helper using Web Crypto API (AES-GCM)

async function getCryptoKey() {
  const secretString = (import.meta.env && import.meta.env.VITE_ENCRYPTION_KEY) || "my-super-secret-key-32-bytes!!!";
  const msgUint8 = new TextEncoder().encode(secretString);
  // Hash the key using SHA-256 to ensure it is exactly 32 bytes (256 bits)
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
  
  return window.crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string into a formatted ciphertext.
 * @param {string} text - Plaintext to encrypt
 * @returns {Promise<string>} Format: ivHex:authTagHex:ciphertextHex
 */
export async function encrypt(text) {
  const key = await getCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12 bytes for GCM
  const encodedText = new TextEncoder().encode(text);
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );
  
  const encryptedArray = new Uint8Array(encrypted);
  
  // The Web Crypto API appends the 16-byte authentication tag at the end of the ciphertext
  const ciphertext = encryptedArray.slice(0, -16);
  const authTag = encryptedArray.slice(-16);
  
  // Convert to hex
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
  const authTagHex = Array.from(authTag).map(b => b.toString(16).padStart(2, "0")).join("");
  const ciphertextHex = Array.from(ciphertext).map(b => b.toString(16).padStart(2, "0")).join("");
  
  return `${ivHex}:${authTagHex}:${ciphertextHex}`;
}

/**
 * Decrypts a formatted ciphertext back to plaintext.
 * @param {string} encryptedText - Format: ivHex:authTagHex:ciphertextHex
 * @returns {Promise<string>} Plaintext
 */
export async function decrypt(encryptedText) {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected ivHex:authTagHex:ciphertextHex");
  }
  
  const [ivHex, authTagHex, ciphertextHex] = parts;
  
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const authTag = new Uint8Array(authTagHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const ciphertext = new Uint8Array(ciphertextHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  // Combine ciphertext and authTag back
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);
  
  const key = await getCryptoKey();
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    combined
  );
  
  return new TextDecoder().decode(decrypted);
}
