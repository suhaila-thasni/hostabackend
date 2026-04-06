import amqp from 'amqplib';
import { env } from '../config/env';
import BloodDonor from '../models/bloodDonor.model';

export const startSubscriber = async () => {
    try {
        const connection = await amqp.connect(env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const exchange = 'user_events';
        
        await channel.assertExchange(exchange, 'direct', { durable: true });
        
        // Assert a queue specifically for blood service user events
        const q = await channel.assertQueue('blood_service_user_events_queue', { exclusive: false });
        
        console.log(" [*] Waiting for events in %s. To exit press CTRL+C", q.queue);
        
        // Bind the queue to the routing key 'user.deleted'
        await channel.bindQueue(q.queue, exchange, 'user.deleted');

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                console.log(` [x] Received user.deleted event for userId: ${data.userId}`);
                
                try {
                    // Automatically soft delete blood donor profile when user is deleted
                    await BloodDonor.destroy({ where: { userId: data.userId } });
                    console.log(` [✓] Successfully removed blood donor profile for userId: ${data.userId}`);
                } catch (err) {
                    console.error(" [!] Failed to process user.deleted event:", err);
                }

                // Acknowledge the message
                channel.ack(msg);
            }
        }, { noAck: false });

    } catch (error) {
        console.error('❌ RabbitMQ Subscriber Error:', error);
    }
};
