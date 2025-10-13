import express from 'express';
import { router } from './routes.js';
import { paymentsRouter } from './payments.js';
const app = express();
app.use(express.json());
app.use('/api', router);
app.use('/api', paymentsRouter);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
