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
                        hospitalName: data.hospitalName,
                        doctorName: data.doctorName,
                        roleId: data.roleId,
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
            } catch (error: any) {
                console.error("❌ Error processing DOCTOR_CREATED event:", error);

                // Determine error type: Business vs Infrastructure
                const isBusinessError = [
                    'SequelizeUniqueConstraintError',
                    'SequelizeValidationError',
                    'SequelizeForeignKeyConstraintError',
                ].includes(error?.name);

                if (isBusinessError) {
                    // ===== BUSINESS ERROR (e.g. duplicate phone/email) =====
                    // Data is invalid — rollback the pending doctor
                    console.log(`⚠️ Business error detected: ${error?.name}. Triggering rollback...`);
                    try {
                        const data = JSON.parse(msg.content.toString());
                        if (data && data.doctorId && data.hospitalId) {
                            await publishEvent('doctor_events', 'AUTH_FAILED', {
                                doctorId: data.doctorId,
                                hospitalId: data.hospitalId,
                                reason: error?.errors?.[0]?.message || error?.message || 'Unknown business error'
                            });
                            console.log(`🔙 Published AUTH_FAILED event for Doctor ID: ${data.doctorId}`);
                        }
                    } catch (publishError) {
                        console.error("❌ Failed to publish AUTH_FAILED event:", publishError);
                    }
                    // Ack — remove from queue, rollback was triggered
                    channel.ack(msg);
                } else {
                    // ===== INFRASTRUCTURE ERROR (e.g. DB down, connection refused) =====
                    // Data is valid — keep the message in RabbitMQ for retry
                    console.log(`🔄 Infrastructure error detected. Nacking message for retry...`);
                    // nack(msg, allUpTo=false, requeue=true) — requeue so RabbitMQ retries later
                    channel.nack(msg, false, true);
                }
            }
        }
    });

    // ===================== STAFF CREATED CONSUMER =====================
    // Queue for staff creation (mirrors doctor creation flow)
    const staffQueue = await channel.assertQueue('auth_staff_creation_queue', { durable: true });
    await channel.bindQueue(staffQueue.queue, exchange, 'STAFF_CREATED');

    channel.consume(staffQueue.queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log("📨 Auth Service received STAFF_CREATED event:", data);

                // 1. Idempotency Check: Did we already create this Auth record?
                const existingAuth = await Auth.findOne({ where: { email: data.email, role: 'staff' } });

                if (!existingAuth) {
                    // 2. Create Auth Record
                    await Auth.create({
                        email: data.email,
                        password: data.password,
                        role: 'staff',
                        staffId: data.staffId,
                        hospitalId: data.hospitalId,
                        phone: data.phone,
                        hospitalName: data.hospitalName,
                        staffName: data.staffName,
                        roleId: data.roleId,
                    });
                    console.log(`✅ Auth record created for Staff ID: ${data.staffId}`);
                } else {
                    console.log(`ℹ️ Auth record already exists for Staff ID: ${data.staffId}, skipping creation.`);
                }

                // 3. Publish AUTH_CREATED event back to staff-service
                await publishEvent('staff_events', 'AUTH_CREATED', {
                    staffId: data.staffId,
                    hospitalId: data.hospitalId
                });

                // 4. Acknowledge message processing successfully
                channel.ack(msg);
            } catch (error: any) {
                console.error("❌ Error processing STAFF_CREATED event:", error);

                // Determine error type: Business vs Infrastructure
                const isBusinessError = [
                    'SequelizeUniqueConstraintError',
                    'SequelizeValidationError',
                    'SequelizeForeignKeyConstraintError',
                ].includes(error?.name);

                if (isBusinessError) {
                    // ===== BUSINESS ERROR (e.g. duplicate phone/email) =====
                    console.log(`⚠️ Business error detected: ${error?.name}. Triggering rollback...`);
                    try {
                        const data = JSON.parse(msg.content.toString());
                        if (data && data.staffId && data.hospitalId) {
                            await publishEvent('staff_events', 'AUTH_FAILED', {
                                staffId: data.staffId,
                                hospitalId: data.hospitalId,
                                reason: error?.errors?.[0]?.message || error?.message || 'Unknown business error'
                            });
                            console.log(`🔙 Published AUTH_FAILED event for Staff ID: ${data.staffId}`);
                        }
                    } catch (publishError) {
                        console.error("❌ Failed to publish AUTH_FAILED event:", publishError);
                    }
                    // Ack — remove from queue, rollback was triggered
                    channel.ack(msg);
                } else {
                    // ===== INFRASTRUCTURE ERROR (e.g. DB down, connection refused) =====
                    console.log(`🔄 Infrastructure error detected. Nacking message for retry...`);
                    channel.nack(msg, false, true);
                }
            }
        }
    });

    // ===================== HOSPITAL CREATED CONSUMER =====================
    // Queue for hospital creation (mirrors doctor/staff creation flow)
    const hospitalQueue = await channel.assertQueue('auth_hospital_creation_queue', { durable: true });
    await channel.bindQueue(hospitalQueue.queue, exchange, 'HOSPITAL_CREATED');

    channel.consume(hospitalQueue.queue, async (msg) => {
        if (msg !== null) {
            try {
                const data = JSON.parse(msg.content.toString());
                console.log("📨 Auth Service received HOSPITAL_CREATED event:", data);

                // 1. Idempotency Check: Did we already create this Auth record?
                const existingAuth = await Auth.findOne({ where: { hospitalId: data.hospitalId, role: 'hospital' } });

                if (!existingAuth) {
                    // 2. Create Auth Record
                    await Auth.create({
                        email: data.email,
                        password: data.password,
                        role: 'hospital',
                        hospitalId: data.hospitalId,
                        phone: data.phone,
                        hospitalName: data.hospitalName,
                        roleId: data.roleId,
                    });
                    console.log(`✅ Auth record created for Hospital ID: ${data.hospitalId}`);
                } else {
                    console.log(`ℹ️ Auth record already exists for Hospital ID: ${data.hospitalId}, skipping creation.`);
                }

                // 3. Publish AUTH_CREATED event back to hospital-service
                await publishEvent('hospital_events', 'AUTH_CREATED', {
                    hospitalId: data.hospitalId,
                });

                // 4. Acknowledge message processing successfully
                channel.ack(msg);
            } catch (error: any) {
                console.error("❌ Error processing HOSPITAL_CREATED event:", error);

                // Determine error type: Business vs Infrastructure
                const isBusinessError = [
                    'SequelizeUniqueConstraintError',
                    'SequelizeValidationError',
                    'SequelizeForeignKeyConstraintError',
                ].includes(error?.name);

                if (isBusinessError) {
                    // ===== BUSINESS ERROR (e.g. duplicate phone/email) =====
                    console.log(`⚠️ Business error detected: ${error?.name}. Triggering rollback...`);
                    try {
                        const data = JSON.parse(msg.content.toString());
                        if (data && data.hospitalId) {
                            await publishEvent('hospital_events', 'AUTH_FAILED', {
                                hospitalId: data.hospitalId,
                                reason: error?.errors?.[0]?.message || error?.message || 'Unknown business error'
                            });
                            console.log(`🔙 Published AUTH_FAILED event for Hospital ID: ${data.hospitalId}`);
                        }
                    } catch (publishError) {
                        console.error("❌ Failed to publish AUTH_FAILED event:", publishError);
                    }
                    // Ack — remove from queue, rollback was triggered
                    channel.ack(msg);
                } else {
                    // ===== INFRASTRUCTURE ERROR (e.g. DB down, connection refused) =====
                    console.log(`🔄 Infrastructure error detected. Nacking message for retry...`);
                    channel.nack(msg, false, true);
                }
            }
        }
    });
};
