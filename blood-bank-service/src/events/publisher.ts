import amqp from 'amqplib';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        if (!env.RABBITMQ_URL) {
            logger.warn('⚠️ RABBITMQ_URL not defined. Event publishing disabled.');
            return;
        }
        const connection = await amqp.connect(env.RABBITMQ_URL);
        channel = await connection.createChannel();
        logger.info('🐰 Blood Bank Service connected to RabbitMQ');
    } catch (error) {
        logger.error('❌ RabbitMQ Connection Error:', error);
    }
};

export const publishEvent = async (exchange: string, routingKey: string, data: any) => {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }
        if (channel) {
            await channel.assertExchange(exchange, 'direct', { durable: true });
            channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), { persistent: true });
            logger.info(`📤 Published event '${routingKey}' to exchange '${exchange}'`);
        }
    } catch (error) {
        logger.error('❌ Event Publish Error:', error);
    }
};
