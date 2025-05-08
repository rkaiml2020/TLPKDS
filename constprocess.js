const { ImapFlow } = require('imapflow');
const simpleParser = require('mailparser').simpleParser;
//const fs = require('fs');
var crypt = require('./crypt');
require('dotenv').config();
const funCallDuration = Number(process.env.MAIL_CALL_DURATION);

var keyProgress= {};
var keyStorage= {};

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

function waitForEnter() {
    return new Promise(resolve => {
        readline.question('Press Enter to continue...', () => {
            readline.close();
            resolve();
        });
    });
}


const getEmailData = async () => {
    try {

        const a = BigInt(process.env.CRYPT_A);    
        const n = BigInt(process.env.CRYPT_N); 
        const T = Number(process.env.CRYPT_T);
        const { K } = crypt.setupKey();

        const client = new ImapFlow({
            host: process.env.MAIL_IMAP_HOST,
            port: Number(process.env.MAIL_IMAP_PORT),
            secure: (process.env.MAIL_IMAP_TLS_ENABLE === 'true' ? true : false),
            tls: {
                rejectUnauthorized: (process.env.MAIL_IMAP_TLS_REJECT_UNAUTHORIZED === 'true' ? true : false),
            },
            auth: {
                user: process.env.MAIL_IMAP_USERNAME,
                pass: process.env.MAIL_IMAP_PASSWORD,
            },
            logger: {}
        });

        // const hostName =process.env.MAIL_HOST;
        // console.log("hostName1111",hostName);
        // console.log("hostName1111 type",typeof hostName);

        await client.connect();
        //let tree = await client.listTree();
        //tree.folders.forEach(mailbox => console.log(mailbox.path));
        // Select and lock a mailbox. Throws if mailbox does not exist
        let lock = await client.getMailboxLock('INBOX');
        try {
            // const messageIds = await client.search({
            //   subject: messageSubject,
            // });

            const messageIds = await client.search({ subject: 'MAIL PRIVATE KEY', seen: false });

            if (messageIds?.length === 0) {
                console.log("message not found!");
                return;
            } else {
                for (let msg of messageIds) {
                    const message = await client.fetchOne(msg, {
                        envelope: true,
                        source: true,
                        bodyStructure: true,
                        headers: true,
                    });
                    
                    let parsed = await simpleParser(message.source);

                    let C = parsed.headers.get("pkfragment");
                    let E = parsed.headers.get("tlpuzzle");
                    let id = parsed.headers.get("pkmlid");
                    let ciphertext = parsed.headers.get("pkcipher");

                    if(!keyStorage.hasOwnProperty(id.toString())){
                        keyStorage[id.toString()] = Array(5).fill("");
                        keyProgress[id.toString()] = 1;
                    }

                    console.log("Processing message with ID: ", id);
                    const recoveredMessage = await crypt.unlockMessage(C, E, a, n, T, ciphertext);
                    keyStorage[id][Number(parsed.headers.get("pkseq"))-1] = recoveredMessage.toString();
                    keyProgress[id.toString()]++;

                    if(keyProgress[id.toString()] > 5){
                        console.log("All parts received for ID: ", id);
                        //console.log(keyStorage[id]);
                        const finalMessage = keyStorage[id].join("");
                        console.log("Privet key: ", finalMessage);
                    }
                    //Mark the email as seen
                    //await client.messageFlagsAdd(msg, ["\\Seen"]);
                }
            }
        } finally {
            // Make sure to release the lock
            // even if an error occurred
            lock.release();
            await client.logout();
        }
    } catch (error) {
        console.log(error);
    }

};
getEmailData();
// main().catch(err => console.error(err));
//setInterval(getEmailData,funCallDuration);

