import crypto from "crypto";

const secretString = process.env.ENCRYPTION_KEY || "my-super-secret-key-32-bytes!!!";
// SHA-256 hash ensures exactly 32-byte key
const SECRET_KEY = crypto.createHash("sha256").update(secretString).digest();
const ALGORITHM = "aes-256-gcm";

/**
 * Encrypts a plaintext string into a formatted ciphertext.
 * @param text - Plaintext to encrypt
 * @returns Format: ivHex:authTagHex:ciphertextHex
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12); // 12 bytes IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  const ivHex = iv.toString("hex");
  
  return `${ivHex}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a formatted ciphertext back to plaintext.
 * @param encryptedText - Format: ivHex:authTagHex:ciphertextHex
 * @returns Plaintext
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format. Expected ivHex:authTagHex:ciphertextHex");
  }
  
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Decrypts a document's ciphertext field (if present) and merges the decrypted
 * fields back into the document object, with fallback support for legacy plaintext documents.
 */
function toEnglishDigits(str: any): string {
  if (str == null) return "";
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let clean = str.toString().replace(/,/g, "").replace(/،/g, "");
  for (let i = 0; i < 10; i++) {
    clean = clean.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
  }
  return clean.replace(/[^0-9-]/g, "");
}

/**
 * Decrypts a document's ciphertext field (if present) and merges the decrypted
 * fields back into the document object, with fallback support for legacy plaintext documents.
 */
export function decryptDocument(doc: any): any {
  if (!doc || !doc.ciphertext) return doc;
  try {
    const decryptedJson = decrypt(doc.ciphertext);
    const decryptedData = JSON.parse(decryptedJson);
    
    // Support either full UI state { header, rows } or a flat structure
    if (decryptedData.header && decryptedData.rows) {
      const { header, rows } = decryptedData;
      return {
        ...doc,
        document_date: header.docDate || doc.document_date,
        description: header.desc || doc.description,
        reference_number: header.letterNo || doc.reference_number,
        lines: (rows || []).map((r: any) => ({
          account_code: r.subAccount || "",
          account_name: r.account_name || "",
          debit: parseInt(toEnglishDigits(r.debit), 10) || 0,
          credit: parseInt(toEnglishDigits(r.credit), 10) || 0,
          description: r.desc || r.description || "",
        })),
        rawHeader: header,
        rawRows: rows,
      };
    }
    
    const { ciphertext, ...rest } = doc;
    return {
      ...rest,
      ...decryptedData,
    };
  } catch (err) {
    console.error("Failed to decrypt document:", doc._id, err);
    return doc;
  }
}
