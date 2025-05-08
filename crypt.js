// Install dependency for progress bar:
// npm install cli-progress

const crypto = require('crypto');
const cliProgress = require('cli-progress');
const { MlKem768 } = require('mlkem');

module.exports = {
// Helper Functions
randomBigInt:  function(bits) {
    const bytes = crypto.randomBytes(bits / 8);
    return BigInt('0x' + bytes.toString('hex'));
},

modPow: function(base, exponent, modulus) {
    if (modulus === 1n) return 0n;
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
        if (exponent % 2n === 1n) {
            result = (result * base) % modulus;
        }
        exponent = exponent / 2n;
        base = (base * base) % modulus;
    }
    return result;
},

// AES Encryption/Decryption
aesEncryptDecrypt: function(encryptedData, key, mode = 'decrypt') {
    const ivLength = 16; // AES block size
    const algorithm = 'aes-256-cbc';

    if (key.length !== 32) {
        throw new Error('Key must be 32 bytes for AES-256.');
    }

    if (mode === 'encrypt') {
        const iv = crypto.randomBytes(ivLength);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(encryptedData), cipher.final()]);
        return Buffer.concat([iv, encrypted]); // Return IV + ciphertext
    } else if (mode === 'decrypt') {
        const inputBuffer = Buffer.from(encryptedData, 'hex');
        const iv = inputBuffer.subarray(0, ivLength);
        const encryptedText = inputBuffer.subarray(ivLength);
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
        return decrypted;
    } else {
        throw new Error("Mode must be 'encrypt' or 'decrypt'");
    }
},

xorEncryptDecrypt: function(encryptedData, key) {
    const data = Buffer.from(encryptedData, 'hex');
    const output = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) {
        output[i] = data[i] ^ key[i % key.length];
    }
    return output;
},

intToBytes: function(n, length) {
    let hex = n.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    const bytes = Buffer.from(hex, 'hex');
    if (bytes.length > length) {
        return bytes.slice(-length);
    } else if (bytes.length < length) {
        const pad = Buffer.alloc(length - bytes.length, 0);
        return Buffer.concat([pad, bytes]);
    }
    return bytes;
},

bytesToInt: function (b) {
    return BigInt('0x' + b.toString('hex'));
},

// Core Locking and Unlocking Functions
setupKey: function () {
    const latticeKey = crypto.randomBytes(32); // ephimeral key used for encrypting the Private Key fragment (M)
    const K = crypto.createHash('sha256').update(latticeKey).digest();
    return { K };
},

generateTimeLockParams: async function(bits = 512) {
    const p = crypto.generatePrimeSync(bits, { bigint: true });
    const q = crypto.generatePrimeSync(bits, { bigint: true });
    const n = p * q;
    //const n = BigInt('38285053399654906790389220378702848008742323419608895009569284984304409409133233347303906458700814581610889681569352487393278631944988763092927206984640198244905459087901267074160902715703719789485534589165585970754677786023766924324041327885094868782276204937000420963621376501608800903062748707010523890517')
    const a = this.randomBigInt(bits) % n;
    return { p, q, n, a };
},

lockMessage : async function (message, T, n, a, K) {
    const C = this.aesEncryptDecrypt(message, K.slice(0, 32), 'encrypt');
    const s = this.bytesToInt(K.slice(0, 32));

    let x = a;
    for (let i = 0; i < T; i++) {
        x = this.modPow(x, 2n, n);
    }

    const E_Raw = (s + x) % n;
    //console.log("E_Raw_lock", E_Raw.toString());

    const senderKeys = new MlKem768();
    senderKeys.publicKey = new Uint8Array(Buffer.from(process.env.CRYPT_SENDER_PUBLIC_KEY, 'hex'));
    senderKeys.privateKey = new Uint8Array(Buffer.from(process.env.CRYPT_SENDER_PRIVATE_KEY, 'hex'));

    const receiverKeys = new MlKem768();
    receiverKeys.publicKey = new Uint8Array(Buffer.from(process.env.CRYPT_RECIEVER_PUBLIC_KEY, 'hex'));
    receiverKeys.privateKey = new Uint8Array(Buffer.from(process.env.CRYPT_RECIEVER_PRIVATE_KEY, 'hex'));

    const [ciphertext, sharedSecretSender] = await senderKeys.encap(receiverKeys.publicKey);

    // Display and verify
    const senderHex = sharedSecretSender.toString('hex');
    //const receiverHex = sharedSecretReceiver.toString('hex');

    const E = this.aesEncryptDecrypt(E_Raw.toString(), sharedSecretSender.slice(0,32), 'encrypt');
    return { C, E, ciphertext };
},

unlockKey: async function (E, a, n, T , ciphertext) {

    const receiverKeys = new MlKem768();
    receiverKeys.publicKey = new Uint8Array(Buffer.from(process.env.CRYPT_RECIEVER_PUBLIC_KEY, 'hex'));
    receiverKeys.privateKey = new Uint8Array(Buffer.from(process.env.CRYPT_RECIEVER_PRIVATE_KEY, 'hex'));

    const sharedSecretReceiver = await receiverKeys.decap(new Uint8Array(Buffer.from(ciphertext, 'hex')), receiverKeys.privateKey);

    

    E_Raw_Uint = this.aesEncryptDecrypt(E, sharedSecretReceiver.slice(0,32));

    //console.log("E_Raw_String", E_Raw_Uint.toString());


    E_Raw = BigInt( E_Raw_Uint.toString()); 
    //console.log("E_Raw", E_Raw);

    let x = a;
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(T, 0);
    for (let i = 0; i < T; i++) {
        x = this.modPow(x, 2n, n);
        if (i % Math.max(1, Math.floor(T / 100)) === 0) {
            progressBar.update(i);
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield event loop
        }
    }
    progressBar.update(T);
    progressBar.stop();

    const sPrime = (E_Raw - x) % n;
    ////console.log("sPrime", sPrime.toString());
    const K_prime = this.intToBytes(sPrime, 32);
    ////console.log("K_prime", K_prime.toString('hex'));
    return K_prime;
},

unlockMessage: async function (C, E, a, n, T, ciphertext) {
    const K_prime = await this.unlockKey(E, a, n, T, ciphertext);
    const message = this.aesEncryptDecrypt(C, K_prime);
    return message;
}
};
