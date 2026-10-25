import 'dotenv/config'; // must run first so DATABASE_URL etc. are set
import { createApp } from './app';

const PORT = Number(process.env.PORT) || 4000;

createApp().listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
