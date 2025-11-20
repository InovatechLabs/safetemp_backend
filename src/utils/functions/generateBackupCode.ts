import crypto from 'crypto';

export default function generateBackupCode(length = 8) {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(length);
    let result: string = '';

    for(let i = 0; i < length; i++) {
        result +=characters[bytes[i] % characters.length]
    }
    return result;
}