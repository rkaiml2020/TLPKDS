// Install dependency for progress bar:
// npm install cli-progress
require('dotenv').config();

const crypto = require('crypto');
const cliProgress = require('cli-progress');
const { MlKem768 } = require('mlkem');

var crypt = require('./crypt');


async function lockMessage (message, T, n, a, K) {
   
    const C = crypt.aesEncryptDecrypt(message, K.slice(0, 32), 'encrypt');
    const s = crypt.bytesToInt(K.slice(0, 32));

    let x = a;
    for (let i = 0; i < T; i++) {
        x = crypt.modPow(x, 2n, n);
    }

    const E_Raw = (s + x) % n;
    console.log("E_Raw_lock", E_Raw.toString());

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

    const E = crypt.aesEncryptDecrypt(E_Raw.toString(), sharedSecretSender.slice(0,32), 'encrypt');
    return { C, E, ciphertext };
}

async function unlockKey (E, a, n, T , ciphertext) {

    const receiverKeys = new MlKem768();
    receiverKeys.publicKey = new Uint8Array(Buffer.from(process.env.CRYPT_RECIEVER_PUBLIC_KEY, 'hex'));
    receiverKeys.privateKey = new Uint8Array(Buffer.from(process.env.CRYPT_RECIEVER_PRIVATE_KEY, 'hex'));

    const sharedSecretReceiver = await receiverKeys.decap(new Uint8Array(Buffer.from(ciphertext, 'hex')), receiverKeys.privateKey);

    

    E_Raw_Uint = crypt.aesEncryptDecrypt(E, sharedSecretReceiver.slice(0,32));

    console.log("E_Raw_String", E_Raw_Uint.toString());


    E_Raw = BigInt( E_Raw_Uint.toString()); 
    console.log("E_Raw", E_Raw);

    let x = a;
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(T, 0);
    for (let i = 0; i < T; i++) {
        x = crypt.modPow(x, 2n, n);
        if (i % Math.max(1, Math.floor(T / 100)) === 0) {
            progressBar.update(i);
            await new Promise(resolve => setTimeout(resolve, 0)); // Yield event loop
        }
    }
    progressBar.update(T);
    progressBar.stop();

    const sPrime = (E_Raw - x) % n;
    //console.log("sPrime", sPrime.toString());
    const K_prime = crypt.intToBytes(sPrime, 32);
    //console.log("K_prime", K_prime.toString('hex'));
    return K_prime;
}
async function unlockMessage (C, E, a, n, T, ciphertext) {
    const K_prime = await unlockKey(E, a, n, T, ciphertext);
    const message = crypt.aesEncryptDecrypt(C, K_prime);
    return message;
}


async function test(){

          const a = BigInt('10060503295969647925188773225582035629579119017119701153283855496497048011514427577830152426024852561324895411104945235954430029508480410469752975231618183376933488700600605684330593584570331477701433707842590092720863168625943141102400636453246302513244279610482273498565515956680555941905582866804662138370');    
          const n = BigInt('38285053399654906790389220378702848008742323419608895009569284984304409409133233347303906458700814581610889681569352487393278631944988763092927206984640198244905459087901267074160902715703719789485534589165585970754677786023766924324041327885094868782276204937000420963621376501608800903062748707010523890517'); 
          const T = 60000;
          const { K } = crypt.setupKey();
    
          const message = Buffer.from("test message", 'utf-8');
          console.log("LOCKING MESSAGE parts");
          const { C, E, ciphertext } = await lockMessage(message, T, n, a, K);

          console.log('LOCKED MESSAGE', C.toString('hex'));
          //console.log('E', E.toString('hex'));
          //console.log('ciphertext', Buffer.from(ciphertext).toString('hex'));

          let C1 = C.toString('hex');
          let E1 = E.toString('hex');
          let ciphertext1 =  Buffer.from(ciphertext).toString('hex');

          const recoveredMessage = await unlockMessage(C1, E1, a, n, T, ciphertext1);
          console.log(`\nRecovered Message: ${recoveredMessage.toString()}`);



}


test().catch(console.error);