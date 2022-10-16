/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import * as express from 'express';

dotenv.config();

console.log('process.env', process.env);

// this is a work around since .env was not working
const app = express();

app.use(cors());
app.use(express.json());

const port = +process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
