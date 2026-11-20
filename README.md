# Password Security Testing and Assessment System (PSTS)

An end-to-end cybersecurity web application and three-page project portfolio powered by **Argon2id**, **bcrypt**, **PBKDF2-HMAC-SHA256**, **Node.js + Express**, **Python FastAPI**, **PostgreSQL / Prisma ORM**, and **React + TypeScript**.

## Project Links

- **Live Portfolio Website (GitHub Pages)**: [https://mozjr1303.github.io/password-security-testing-system/](https://mozjr1303.github.io/password-security-testing-system/)
- **GitHub Repository**: [https://github.com/Mozjr1303/password-security-testing-system](https://github.com/Mozjr1303/password-security-testing-system)
- **Synthetic Educational Datasets**: [`datasets/`](./datasets) ([`synthetic_passwords.csv`](./datasets/synthetic_passwords.csv), [`synthetic_hash_samples.json`](./datasets/synthetic_hash_samples.json), [`educational_wordlist.txt`](./datasets/educational_wordlist.txt))
- **Software Requirements Specification (SRS)**: [`docs/SRS.md`](./docs/SRS.md)

---

## Project Overview

The **Password Security Testing and Assessment System (PSTS)** is a controlled cybersecurity laboratory designed to evaluate password strength and bit entropy, inspect and verify cryptographic password hashes, compare adaptive memory-hard hashing (`Argon2id`, `bcrypt`, `PBKDF2`) against fast general-purpose digests (`SHA-256`, `SHA-1`, `MD5`), audit password storage configurations, and generate downloadable security assessment reports (PDF & CSV) with zero plaintext credential storage.

## Problem Statement

Many applications rely on weak password storage practices, predictable password requirements, and insufficient authentication controls. Using fast general-purpose digests such as MD5, SHA-1, or raw SHA-256 without unique cryptographic salts or memory-hard work factors exposes user credentials to multi-billion guess/second GPU cracking, rainbow tables, and dictionary attacks.

## Objectives

- Evaluate password strength, bit entropy, character diversity, and predictable human patterns (leetspeak substitutions, keyboard walks, dictionary words).
- Inspect and verify sample password hashes across `Argon2id`, `bcrypt`, `PBKDF2-HMAC-SHA256`, `SHA-256`, `SHA-1`, and `MD5`.
- Demonstrate the cryptographic difference between unsalted digests, salted hashes, and adaptive memory-hard password hashing.
- Evaluate password storage configurations and calculate a weighted 0–100 security score with Critical-weakness overrides.
- Generate downloadable PDF and CSV security assessment reports without retaining plaintext passwords.
- Present the project through a clean three-page portfolio website deployed on GitHub Pages.

---

## Repository Structure

```text
password-security-testing-system/
├── frontend/               # React + TypeScript + Tailwind CSS 3-Page Portfolio & Interactive Security Demo
├── backend/                # Node.js + Express + TypeScript REST API, Argon2id/bcrypt/PBKDF2 Engines, PDFKit & Prisma
│   ├── prisma/             # SQLite local schema (schema.prisma) & PostgreSQL production schema (schema.postgresql.prisma)
│   └── src/                # Cryptographic assessment engines, REST routes, database seeder, and Jest/Supertest suite
├── cyber-engine/           # Python FastAPI microservice for entropy, hash verification, and algorithm benchmarking
├── datasets/               # Authorised synthetic password datasets, multi-algorithm hash samples, and wordlists
└── docs/                   # Software Requirements Specification (SRS) and technical documentation
```

---

## Installation & Local Execution

### 1. Clone the Repository

```bash
git clone https://github.com/Mozjr1303/password-security-testing-system.git
cd password-security-testing-system
```

### 2. Backend API Setup (`backend/`)

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

The backend API runs at `http://localhost:4000` (health check: `http://localhost:4000/api/health`).

To run the automated unit, integration, RBAC, and zero-plaintext test suite:

```bash
npm test
```

### 3. Frontend & Three-Page Portfolio Setup (`frontend/`)

```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Optional Python FastAPI Cybersecurity Engine (`cyber-engine/`)

```bash
cd ../cyber-engine
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## Developer Information

- **Developer**: Moses Aaron Makunganya
- **Role**: Full-Stack Developer & Cybersecurity Engineer
- **Email**: mosesmakunganyajr@gmail.com
- **GitHub**: [https://github.com/Mozjr1303](https://github.com/Mozjr1303)
