import { buildApp } from './app';

const port = Number(process.env.POS_API_PORT ?? 3099);
const app = buildApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`POS API listening on :${port}`);
});
