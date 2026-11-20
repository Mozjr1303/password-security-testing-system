"""
PSTS Cybersecurity Engine (Python FastAPI Service)
Provides password entropy & pattern assessment, cryptographic hash generation/verification
(Argon2id, bcrypt, PBKDF2, and educational legacy demonstrations for MD5, SHA-1, SHA-256),
controlled dictionary/brute-force auditing, and algorithm benchmarking.
"""

import hashlib
import hmac
import math
import os
import re
import time
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

try:
    from argon2 import PasswordHasher, Type
    from argon2.exceptions import VerifyMismatchError
    HAS_ARGON2 = True
except ImportError:
    HAS_ARGON2 = False

try:
    import bcrypt
    HAS_BCRYPT = True
except ImportError:
    HAS_BCRYPT = False

app = FastAPI(
    title="PSTS Cybersecurity Engine",
    description="Controlled Password Auditing, Hash Analysis & Cryptographic Benchmarking Service",
    version="1.0.0"
)

SYNTHETIC_DICTIONARY = {
    "password", "123456", "12345678", "qwerty", "admin", "welcome", "letmein",
    "football", "iloveyou", "monkey", "shadow", "sunshine", "princess", "dragon",
    "passw0rd", "p@ssw0rd", "admin123", "welcome123", "qwertyuiop", "1234567890",
    "cybersecurity", "university", "student", "researcher", "developer", "trustno1",
    "abc123", "password1", "baseball", "superman", "batman", "master", "hello123"
}

KEYBOARD_WALKS = ["qwerty", "asdfgh", "zxcvbn", "123456", "234567", "345678", "456789", "987654", "654321"]

LEET_MAP = str.maketrans({
    "@": "a", "4": "a", "3": "e", "1": "i", "!": "i", "0": "o", "$": "s", "5": "s", "7": "t", "+": "t"
})


class PasswordEvalRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=256)


class HashVerifyRequest(BaseModel):
    candidate: str
    sample_hash: str
    algorithm: str
    salt: Optional[str] = None


class BenchmarkRequest(BaseModel):
    algorithms: List[str] = ["MD5", "SHA-1", "SHA-256", "PBKDF2", "bcrypt", "Argon2id"]
    bcrypt_rounds: int = 10
    argon2_time_cost: int = 3
    argon2_memory_kb: int = 65536
    pbkdf2_iterations: int = 100000


