import amqp, { Channel } from "amqplib";
import { env } from "../config/env";

let channel: Channel | undefined;
let connection: amqp.Connection | undefined;

const connectRabbitMQ = async (): Promise<void> => {
  try {
    const amqpServer = env.RABBITMQ_URL;
    connection = await amqp.connect(amqpServer);

    connection.on("error", (err) => {
      console.error("❌ RabbitMQ Connection Error in Ambulance Service:", err);
    });

    connection.on("close", () => {
      console.warn("⚠️ RabbitMQ Connection closed in Ambulance Service. Retrying...");
      channel = undefined;
      connection = undefined;
      setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();
    console.log("🐰 Ambulance Service connected to RabbitMQ");
  } catch (error) {
    console.error("❌ RabbitMQ Initial Connection Error in Ambulance Service:", error);
    // Retry connection after 5 seconds
    setTimeout(connectRabbitMQ, 5000);
  }
};

connectRabbitMQ();

export const publishEvent = async (queue: string, eventType: string, data: any): Promise<void> => {
  try {
    if (!channel) {
      if (env.NODE_ENV === "development") {
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

    if (env.NODE_ENV === "development") {
      console.log(`📤 Published event '${eventType}' to queue '${queue}'`);
    }
  } catch (error) {
    console.error(`Failed to publish event ${eventType}:`, error);
  }
};
