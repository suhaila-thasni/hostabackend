import amqp from 'amqplib';
import { env } from '../config/env';
import Auth from '../models/auth.model';
import { publishEvent } from './publisher';

let channel: amqp.Channel;
let connection: any;

export const connectRabbitMQConsumer = async () => {
    let connected = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!connected && attempts < maxAttempts) {
        try {
            connection = await amqp.connect(env.RABBITMQ_URL || process.env.RABBITMQ_URL || "amqp://localhost");

            connection.on('error', (err: any) => {
                console.error('❌ Auth Service RabbitMQ Consumer Error:', err);
            });

            connection.on('close', () => {
                console.warn('⚠️ Auth Service RabbitMQ Consumer closed. Retrying...');
                channel = null as any;
                setTimeout(connectRabbitMQConsumer, 5000);
            });

            channel = await connection.createChannel();
            console.log('🐰 Auth Service connected to RabbitMQ (Consumer)');
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

    const exchange = 'auth_events';
    await channel.assertExchange(exchange, 'direct', { durable: true });

    // Queue for doctor creation
    const doctorQueue = await channel.assertQueue('auth_doctor_creation_queue', { durable: true });
    await channel.bindQueue(doctorQueue.queue, exchange, 'DOCTOR_CREATED');

    channel.consume(doctorQueue.queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log("📨 Auth Service received DOCTOR_CREATED event:", data);

                // 1. Idempotency Check: Did we already create this Auth record?
                const existingAuth = await Auth.findOne({ where: { email: data.email, role: 'doctor' } });

                if (!existingAuth) {
                    // 2. Create Auth Record
                    await Auth.create({
                        email: data.email,
                        password: data.password, 
                        role: 'doctor',
                        doctorId: data.doctorId,
                        hospitalId: data.hospitalId,
                        phone: data.phone,
                    });
                    console.log(`✅ Auth record created for Doctor ID: ${data.doctorId}`);
                } else {
                    console.log(`ℹ️ Auth record already exists for Doctor ID: ${data.doctorId}, skipping creation.`);
                }

                // 3. Publish AUTH_CREATED event back to doctor-service
                await publishEvent('doctor_events', 'AUTH_CREATED', {
                    doctorId: data.doctorId,
                    hospitalId: data.hospitalId
                });

                // 4. Acknowledge message processing successfully
                channel.ack(msg);
            } catch (error) {
                console.error("❌ Error processing DOCTOR_CREATED event:", error);
                // Nack the message to put it back in queue or DLQ
                channel.nack(msg, false, false);
            }
        }
    });
};