def evaluate_password_strength(pw: str) -> Dict[str, Any]:
    length = len(pw)
    has_lower = bool(re.search(r"[a-z]", pw))
    has_upper = bool(re.search(r"[A-Z]", pw))
    has_digit = bool(re.search(r"\d", pw))
    has_symbol = bool(re.search(r"[^A-Za-z0-9]", pw))

    pool_size = 0
    if has_lower:
        pool_size += 26
    if has_upper:
        pool_size += 26
    if has_digit:
        pool_size += 10
    if has_symbol:
        pool_size += 32

    raw_entropy = round(length * math.log2(max(pool_size, 1)), 2)

    lower_pw = pw.lower()
    normalized_pw = lower_pw.translate(LEET_MAP)

    patterns: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    penalty = 0.0

    # Length evaluation
    if length < 8:
        weaknesses.append("Password length is critically short (< 8 characters).")
        recommendations.append("Increase password length to at least 12–16 characters.")
        penalty += 25
    elif length < 12:
        weaknesses.append("Password length is below modern 12-character best practice.")
        recommendations.append("Use a passphrase or password of at least 12–16 characters.")

    # Character diversity
    diversity_count = sum([has_lower, has_upper, has_digit, has_symbol])
    if diversity_count <= 1:
        weaknesses.append("Single character class used; minimal character diversity.")
        recommendations.append("Combine uppercase, lowercase, digits, and special characters.")
        penalty += 20
    elif diversity_count == 2:
        weaknesses.append("Limited character class diversity (only 2 character types).")
        recommendations.append("Include additional character classes (uppercase, numbers, symbols).")
        penalty += 10

    # Repeated characters
    if re.search(r"(.)\1{2,}", pw):
        patterns.append("Repeated character sequence detected (e.g., 'aaa' or '111').")
        weaknesses.append("Contains repeated adjacent characters that reduce effective entropy.")
        recommendations.append("Avoid repeating the same character consecutively.")
        penalty += 12

    # Sequential characters / keyboard walks
    has_walk = any(walk in lower_pw for walk in KEYBOARD_WALKS)
    if has_walk or re.search(r"(abc|bcd|cde|def|efg|123|234|345|456|567|678|789)", lower_pw):
        patterns.append("Sequential characters or keyboard walk detected.")
        weaknesses.append("Predictable keyboard or alphabetical/numerical sequence found.")
        recommendations.append("Replace sequential character runs with unpredictable words or symbols.")
        penalty += 15

    # Dictionary & synthetic breach check
    is_exact_dict = lower_pw in SYNTHETIC_DICTIONARY
    is_leet_dict = normalized_pw in SYNTHETIC_DICTIONARY and not is_exact_dict
    contains_dict = any(w in normalized_pw for w in SYNTHETIC_DICTIONARY if len(w) >= 5)

    if is_exact_dict:
        patterns.append("Exact match in synthetic common/breached password dictionary.")
        weaknesses.append("Password appears directly in common dictionary / synthetic breached lists.")
        recommendations.append("Never use common dictionary words or top breached passwords.")
        penalty += 45
    elif is_leet_dict:
        patterns.append("Predictable leetspeak substitution of a common dictionary word (e.g., @ for a, 0 for o).")
        weaknesses.append("Uses predictable character substitutions that modern auditing tools test automatically.")
        recommendations.append("Avoid simple leetspeak substitutions on single dictionary words; use multi-word passphrases.")
        penalty += 30
    elif contains_dict:
        patterns.append("Contains a common dictionary root word with minor prefix/suffix.")
        weaknesses.append("Root word is vulnerable to hybrid dictionary + rule-based guessing.")
        recommendations.append("Use multiple unrelated words rather than appending numbers to a common word.")
        penalty += 15

    # Year / Date pattern
    if re.search(r"(19[5-9]\d|20[0-3]\d)", pw):
        patterns.append("Contains a 4-digit calendar year pattern (1950–2039).")
        weaknesses.append("Appending calendar years is a high-frequency user pattern.")
        recommendations.append("Remove predictable years or dates from passwords.")
        penalty += 8

    length_score = min(40.0, (length / 16.0) * 40.0)
    complexity_score = (diversity_count / 4.0) * 35.0
    entropy_bonus = min(25.0, (raw_entropy / 80.0) * 25.0)

    overall_score = max(0.0, min(100.0, round(length_score + complexity_score + entropy_bonus - penalty, 1)))
    if is_exact_dict:
        overall_score = min(overall_score, 15.0)

    effective_entropy = max(4.0, round(raw_entropy * (1.0 - min(penalty, 65.0) / 100.0), 2))

    if overall_score < 20:
        category = "Very Weak"
    elif overall_score < 40:
        category = "Weak"
    elif overall_score < 65:
        category = "Moderate"
    elif overall_score < 85:
        category = "Strong"
    else:
        category = "Very Strong"

    if not recommendations:
        recommendations.append("Password shows strong entropy and no common patterns. Store securely with Argon2id.")

    return {
        "password_length": length,
        "length_score": round(length_score, 1),
        "complexity_score": round(complexity_score, 1),
        "entropy_estimate": effective_entropy,
        "raw_entropy": raw_entropy,
        "overall_score": overall_score,
        "strength_category": category,
        "character_sets": {
            "lowercase": has_lower,
            "uppercase": has_upper,
            "digits": has_digit,
            "symbols": has_symbol
        },
        "pattern_findings": patterns,
        "weaknesses": weaknesses,
        "recommendations": recommendations
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PSTS Python Cybersecurity Engine",
        "argon2_available": HAS_ARGON2,
        "bcrypt_available": HAS_BCRYPT
    }


@app.post("/api/engine/password-strength")
def api_password_strength(req: PasswordEvalRequest):
    return evaluate_password_strength(req.password)


