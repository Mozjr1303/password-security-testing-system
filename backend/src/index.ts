import { app } from './app';
import { ensureSeeded } from './seed';

const PORT = Number(process.env.PORT || 4000);

async function startServer() {
  try {
    await ensureSeeded();
    app.listen(PORT, () => {
      console.log(`==================================================================`);
      console.log(`  PSTS Cybersecurity Backend API running on http://localhost:${PORT}`);
      console.log(`  Zero-Plaintext Policy: ENFORCED | Auth Hashing: Argon2id (PHC)  `);
      console.log(`==================================================================`);
    });
  } catch (err) {
    console.error('Failed to start PSTS server:', err);
    process.exit(1);
  }
}

startServer();
