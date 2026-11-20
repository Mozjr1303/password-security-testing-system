# Synthetic Educational Datasets (PSTS Laboratory)

This directory contains the authorised synthetic datasets used by the **Password Security Testing and Assessment System (PSTS)** for password strength evaluation, cryptographic hash analysis, algorithm benchmarking, and controlled dictionary auditing.

## Files Included

1. [`synthetic_passwords.csv`](./synthetic_passwords.csv) — 25 tiered synthetic test credentials spanning all 5 strength classifications (`Very Weak`, `Weak`, `Moderate`, `Strong`, `Very Strong`) with pre-computed bit entropy and pattern annotations.
2. [`synthetic_hash_samples.json`](./synthetic_hash_samples.json) — Multi-algorithm synthetic password hash corpus covering `Argon2id` (PHC v19), `bcrypt` (`$2b$10$` / `$2b$12$`), `PBKDF2-HMAC-SHA256`, `SHA-256`, `SHA-1` (legacy demonstration), and `MD5` (legacy demonstration).
3. [`educational_wordlist.txt`](./educational_wordlist.txt) — Approved local synthetic dictionary wordlist used for controlled dictionary auditing and leetspeak mutation demonstrations.

> **Ethical & Security Policy**: All entries in this folder are 100% synthetic educational strings generated specifically for laboratory experiments. No real user credentials or leaked password dumps are stored or processed.
