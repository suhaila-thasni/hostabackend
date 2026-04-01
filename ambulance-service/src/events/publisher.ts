import amqp, { Channel } from "amqplib";
import dotenv from "dotenv";

dotenv.config();

// Validate RabbitMQ URL
if (!process.env.RABBITMQ_URL) {
  throw new Error("❌ RABBITMQ_URL environment variable is required");
}

let channel: Channel | undefined;

const connectRabbitMQ = async (): Promise<void> => {
  try {
    const amqpServer = process.env.RABBITMQ_URL!;
    const connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();

    if (process.env.NODE_ENV === "development") {
      console.log("🐰 Ambulance Service connected to RabbitMQ");
    }
  } catch (error) {
    console.error("❌ RabbitMQ Connection Error in Ambulance Service:", error);
    // Retry connection after 5 seconds
    setTimeout(connectRabbitMQ, 5000);
  }
};

connectRabbitMQ();

export const publishEvent = async (queue: string, eventType: string, data: any): Promise<void> => {
  try {
    if (!channel) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Channel not established. Cannot publish event ${eventType} to ${queue}`);
      }
      return;
    }

    await channel.assertQueue(queue, { durable: true });

    const message = {
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

    if (process.env.NODE_ENV === "development") {
      console.log(`📤 Published event '${eventType}' to queue '${queue}'`);
    }
  } catch (error) {
    console.error(`Failed to publish event ${eventType}:`, error);
  }
};
