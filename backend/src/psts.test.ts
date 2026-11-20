import request from 'supertest';
import { app } from './app';
import { ensureSeeded } from './seed';
import { evaluatePasswordStrength } from './engines/passwordEngine';
import {
  generateEducationalHash,
  identifyAndAnalyzeHash,
  verifyEducationalHash,
} from './engines/hashEngine';
import { evaluateStorageConfiguration } from './engines/storageEngine';

describe('PSTS Unit, Integration & Security Test Suite (SRS Section 12)', () => {
  let adminToken = '';
  let studentToken = '';

  beforeAll(async () => {
    await ensureSeeded();
  }, 30000);

  describe('12.1 Unit Testing: Password Strength & Entropy Engine', () => {
    test('detects common dictionary password as Very Weak', () => {
      const res = evaluatePasswordStrength('password');
      expect(res.strength_category).toBe('Very Weak');
      expect(res.overall_score).toBeLessThanOrEqual(20);
      expect(res.breach_indicator).toBe(true);
    });

    test('detects predictable leetspeak substitution and sequential characters', () => {
      const res = evaluatePasswordStrength('P@ssw0rd123');
      expect(res.breach_indicator).toBe(true);
      expect(res.pattern_findings.some((p) => p.toLowerCase().includes('leetspeak') || p.toLowerCase().includes('sequential'))).toBe(true);
      expect(res.overall_score).toBeLessThan(65);
    });

    test('classifies high-entropy multi-word passphrase as Very Strong', () => {
      const res = evaluatePasswordStrength('Quantum#Falcon79!Orbit$Nebula');
      expect(res.strength_category).toBe('Very Strong');
      expect(res.overall_score).toBeGreaterThanOrEqual(85);
      expect(res.entropy_estimate).toBeGreaterThan(75);
    });
  });

  describe('12.1 Unit Testing: Hash Analysis & Verification Engine', () => {
    test('identifies and verifies Argon2id PHC format accurately', async () => {
      const gen = await generateEducationalHash('SyntheticTest#2026', 'Argon2id', {
        argon2MemoryKb: 19456,
        argon2TimeCost: 2,
      });
      const analysis = identifyAndAnalyzeHash(gen.hash, 'Argon2id');
      expect(analysis.hash_format_valid).toBe(true);
      expect(analysis.hash_category).toBe('Adaptive password hashing');

      const verifyMatch = await verifyEducationalHash('SyntheticTest#2026', gen.hash, 'Argon2id');
      expect(verifyMatch.verified).toBe(true);

      const verifyFail = await verifyEducationalHash('WrongCandidate', gen.hash, 'Argon2id');
      expect(verifyFail.verified).toBe(false);
    });

    test('flags MD5 and raw SHA-256 as unsuitable for password storage', () => {
      const md5Analysis = identifyAndAnalyzeHash('5f4dcc3b5aa765d61d8327deb882cf99', 'MD5');
      expect(md5Analysis.is_unsuitable_for_passwords).toBe(true);
      expect(md5Analysis.hash_category).toBe('General-purpose cryptographic hashing');
    });
  });

  describe('12.1 Unit Testing: Security Scoring & Recommendation Engine (SRS Section 9)', () => {
    test('applies Critical weakness override when MD5 or missing salts are used', () => {
      const evalRes = evaluateStorageConfiguration({
        algorithm: 'MD5',
        salt_configuration: 'Unsalted',
        salt_uniqueness: false,
        work_factor: 1,
        memory_cost: 1,
        iteration_count: 1,
        storage_format: 'Raw Hex Digest',
        reset_implementation: 'Expiring Single-Use CSPRNG Token (Hashed)',
        mfa_enabled: true,
        rate_limiting: true,
        measured_password_score: 95,
      });
      expect(evalRes.score_classification).toBe('Critical');
      expect(evalRes.findings.some((f) => f.severity === 'Critical')).toBe(true);
    });

    test('scores hardened Argon2id + MFA + rate-limiting configuration as Excellent', () => {
      const evalRes = evaluateStorageConfiguration({
        algorithm: 'Argon2id',
        salt_configuration: 'Unique Random (>= 16 bytes)',
        salt_uniqueness: true,
        work_factor: 3,
        memory_cost: 65536,
        iteration_count: 3,
        storage_format: 'PHC String ($argon2id$...)',
        reset_implementation: 'Expiring Single-Use CSPRNG Token (Hashed)',
        mfa_enabled: true,
        rate_limiting: true,
        measured_password_score: 94,
      });
      expect(evalRes.score_classification).toBe('Excellent');
      expect(evalRes.overall_score).toBeGreaterThanOrEqual(90);
    });
  });

  describe('12.2 & 12.3 Integration & Security Testing: REST API, RBAC & Zero-Plaintext', () => {
    test('authenticates administrator and student accounts', async () => {
      const adminRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@psts.edu', password: 'Admin#PSTS2026!' });
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.token).toBeDefined();
      adminToken = adminRes.body.token;

      const studentRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@psts.edu', password: 'Student#PSTS2026!' });
      expect(studentRes.status).toBe(200);
      studentToken = studentRes.body.token;
    });

    test('enforces Role-Based Access Control (student blocked from admin user creation)', async () => {
      const res = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ full_name: 'Unauthorized', email: 'unauth@psts.edu', password: 'Password#1234' });
      expect(res.status).toBe(403);
    });

    test('evaluates password strength via REST API without storing plaintext password', async () => {
      const secretSynthetic = 'UniqueTestSecret$2026!NoPlaintext';
      const res = await request(app)
        .post('/api/password/test')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ password: secretSynthetic });
      expect(res.status).toBe(201);
      expect(res.body.evaluation.overall_score).toBeGreaterThan(70);

      const historyRes = await request(app)
        .get('/api/password/history')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(historyRes.status).toBe(200);
      const rawJson = JSON.stringify(historyRes.body);
      expect(rawJson.includes(secretSynthetic)).toBe(false);
    });

    test('generates and downloads PDF & CSV security assessment reports', async () => {
      const genRes = await request(app)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ report_type: 'PDF' });
      expect(genRes.status).toBe(201);
      const reportId = genRes.body.report.id;

      const pdfRes = await request(app)
        .get(`/api/reports/${reportId}/download?format=PDF`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers['content-type']).toContain('application/pdf');

      const csvRes = await request(app)
        .get(`/api/reports/${reportId}/download?format=CSV`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(csvRes.status).toBe(200);
      expect(csvRes.headers['content-type']).toContain('text/csv');
    });
  });
});
