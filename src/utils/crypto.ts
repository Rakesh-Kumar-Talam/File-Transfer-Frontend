/**
 * Client-Side Cryptographic Utilities
 * Uses WebCrypto API for secure, performant operations in the browser.
 * Files are never decrypted on the server.
 */

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

/**
 * Generate a random 256-bit AES key
 */
export const generateFileKey = async (): Promise<CryptoKey> => {
    return await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );
};

/**
 * Derived a chunk-specific key from the master file key using HKDF
 */
export const deriveChunkKey = async (
    masterKey: CryptoKey,
    chunkIndex: number
): Promise<CryptoKey> => {
    const masterKeyBytes = await window.crypto.subtle.exportKey('raw', masterKey);
    const baseKey = await window.crypto.subtle.importKey(
        'raw',
        masterKeyBytes,
        'HKDF',
        false,
        ['deriveKey']
    );

    const encoder = new TextEncoder();
    const info = encoder.encode(`chunk-${chunkIndex}`);
    const salt = new Uint8Array(16); // Fixed salt for deterministic derivation per file

    return await window.crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: salt,
            info: info,
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

/**
 * Encrypt a file chunk
 */
export const encryptChunk = async (
    chunk: ArrayBuffer,
    key: CryptoKey
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as any,
        },
        key,
        chunk
    );

    return { encryptedData, iv };
};

/**
 * Decrypt a file chunk
 */
export const decryptChunk = async (
    encryptedData: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
): Promise<ArrayBuffer> => {
    return await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv as any,
        },
        key,
        encryptedData
    );
};

/**
 * Wrap (encrypt) the master AES key using a public key (RSA-OAEP)
 */
export const wrapKey = async (
    masterKey: CryptoKey,
    publicKeyPem: string
): Promise<string> => {
    // Simple PEM to ArrayBuffer conversion (basic implementation)
    const binaryDerString = window.atob(publicKeyPem.replace(/-----(BEGIN|END) PUBLIC KEY-----|\n/g, ''));
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        false,
        ['wrapKey']
    );

    const wrappedKey = await window.crypto.subtle.wrapKey(
        'raw',
        masterKey,
        publicKey,
        'RSA-OAEP'
    );

    return btoa(String.fromCharCode(...new Uint8Array(wrappedKey)));
};

/**
 * Process a file into encrypted chunks
 */
export const processFileForUpload = async (
    file: File,
    onProgress: (progress: number) => void
): Promise<{ chunks: { data: Blob; iv: string }[]; wrappedKey: string }> => {
    const masterKey = await generateFileKey();
    const chunks: { data: Blob; iv: string }[] = [];
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = await file.slice(start, end).arrayBuffer();

        const chunkKey = await deriveChunkKey(masterKey, i);
        const { encryptedData, iv } = await encryptChunk(chunk, chunkKey);

        chunks.push({
            data: new Blob([encryptedData]),
            iv: btoa(String.fromCharCode(...iv))
        });

        onProgress(((i + 1) / totalChunks) * 100);
    }

    // Experimental: Export master key as raw bytes for temporary storage/wrapping
    // In real implementation, this would be wrapped for the specific recipient
    const rawKey = await window.crypto.subtle.exportKey('raw', masterKey);
    const wrappedKey = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

    return { chunks, wrappedKey };
};

/**
 * Reconstruct and decrypt a file from encrypted blob and keys
 */
export const reconstructFile = async (
    encryptedBlob: Blob,
    wrappedKey: string,
    ivs: string[],
    onProgress: (progress: number) => void
): Promise<Blob> => {
    // 1. Import Master Key
    const rawKey = Uint8Array.from(atob(wrappedKey), c => c.charCodeAt(0));
    const masterKey = await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM', length: 256 },
        true, // extractable must be true for deriveChunkKey to work
        ['encrypt', 'decrypt']
    );

    // 2. Process Chunks
    const decryptedChunks: ArrayBuffer[] = [];
    const totalChunks = ivs.length;
    let offset = 0;

    console.log(`🔓 Decrypting ${totalChunks} chunks. Total Encrypted Size: ${encryptedBlob.size} bytes`);

    for (let i = 0; i < totalChunks; i++) {
        const ivString = atob(ivs[i]);
        const iv = new Uint8Array(ivString.length);
        for (let j = 0; j < ivString.length; j++) {
            iv[j] = ivString.charCodeAt(j);
        }

        let currentEncryptedChunkSize = 0;
        if (i < totalChunks - 1) {
            // Standard chunk overhead for AES-GCM is 16 bytes auth tag
            currentEncryptedChunkSize = CHUNK_SIZE + 16;
        } else {
            // Last chunk takes the remaining bytes
            currentEncryptedChunkSize = encryptedBlob.size - offset;
        }

        console.log(`Processing Chunk ${i}: Offset ${offset}, Size ${currentEncryptedChunkSize}`);

        if (currentEncryptedChunkSize <= 0) {
            console.warn(`⚠️ Skipping empty/invalid chunk ${i}`);
            continue;
        }

        const chunkBlob = encryptedBlob.slice(offset, offset + currentEncryptedChunkSize);
        const chunkBuffer = await chunkBlob.arrayBuffer();

        // Derive key for this chunk
        const chunkKey = await deriveChunkKey(masterKey, i);

        try {
            const plaintext = await decryptChunk(chunkBuffer, chunkKey, iv);
            decryptedChunks.push(plaintext);
        } catch (e) {
            console.error(`❌ Failed to decrypt chunk ${i} (Offset: ${offset}, Size: ${currentEncryptedChunkSize})`, e);
            throw new Error(`Decryption failed at chunk ${i}. The file might be corrupted or the key is incorrect.`);
        }

        offset += currentEncryptedChunkSize;
        onProgress(((i + 1) / totalChunks) * 100);
    }

    console.log(`✅ Decryption complete. Reassembled ${decryptedChunks.length} chunks.`);
    return new Blob(decryptedChunks, { type: 'application/octet-stream' });
};
