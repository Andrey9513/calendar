// Cryptography and API functions
const CalendarAPI = {
    // Derive encryption key from password
    async deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    // Encrypt data
    async encrypt(plaintext, password) {
        const enc = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            enc.encode(plaintext)
        );

        // Return base64 encoded values
        return {
            salt: this.arrayBufferToBase64(salt),
            iv: this.arrayBufferToBase64(iv),
            ciphertext: this.arrayBufferToBase64(encrypted)
        };
    },

    // Decrypt data
    async decrypt(encryptedObj, password) {
        const salt = this.base64ToArrayBuffer(encryptedObj.salt);
        const iv = this.base64ToArrayBuffer(encryptedObj.iv);
        const ciphertext = this.base64ToArrayBuffer(encryptedObj.ciphertext);
        const key = await this.deriveKey(password, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        return dec.decode(decrypted);
    },

    // Helper: ArrayBuffer to Base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    // Helper: Base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    // Login
    async login(password) {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Login failed');
        }

        return true;
    },

    // Logout
    async logout() {
        await fetch('/auth/logout', { method: 'POST' });
        window.location.reload();
    },

    // Get encrypted events from API
    async getEvents() {
        const response = await fetch('/api/events');
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        return response.json();
    },

    // Save encrypted events to API
    async saveEvents(encryptedData) {
        const response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(encryptedData)
        });

        if (!response.ok) {
            throw new Error('Failed to save events');
        }

        return true;
    }
};