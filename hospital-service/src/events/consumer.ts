import amqp from 'amqplib';
import { env } from '../config/env';
import Hospital from '../models/hospital.model';

let channel: amqp.Channel;
let connection: any;

// export const connectRabbitMQConsumer = async () => {
//     let connected = false;
//     let attempts = 0;
//     const maxAttempts = 5;

//     while (!connected && attempts < maxAttempts) {
//         try {
//             connection = await amqp.connect(env.RABBITMQ_URL);

//             connection.on('error', (err: any) => {
//                 console.error('❌ Hospital Service RabbitMQ Consumer Error:', err);
//             });

//             connection.on('close', () => {
//                 console.warn('⚠️ Hospital Service RabbitMQ Consumer closed. Retrying...');
//                 channel = null as any;
//                 setTimeout(connectRabbitMQConsumer, 5000);
//             });

//             channel = await connection.createChannel();
//             console.log('🐰 Hospital Service connected to RabbitMQ (Consumer)');
//             connected = true;

//             await startConsumers();

//         } catch (error) {
//             attempts++;
//             console.error(`❌ RabbitMQ Consumer Connection attempt ${attempts} failed:`, error instanceof Error ? error.message : error);
//             if (attempts < maxAttempts) {
//                 console.log("Retrying in 5 seconds...");
//                 await new Promise((resolve) => setTimeout(resolve, 5000));
//             } else {
//                 console.error("Max RabbitMQ consumer connection attempts reached.");
//             }
//         }
//     }
// };
export const connectRabbitMQConsumer = async () => {
    while (true) {
        try {
            connection = await amqp.connect(env.RABBITMQ_URL);

            connection.on("error", (err: any) => {
                console.error("❌ Hospital Service RabbitMQ Consumer Error:", err);
            });

            connection.on("close", () => {
                console.warn("⚠️ Hospital Service RabbitMQ Consumer closed. Reconnecting...");
                channel = null as any;

                // Restart consumer
                setTimeout(() => {
                    connectRabbitMQConsumer();
                }, 5000);
            });

            channel = await connection.createChannel();

            console.log("🐰 Hospital Service connected to RabbitMQ (Consumer)");

            await startConsumers();

            // Exit retry loop after successful connection
            break;

        } catch (error) {
            console.error(
                "❌ RabbitMQ Consumer Connection failed:",
                error instanceof Error ? error.message : error
            );

            console.log("Retrying in 5 seconds...");
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
};
const startConsumers = async () => {
    if (!channel) return;

    const exchange = 'hospital_events';
    await channel.assertExchange(exchange, 'direct', { durable: true });

    // Listen for AUTH_CREATED events from Auth Service
    const authQueue = await channel.assertQueue('hospital_auth_created_queue', { durable: true });
    await channel.bindQueue(authQueue.queue, exchange, 'AUTH_CREATED');

    channel.consume(authQueue.queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log("📨 Hospital Service received AUTH_CREATED event:", data);

                // Update Hospital status from PENDING to ACTIVE
                const [affectedCount] = await Hospital.update(
                    { status: 'ACTIVE' },
                    { where: { id: data.hospitalId } }
                );

                if (affectedCount > 0) {
                    console.log(`✅ Hospital ID ${data.hospitalId} status updated to ACTIVE`);
                } else {
                    console.warn(`⚠️ Hospital ID ${data.hospitalId} not found for status update`);
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
    const authFailedQueue = await channel.assertQueue('hospital_auth_failed_queue', { durable: true });
    await channel.bindQueue(authFailedQueue.queue, exchange, 'AUTH_FAILED');

    channel.consume(authFailedQueue.queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log("📨 Hospital Service received AUTH_FAILED event:", data);

                // Rollback: Delete the stuck PENDING Hospital record
                const deletedCount = await Hospital.destroy({
                    where: { id: data.hospitalId, status: 'PENDING' }
                });

                if (deletedCount > 0) {
                    console.log(`✅ Rolled back: Hospital ID ${data.hospitalId} deleted successfully`);
                } else {
                    console.warn(`⚠️ Rollback warning: Hospital ID ${data.hospitalId} not found or not in PENDING state`);
                }

                channel.ack(msg);
            } catch (error) {
                console.error("❌ Error processing AUTH_FAILED event:", error);
                channel.nack(msg, false, false);
            }
        }
    });

    console.log("🎧 Hospital Service listening for AUTH_CREATED and AUTH_FAILED events");
};