@app.post("/api/engine/hash-verify")
def api_hash_verify(req: HashVerifyRequest):
    start = time.perf_counter()
    algo = req.algorithm.upper()
    matched = False

    if algo == "MD5":
        raw = (req.salt + req.candidate if req.salt else req.candidate).encode("utf-8")
        digest = hashlib.md5(raw).hexdigest()
        matched = hmac.compare_digest(digest.lower(), req.sample_hash.lower())
    elif algo in ("SHA-1", "SHA1"):
        raw = (req.salt + req.candidate if req.salt else req.candidate).encode("utf-8")
        digest = hashlib.sha1(raw).hexdigest()
        matched = hmac.compare_digest(digest.lower(), req.sample_hash.lower())
    elif algo in ("SHA-256", "SHA256"):
        raw = (req.salt + req.candidate if req.salt else req.candidate).encode("utf-8")
        digest = hashlib.sha256(raw).hexdigest()
        matched = hmac.compare_digest(digest.lower(), req.sample_hash.lower())
    elif algo == "PBKDF2":
        salt_bytes = (req.salt or "psts_lab_salt").encode("utf-8")
        dk = hashlib.pbkdf2_hmac("sha256", req.candidate.encode("utf-8"), salt_bytes, 100000)
        matched = dk.hex().lower() in req.sample_hash.lower()
    elif algo == "BCRYPT" and HAS_BCRYPT:
        try:
            matched = bcrypt.checkpw(req.candidate.encode("utf-8"), req.sample_hash.encode("utf-8"))
        except ValueError:
            matched = False
    elif algo in ("ARGON2", "ARGON2ID") and HAS_ARGON2:
        ph = PasswordHasher()
        try:
            matched = ph.verify(req.sample_hash, req.candidate)
        except VerifyMismatchError:
            matched = False
        except Exception:
            matched = False
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported or unavailable algorithm: {req.algorithm}")

    elapsed_ms = round((time.perf_counter() - start) * 1000, 3)
    return {
        "verified": matched,
        "algorithm": req.algorithm,
        "execution_time_ms": elapsed_ms
    }


@app.post("/api/engine/benchmark")
def api_benchmark(req: BenchmarkRequest):
    sample_input = b"SyntheticBenchmarkPassword!2026"
    results = []

    for algo in req.algorithms:
        upper = algo.upper()
        t0 = time.perf_counter()
        if upper == "MD5":
            for _ in range(100):
                hashlib.md5(sample_input).hexdigest()
            elapsed = ((time.perf_counter() - t0) * 1000) / 100.0
            results.append({
                "algorithm": "MD5",
                "execution_time": round(max(elapsed, 0.002), 4),
                "memory_usage": 1,
                "suitability": "Unsuitable (Legacy Broken)",
                "security_rating": 5
            })
        elif upper in ("SHA-1", "SHA1"):
            for _ in range(100):
                hashlib.sha1(sample_input).hexdigest()
            elapsed = ((time.perf_counter() - t0) * 1000) / 100.0
            results.append({
                "algorithm": "SHA-1",
                "execution_time": round(max(elapsed, 0.003), 4),
                "memory_usage": 1,
                "suitability": "Unsuitable (Legacy Collision-Prone)",
                "security_rating": 10
            })
        elif upper in ("SHA-256", "SHA256"):
            for _ in range(100):
                hashlib.sha256(sample_input).hexdigest()
            elapsed = ((time.perf_counter() - t0) * 1000) / 100.0
            results.append({
                "algorithm": "SHA-256",
                "execution_time": round(max(elapsed, 0.005), 4),
                "memory_usage": 2,
                "suitability": "Unsuitable Alone (Fast General-Purpose)",
                "security_rating": 25
            })
        elif upper == "PBKDF2":
            hashlib.pbkdf2_hmac("sha256", sample_input, b"psts_benchmark_salt", req.pbkdf2_iterations)
            elapsed = (time.perf_counter() - t0) * 1000
            results.append({
                "algorithm": "PBKDF2",
                "execution_time": round(elapsed, 2),
                "memory_usage": 32,
                "suitability": "Acceptable (FIPS/Compliance Standard)",
                "security_rating": 76
            })
        elif upper == "BCRYPT" and HAS_BCRYPT:
            bcrypt.hashpw(sample_input, bcrypt.gensalt(rounds=min(max(req.bcrypt_rounds, 4), 14)))
            elapsed = (time.perf_counter() - t0) * 1000
            results.append({
                "algorithm": "bcrypt",
                "execution_time": round(elapsed, 2),
                "memory_usage": 4,
                "suitability": "Recommended (Proven Adaptive Hashing)",
                "security_rating": 86
            })
        elif upper in ("ARGON2ID", "ARGON2") and HAS_ARGON2:
            ph = PasswordHasher(
                time_cost=min(max(req.argon2_time_cost, 1), 6),
                memory_cost=min(max(req.argon2_memory_kb, 8192), 131072),
                parallelism=2,
                type=Type.ID
            )
            ph.hash("SyntheticBenchmarkPassword!2026")
            elapsed = (time.perf_counter() - t0) * 1000
            results.append({
                "algorithm": "Argon2id",
                "execution_time": round(elapsed, 2),
                "memory_usage": req.argon2_memory_kb,
                "suitability": "Preferred Modern Standard (Memory-Hard)",
                "security_rating": 98
            })

    return {"benchmarks": results}
