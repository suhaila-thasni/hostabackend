// import amqp, { Channel } from "amqplib";
// import { env } from "../config/env";
// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();

// let channel: Channel | undefined;
// let connection: any;

// const connectRabbitMQ = async (): Promise<void> => {
//   try {
//     const amqpServer = env.RABBITMQ_URL;
//     connection = await amqp.connect(amqpServer);

//     connection.on("error", (err) => {
//       console.error("❌ RabbitMQ Connection Error in Ambulance Service:", err);
//     });

//     connection.on("close", () => {
//       console.warn("⚠️ RabbitMQ Connection closed in Ambulance Service. Retrying...");
//       channel = undefined;
//       connection = undefined;
//       setTimeout(connectRabbitMQ, 5000);
//     });

//     channel = await connection.createChannel();
//     console.log("🐰 Ambulance Service connected to RabbitMQ");
//   } catch (error) {
//     console.error("❌ RabbitMQ Initial Connection Error in Ambulance Service:", error);
//     // Retry connection after 5 seconds
//     setTimeout(connectRabbitMQ, 5000);
//   }
// };

// connectRabbitMQ();

// export const publishEvent = async (queue: string, routingKey: string, data: any): Promise<void> => {
//   try {
//     if (!channel) {
//       if (env.NODE_ENV === "development") {
//         console.warn(`Channel not established. Cannot publish event ${routingKey} to ${queue}`);
//       }
//       return;
//     }

//     await channel.assertQueue(queue, { durable: true });

//     const message = {
//       routingKey,
//       data,
//       timestamp: new Date().toISOString()
//     };

//     channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));


//     if (env.NODE_ENV === "development") {
//       console.log(`📤 Published event '${routingKey}' to queue '${queue}'`);
//     }

//          await axios.post(`${process.env.SOCKETIO_SERVICE_URL}/emit-event`, {
//             event: routingKey,
//             userId : null,
//             data
//         });


//   } catch (error) {
//     console.error(`Failed to publish event ${routingKey}:`, error);
//   }
// };




import amqp, { Channel } from "amqplib";
import { env } from "../config/env";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

let channel: Channel | undefined;
let connection: any;

export const connectRabbitMQ = async (): Promise<void> => {
  const amqpServer = env.RABBITMQ_URL;
  connection = await amqp.connect(amqpServer);

  connection.on("error", (err: any) => {
    console.error("❌ RabbitMQ Connection Error in Ambulance Service:", err);
  });

  connection.on("close", () => {
    console.warn("⚠️ RabbitMQ Connection closed in Ambulance Service.");
    channel = undefined;
    connection = undefined;
  });

  channel = await connection.createChannel();
  console.log("🐰 Ambulance Service connected to RabbitMQ");
};

export const publishEvent = async (queue: string, routingKey: string, data: any): Promise<void> => {
  try {
    if (!channel) {
      if (env.NODE_ENV === "development") {
        console.warn(`Channel not established. Cannot publish event ${routingKey} to ${queue}`);
      }
      return;
    }

    await channel.assertQueue(queue, { durable: true });

    const message = {
      routingKey,
      data,
      timestamp: new Date().toISOString()
    };

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));

    if (env.NODE_ENV === "development") {
      console.log(`📤 Published event '${routingKey}' to queue '${queue}'`);
    }

    await axios.post(`${process.env.SOCKETIO_SERVICE_URL}/emit-event`, {
      event: routingKey,
      userId: null,
      data
    });

  } catch (error) {
    console.error(`Failed to publish event ${routingKey}:`, error);
  }
};