import amqp from 'amqplib';
import { env } from '../config/env';
import Doctor from '../models/doctor.model';

let channel: amqp.Channel;
let connection: any;

export const connectRabbitMQConsumer = async () => {
    let connected = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!connected && attempts < maxAttempts) {
        try {
            connection = await amqp.connect(env.RABBITMQ_URL);

            connection.on('error', (err: any) => {
                console.error('❌ Doctor Service RabbitMQ Consumer Error:', err);
            });

            connection.on('close', () => {
                console.warn('⚠️ Doctor Service RabbitMQ Consumer closed. Retrying...');
                channel = null as any;
                setTimeout(connectRabbitMQConsumer, 5000);
            });

            channel = await connection.createChannel();
            console.log('🐰 Doctor Service connected to RabbitMQ (Consumer)');
            connected = true;

            await startConsumers();

        } catch (error) {
            attempts++;
            console.error(`❌ RabbitMQ Consumer Connection attempt ${attempts} failed:`, error instanceof Error ? error.message : error);
            if (attempts < maxAttempts) {
                console.log("Retrying in 5 seconds...");
                await new Promise((resolve) => setTimeout(resolve, 5000));
            } else {
                console.error("Max RabbitMQ consumer connection attempts reached.");
            }
        }
    }
};

const startConsumers = async () => {
    if (!channel) return;

    const exchange = 'doctor_events';
    await channel.assertExchange(exchange, 'direct', { durable: true });

    // Listen for AUTH_CREATED events from Auth Service
    const authQueue = await channel.assertQueue('doctor_auth_created_queue', { durable: true });
    await channel.bindQueue(authQueue.queue, exchange, 'AUTH_CREATED');

    channel.consume(authQueue.queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log("📨 Doctor Service received AUTH_CREATED event:", data);

                // Update Doctor status from PENDING to ACTIVE
                const [affectedCount] = await Doctor.update(
                    { status: 'ACTIVE' },
                    { where: { id: data.doctorId, hospitalId: data.hospitalId } }
                );

                if (affectedCount > 0) {
                    console.log(`✅ Doctor ID ${data.doctorId} status updated to ACTIVE`);
                } else {
                    console.warn(`⚠️ Doctor ID ${data.doctorId} not found for status update`);
                }

                // Acknowledge message
                channel.ack(msg);
            } catch (error) {
                console.error("❌ Error processing AUTH_CREATED event:", error);
                // Nack - don't requeue to avoid infinite loop, send to DLQ
                channel.nack(msg, false, false);
            }
        }
    });

    // Listen for AUTH_FAILED events from Auth Service (Compensating Transaction)
    const authFailedQueue = await channel.assertQueue('doctor_auth_failed_queue', { durable: true });
    await channel.bindQueue(authFailedQueue.queue, exchange, 'AUTH_FAILED');

    channel.consume(authFailedQueue.queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log("📨 Doctor Service received AUTH_FAILED event:", data);

                // Rollback: Delete the stuck PENDING Doctor record
                const deletedCount = await Doctor.destroy({
                    where: { id: data.doctorId, hospitalId: data.hospitalId, status: 'PENDING' }
                });

                if (deletedCount > 0) {
                    console.log(`✅ Rolled back: Doctor ID ${data.doctorId} deleted successfully`);
                } else {
                    console.warn(`⚠️ Rollback warning: Doctor ID ${data.doctorId} not found or not in PENDING state`);
                }

                channel.ack(msg);
            } catch (error) {
                console.error("❌ Error processing AUTH_FAILED event:", error);
                channel.nack(msg, false, false);
            }
        }
    });

    console.log("🎧 Doctor Service listening for AUTH_CREATED events");
};
