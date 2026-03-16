import { buildApp } from './app';
import { logger } from '../../../src/core/logger';

const port = Number(process.env.POS_API_PORT ?? 3099);
const app = buildApp();

app.listen(port, () => {
  logger.info({ port }, `POS API listening on :${port}`);
});
