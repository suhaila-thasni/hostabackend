
import amqp from 'amqplib';
import { env } from '../config/env';

let channel: amqp.Channel;
let connection: amqp.Connection;

export const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(env.RABBITMQ_URL);

        connection.on('error', (err) => {
            console.error('❌ Lab Service RabbitMQ Connection Error:', err);
        });

        connection.on('close', () => {
            console.warn('⚠️ Lab Service RabbitMQ Connection closed. Retrying...');
            channel = null as any;
            setTimeout(connectRabbitMQ, 5000);
        });

        channel = await connection.createChannel();
        console.log('🐰 Lab Service connected to RabbitMQ');
    } catch (error) {
        console.error('❌ Lab Service RabbitMQ Error:', error);
        setTimeout(connectRabbitMQ, 5000);
    }
};

export const publishEvent = async (exchange: string, routingKey: string, data: any) => {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }
        await channel.assertExchange(exchange, 'direct', { durable: true });
        channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(data)), { persistent: true });
        console.log(`📤 Published event '${routingKey}' to exchange '${exchange}'`);
    } catch (error) {
        console.error('❌ Event Publish Error:', error);
    }
};
