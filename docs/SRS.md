# Software Requirements Specification (SRS)
## Password Security Testing and Assessment System (PSTS)

### 1. Project Overview
The **Password Security Testing and Assessment System (PSTS)** is a web-based cybersecurity platform designed to evaluate password strength, analyse password hashes, demonstrate secure password storage practices, and generate professional password security assessment reports.

- **GitHub Repository**: [https://github.com/Mozjr1303/password-security-testing-system](https://github.com/Mozjr1303/password-security-testing-system)
- **Live Three-Page Portfolio Website (GitHub Pages)**: [https://mozjr1303.github.io/password-security-testing-system/](https://mozjr1303.github.io/password-security-testing-system/)
- **Synthetic Educational Datasets**: [`/datasets`](../datasets)

### 2. Core Objectives
1. Evaluate password strength, bit entropy, character diversity, and predictable patterns (leetspeak, keyboard walks, dictionary matches).
2. Inspect and verify cryptographic password hashes across `Argon2id`, `bcrypt`, `PBKDF2-HMAC-SHA256`, `SHA-256`, `SHA-1`, and `MD5`.
3. Demonstrate the security difference between fast general-purpose digests and adaptive memory-hard password hashing.
4. Evaluate password storage configurations using weighted security scoring (Section 9) with Critical-weakness overrides.
5. Generate downloadable security assessment reports (PDF & CSV) while enforcing a strict zero-plaintext storage policy.
