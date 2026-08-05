import { startVitest } from 'vitest/node';

try {
const result = await startVitest('test', [], {
    config: './vitest.debug.config.mts',
    run: true,
    passWithNoTests: true,
  });
  console.log('result:', result);
} catch (e) {
  console.error('ERROR:', e);
  console.error('STACK:', e.stack);
  process.exit(1);
}
