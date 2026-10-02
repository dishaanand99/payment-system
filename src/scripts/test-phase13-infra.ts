import fs from 'fs';
import path from 'path';

async function testPhase13() {
  console.log('--- Phase 13 Infrastructure & Deployment Tests ---');

  try {
    // 1. Verify health check route exists
    const healthRoutePath = path.join(process.cwd(), 'src', 'app', 'api', 'health', 'route.ts');
    if (!fs.existsSync(healthRoutePath)) {
      throw new Error('Health check route missing');
    }
    console.log('[TEST 1 PASS] Health check endpoint exists');

    // 2. Verify gitignore is safe
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignore.includes('*.db') && !gitignore.includes('*.sqlite')) {
      throw new Error('SQLite DBs not ignored in gitignore');
    }
    if (!gitignore.includes('/storage/')) {
      throw new Error('Storage directory not ignored in gitignore');
    }
    console.log('[TEST 2 PASS] .gitignore protects DB and uploads');

    // 3. Verify .env.example exists
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      throw new Error('.env.example missing');
    }
    console.log('[TEST 3 PASS] .env.example template exists');

    // 4. Verify deployment documentation
    const deployDocPath = path.join(process.cwd(), 'docs', 'PRODUCTION_DEPLOYMENT.md');
    if (!fs.existsSync(deployDocPath)) {
      throw new Error('PRODUCTION_DEPLOYMENT.md missing');
    }
    console.log('[TEST 4 PASS] Deployment documentation exists');

    // 5. Verify next.config.ts has headers
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    if (!nextConfig.includes('Strict-Transport-Security') || !nextConfig.includes('X-Frame-Options')) {
        throw new Error('Security headers missing in next.config.ts');
    }
    console.log('[TEST 5 PASS] next.config.ts implements strict security headers');
    
    // Simulate health check directly
    const { GET } = await import('../app/api/health/route');
    const res = await GET();
    if (res.status !== 200) {
        throw new Error('Health check failed to return 200');
    }
    const data = await res.json();
    if (data.status !== 'ok') {
        throw new Error('Health check returned invalid format');
    }
    console.log('[TEST 6 PASS] Health check responds correctly');

    console.log('--- End of Phase 13 Tests ---');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

testPhase13();
