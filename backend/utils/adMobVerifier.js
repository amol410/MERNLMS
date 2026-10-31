const crypto = require('crypto');

const KEYS_URL = 'https://www.gstatic.com/admob/reward/verifiable-keys.json';
let cachedKeys = null;
let cachedAt = 0;

async function getVerificationKeys() {
    if (cachedKeys && Date.now() - cachedAt < 24 * 60 * 60 * 1000) {
        return cachedKeys;
    }
    const response = await fetch(KEYS_URL, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Unable to retrieve AdMob verification keys');
    const body = await response.json();
    cachedKeys = body.keys || [];
    cachedAt = Date.now();
    return cachedKeys;
}

async function verifyAdMobQuery(rawQuery) {
    const parts = rawQuery.split('&');
    const signatureIndex = parts.findIndex(part => part.startsWith('signature='));
    if (signatureIndex < 0) return false;

    const params = new URLSearchParams(rawQuery);
    const signature = params.get('signature');
    const keyId = params.get('key_id');
    if (!signature || !keyId) return false;

    const keys = await getVerificationKeys();
    const key = keys.find(item => String(item.keyId) === String(keyId));
    if (!key || !key.publicKey) return false;

    const publicKey = `-----BEGIN PUBLIC KEY-----\n${key.publicKey}\n-----END PUBLIC KEY-----`;
    const content = parts.slice(0, signatureIndex).join('&');
    return crypto.verify(
        'sha256',
        Buffer.from(content),
        publicKey,
        Buffer.from(signature, 'base64url')
    );
}

function resetAdMobVerifierCache() {
    cachedKeys = null;
    cachedAt = 0;
}

module.exports = { verifyAdMobQuery, resetAdMobVerifierCache };
