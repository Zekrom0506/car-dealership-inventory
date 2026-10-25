import { spawn } from 'child_process';
import path from 'path';

const backendDir = path.resolve(__dirname, '../..');
const tsx = path.join(backendDir, 'node_modules', '.bin', 'tsx');

/**
 * Starts `src/server.ts` as a real separate process with exactly the given environment.
 * DOTENV_CONFIG_PATH=/dev/null stops dotenv from reading the real .env file.
 * Resolves when the process exits, or kills it once it prints "API listening".
 */
function startServer(env: Record<string, string>): Promise<{ exitCode: number | null; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(tsx, ['src/server.ts'], {
      cwd: backendDir,
      env: { PATH: process.env.PATH ?? '', DOTENV_CONFIG_PATH: '/dev/null', ...env },
    });
    let output = '';
    const collect = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.includes('API listening')) child.kill();
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    const timer = setTimeout(() => child.kill(), 10_000);
    child.on('exit', (exitCode) => {
      clearTimeout(timer);
      resolve({ exitCode, output });
    });
  });
}

const completeEnv = { JWT_SECRET: 'a-secret', DATABASE_URL: 'postgresql://localhost/db', PORT: '4999' };

describe('server startup', () => {
  it('refuses to start (exit code 1) and says why when JWT_SECRET is missing', async () => {
    const { JWT_SECRET: _omitted, ...withoutSecret } = completeEnv;

    const { exitCode, output } = await startServer(withoutSecret);

    expect(output).toContain('Missing required environment variable: JWT_SECRET');
    expect(exitCode).toBe(1);
    expect(output).not.toContain('API listening');
  }, 15_000);

  it('starts normally when the required variables are set', async () => {
    const { output } = await startServer(completeEnv);

    expect(output).toContain('API listening on http://localhost:4999');
  }, 15_000);
});
