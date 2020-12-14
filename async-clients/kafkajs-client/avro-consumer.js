'use strict';

var fs = require('fs');
var avro = require('avro-js');
const { Kafka } = require('kafkajs')

var commandArgs = process.argv.slice(2);

const kafkaHost = commandArgs[0] || 'localhost:9092';
const kafkaTopic = commandArgs[1] || 'UsersignedupAvroAPI_0.1.2_user-signedup';
const KafkaCert = commandArgs[2] || null;

console.log("Connecting to " + kafkaHost + ' on topic ' + kafkaTopic);

var kafka = null;

// Initialize Kafka consumer with or without ssl depending on Cert presence.
if (KafkaCert != null) {
  kafka = new Kafka({
    clientId: 'my-app',
    brokers: [kafkaHost],
    ssl: {
      rejectUnauthorized: false,
      ca: [fs.readFileSync(KafkaCert, 'utf-8')]
    },
  });
} else {
  kafka = new Kafka({
    clientId: 'my-app',
    brokers: [kafkaHost]
  })
}

var userType = avro.parse('./user-signedup.avsc');
const consumer = kafka.consumer({ groupId: 'kafkajs-client' })

const run = async () => {
  await consumer.connect()
  await consumer.subscribe({ topic: kafkaTopic, fromBeginning: false })
  await consumer.run({
    autoCommit: false,
    eachMessage: async ({ topic, partition, message }) => {
      console.log(
        JSON.stringify(userType.fromBuffer(message.value), null, 2)
      );
    },
  });
}

run().catch(e => console.error(`[example/consumer] ${e.message}`, e))