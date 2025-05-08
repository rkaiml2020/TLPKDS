# 🔐 Timelock-PKDS: Private Key Disclosure Scheme for Non-Attributable Email Framework (NAEF)

## 📖 Overview
Email breaches are a prevalent issue, exposing sensitive personal, business, and political data. The situation is worsened by email’s inherent attributability, where attackers can easily prove the authenticity of stolen messages, thanks to protocols like DKIM designed to prevent spam and spoofing. This attribution increases the potential for harm, as attackers can sell stolen data, blackmail victims, or publicly release sensitive emails
with cryptographic proof of authenticity. This paper introduces Timelock-PKDS, a new scheme that fundamentally defines the forgeability of email authenticity after a set time period. Leveraging timelock puzzles, Timelock-PKDS provides a partial disclosure of the private key embedded in
the email’s X-header. The private key is encrypted, ensuring it remains secure but can be decrypted after the designated time has passed. This partial key disclosure enables delayed forgeability, allowing the authenticity of the email to be contested and forged only after the timelock expires. We formally define this concept of time-bound forgeability and propose the Timelock- PKDS scheme, which balances the need for secure communication with the ability for delayed forgery. Additionally, we evaluate the scheme’s performance, including its verification speed and bandwidth overhead, showing its practical viability for secure yet time-sensitive email systems.

This Node.js project implements a secure email communication system with support for timelocked private key fragments, using modern cryptographic techniques. It allows users to send plain or encrypted emails, where the decryption is only possible after a specified timelock period. The system leverages ML-KEM, AES encryption, hash functions, and timelock puzzles to achieve time-based security and consortium-based decryption.

---

## 📁 Project Files Explained

### 1. `SendEmail.js`

- **Purpose**: Sends a simple, plain-text email to a recipient.
- **Features**: No encryption or timelock involved.
- **Use Case**: Used for sending basic test emails or standard communication.

---

### 2. `SendEmailConst.js`

- **Purpose**: Sends an encrypted email using private key fragments and timelock logic.
- **Features**:
  - Encrypts the message using AES.
  - Distributes encrypted private key fragments protected by timelock puzzles.
  - Designed for time-restricted secure delivery.
- **Use Case**: Used when emails must only be decrypted after a specific time and/or with consortium support.

---

### 3. `ConstProcess.js`

- **Purpose**: Processes consortium emails and reconstructs the decryption key.
- **Features**:
  - Reads incoming emails sent to consortium members.
  - Solves timelock puzzles.
  - Reassembles private key fragments.
- **Use Case**: Used by consortium members to retrieve and use the AES decryption key after the unlock time.

---

### 4. `CryptLib.js`

- **Purpose**: A cryptographic library used across the application.
- **Features**:
  - Implements ML-KEM (quantum-resistant encryption).
  - AES-256 encryption and decryption.
  - Timelock puzzle generation and solving.
  - Secure hashing and utility functions.
- **Use Case**: Internal module used by `SendEmailConst.js` and `ConstProcess.js`.

---

## 🚀 How to Run the Application

### ✅ Prerequisites

- Node.js (v18 or later)
- Yarn or npm
- Environment variables set in a `.env` file (SMTP settings, email credentials, etc.)

### 📦 Install Dependencies

```bash
npm install
# or
yarn install

### 📦 Execution Order
node SendEmail.js         # Step 1: Basic email test
node SendEmailConst.js    # Step 2: Send encrypted email with timelock
node ConstProcess.js      # Step 3: Reconstruct the message after delay


# 📧 Configuration Guide

This project involves sending and receiving emails securely via IMAP/SMTP using ML-DKIM and Time-Lock cryptographic enhancements.

All sensitive credentials and cryptographic keys are defined in the `.env` file. Below is a breakdown of the environment variables required for proper configuration.

---

## 📥 IMAP Settings – Receiving Emails

These settings are used to connect to the consortium's email account for reading incoming messages.

| Variable Name              | Description                                         |
|---------------------------|-----------------------------------------------------|
| `MAIL_IMAP_HOST`          | IMAP server hostname (e.g., `imap.gmail.com`)      |
| `MAIL_IMAP_PORT`          | IMAP server port (usually `993`)                   |
| `MAIL_IMAP_USERNAME`      | Email address used to login                        |
| `MAIL_IMAP_PASSWORD`      | Email account app password                         |
| `MAIL_IMAP_TLS_ENABLE`    | Whether TLS is enabled for IMAP (`true`/`false`)   |
| `MAIL_IMAP_TLS_REJECT_UNAUTHORIZED` | Accept self-signed TLS certs (`true`/`false`) |
| `MAIL_CALL_DURATION`      | Interval in milliseconds to check new emails       |

---

## 📤 SMTP Settings – Sending Emails

These settings configure how the system sends emails securely.

| Variable Name              | Description                                        |
|---------------------------|----------------------------------------------------|
| `Mail_SMTP_HOST`          | SMTP server hostname (e.g., AWS SES)              |
| `Mail_SMTP_PORT`          | SMTP server port (`587` for TLS)                  |
| `MAIL_SMTP_USERNAME`      | SMTP login username                               |
| `MAIL_SMTP_PASSWORD`      | SMTP login password                               |
| `MAIL_SMTP_SECURE`        | Use secure TLS (`true`/`false`)                   |
| `Mail_SMTP_FROM_ADDRESS`  | Email address to use as the sender                |

---

## 📫 Email Addresses

These are configured email addresses used in email routing.

| Variable Name              | Description                                      |
|---------------------------|--------------------------------------------------|
| `Mail_CONSORTIUM_EMAIL`   | Email address of the consortium                  |
| `Mail_SEND_EMAIL`         | Contact email to receive forwarded messages      |

---

## 🔐 DKIM – DomainKeys Identified Mail

| Variable Name   | Description                    |
|----------------|--------------------------------|
| `PRIVATE_KEY`  | The DKIM private key to be used. Must be published in DNS. |

---

## ⏱️ Time-Lock Puzzle Configuration

These parameters define the complexity and structure of a time-lock cryptographic puzzle.

| Variable Name | Description |
|---------------|-------------|
| `CRYPT_N`     | Modulus (product of two large primes, P * Q) used for encryption |
| `CRYPT_A`     | Random base value used in the puzzle                            |
| `CRYPT_T`     | Puzzle difficulty (number of squarings/time delay in ms)        |

---

## 🔏 ML-DKIM Cryptographic Keys

### Sender Keys

Used to sign outgoing messages.

| Variable Name                  | Description                     |
|--------------------------------|---------------------------------|
| `CRYPT_SENDER_PUBLIC_KEY`      | Public key for verifying DKIM   |
| `CRYPT_SENDER_PRIVATE_KEY`     | Private key for signing DKIM    |

### Receiver Keys

Used to verify and decrypt received messages.

| Variable Name                  | Description                     |
|--------------------------------|---------------------------------|
| `CRYPT_RECIEVER_PUBLIC_KEY`    | Receiver's public key           |
| `CRYPT_RECIEVER_PRIVATE_KEY`   | Receiver's private key          |

---

## ⚠️ Security Notice

- Never commit your `.env` file to version control (e.g., Git).
- Consider using tools like AWS Secrets Manager or HashiCorp Vault to manage secrets in production.

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

