import app from './app';
import sequelize from './config/db';
import dotenv from 'dotenv';
import { connectRabbitMQ } from './events/publisher';
import { connectRabbitMQConsumer } from './events/consumer';

dotenv.config();

const PORT = process.env.PORT || 5007;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // In production, you might want to use migrations instead of sync
    await sequelize.sync({ alter: true }); 
    console.log('Database synced.');

    // Connect RabbitMQ publisher & consumer
    await connectRabbitMQ();
    await connectRabbitMQConsumer();
    console.log('🐰 Auth Service RabbitMQ initialized');

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

