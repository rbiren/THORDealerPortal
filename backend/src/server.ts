import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import dealerRoutes from './routes/dealers';
import technicianRoutes from './routes/technicians';
import claimsRoutes from './routes/claims';
import repositoryRoutes from './routes/repository';
import ordersRoutes from './routes/orders';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'THOR Dealer Portal API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api/repository', repositoryRoutes);
app.use('/api/orders', ordersRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
