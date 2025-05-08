const nodemailer = require("nodemailer");
const crypto = require('crypto');
require('dotenv').config();
var crypt = require('./crypt');
const { MlKem768 } = require('mlkem');

const { Console } = require("console");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function splitStringIntoFive(str) {
  const strLength = str.length;
  const partLength = Math.floor(strLength / 5);
  const remainder = strLength % 5;
  const result = [];

  let startIndex = 0;
  for (let i = 0; i < 5; i++) {
    let endIndex = startIndex + partLength;
    if (i < remainder) {
      endIndex++;
    }
    result.push(str.substring(startIndex, endIndex));
    startIndex = endIndex;
  }
  return result;
}

const transporter = nodemailer.createTransport({
  host: process.env.Mail_SMTP_HOST,
  port: Number(process.env.MAIL_SMTP_PORT),
  secure: (process.env.MAIL_SMTP_SECURE === 'true' ? true : false), // true for port 465, false for other ports
  auth: {
    user: process.env.MAIL_SMTP_USERNAME,
    pass: process.env.MAIL_SMTP_PASSWORD,
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function main() {

  const privetKeyParts = splitStringIntoFive(process.env.PRIVATE_KEY);
  const id = crypto.randomInt(1111111111, 9999999999).toString(); // Generate a random 10 digit number
  let msgcount = 1;

  if (privetKeyParts.length > 0) {
    privetKeyParts.forEach(async (element) => {

      await sleep(1200); // Sleep for 1.2 second as SES sand limit is 1 emails per second
      const a = BigInt(process.env.CRYPT_A); //BigInt('10060503295969647925188773225582035629579119017119701153283855496497048011514427577830152426024852561324895411104945235954430029508480410469752975231618183376933488700600605684330593584570331477701433707842590092720863168625943141102400636453246302513244279610482273498565515956680555941905582866804662138370');    
      const n = BigInt(process.env.CRYPT_N); //BigInt('38285053399654906790389220378702848008742323419608895009569284984304409409133233347303906458700814581610889681569352487393278631944988763092927206984640198244905459087901267074160902715703719789485534589165585970754677786023766924324041327885094868782276204937000420963621376501608800903062748707010523890517'); 
      const T = Number(process.env.CRYPT_T); //60000;
      const { K } = crypt.setupKey();

      const message = Buffer.from(element, 'utf-8');
      console.log("LOCKING MESSAGE parts");
      const { C, E, ciphertext } = await crypt.lockMessage(message, T, n, a, K);
      console.log(id);
      console.log("LOCKED MESSAGE");
      // send mail with defined transport object
      const info = await transporter.sendMail({
        from: process.env.Mail_SMTP_FROM_ADDRESS, // sender address
        to: process.env.Mail_CONSORTIUM_EMAIL, // list of receivers
        subject: "MAIL PRIVATE KEY", // Subject line
        text: "MAIL PRIVATE KEY PARTS", // plain text body
        html: "<b>MAIL PRIVATE KEY PARTS</b>", // html body
        headers: {
          'pkfragment': C.toString('hex'),
          'pkcipher': Buffer.from(ciphertext).toString('hex'),
          'tlpuzzle': E.toString('hex'),
          'pkmlid': id,
          'pkseq': msgcount++,
        },
      });

      console.log("Key Parts sent to Consotorium: %s", info.messageId);

    });
  }

  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}

main().catch(console.error);