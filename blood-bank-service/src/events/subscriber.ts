import amqp from 'amqplib';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const startSubscriber = async () => {
    try {
        if (!env.RABBITMQ_URL) {
            logger.warn('⚠️ RABBITMQ_URL not defined. Subscriber disabled.');
            return;
        }

        const connection = await amqp.connect(env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const exchange = 'user_events'; // Listening to core user events
        
        await channel.assertExchange(exchange, 'direct', { durable: true });
        
        // Assert a queue specifically for blood bank service
        const q = await channel.assertQueue('blood_bank_events_queue', { exclusive: false });
        
        logger.info(` [*] Blood Bank Service waiting for events in ${q.queue}`);
        
        // Example binding: Listening for user deletions
        await channel.bindQueue(q.queue, exchange, 'user.deleted');

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                logger.info(` [x] Received event for processing in Blood Bank: ${msg.fields.routingKey}`, { data });
                
                // TODO: Add logic to update blood inventory if necessary
                
                // Acknowledge the message
                channel.ack(msg);
            }
        }, { noAck: false });

    } catch (error) {
        logger.error('❌ RabbitMQ Subscriber Error:', error);
    }
};
