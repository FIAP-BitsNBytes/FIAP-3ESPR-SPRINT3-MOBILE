#!/usr/bin/env node

/**
 * IoT SmartBottle MQTT Simulator
 *
 * Simulates a Paho MQTT client connecting to a broker and publishing
 * hydration data (volume drunk) at periodic intervals.
 *
 * Usage:
 *   node simulator.js [--broker <url>] [--topic <topic>] [--patient-id <uuid>]
 *
 * Defaults:
 *   Broker: mqtt://test.mosquitto.org:8080
 *   Topic: nutriapp/bottles/{bottleId}/hydration
 *   Patient ID: generated UUID
 *   Interval: 5-10 seconds
 */

const mqtt = require("paho-mqtt");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Parse command-line arguments
const args = process.argv.slice(2);
const brokerUrl =
  args.includes("--broker")
    ? args[args.indexOf("--broker") + 1]
    : "mqtt://test.mosquitto.org:8080";
const baseTopic =
  args.includes("--topic")
    ? args[args.indexOf("--topic") + 1]
    : "nutriapp/bottles";
const patientId =
  args.includes("--patient-id") && args.indexOf("--patient-id") + 1 < args.length
    ? args[args.indexOf("--patient-id") + 1]
    : crypto.randomUUID();

// Generate a unique bottle MAC address
const bottleMacAddress = Array.from(
  { length: 6 },
  () => Math.floor(Math.random() * 255).toString(16).padStart(2, "0")
).join(":");

// Configuration
const clientId = `nutriapp-simulator-${Date.now()}`;
const topicPath = `${baseTopic}/${bottleMacAddress.replace(/:/g, "-")}/data`;

// State
let client = null;
let isConnected = false;
let messageCount = 0;
const startTime = Date.now();

// Hydration event simulator
function generateHydrationEvent() {
  const baseHydration = 50 + Math.random() * 200; // 50-250ml per sip
  const variance = baseHydration * (Math.random() * 0.1 - 0.05); // ±5% variance
  const hydrationMl = Math.round((baseHydration + variance) * 100) / 100;

  return {
    timestamp: new Date().toISOString(),
    bottle_mac: bottleMacAddress,
    patient_id: patientId,
    hydration_ml: hydrationMl,
    battery_level: Math.max(20, 100 - Math.floor((Date.now() - startTime) / 3600000)), // Simulate battery drain
    signal_strength: -40 - Math.floor(Math.random() * 40), // RSSI in dBm, -40 to -80
    source: "mqtt",
  };
}

// Connect to MQTT broker
function connect() {
  console.log(`[${new Date().toISOString()}] Connecting to ${brokerUrl}...`);

  client = new mqtt.Client(brokerUrl, clientId);

  client.onConnectionLost = (responseObject) => {
    isConnected = false;
    if (responseObject.errorCode !== 0) {
      console.error(`[ERROR] Connection lost: ${responseObject.errorMessage}`);
    }
  };

  client.onMessageArrived = (message) => {
    console.log(
      `[${new Date().toISOString()}] Message received on ${message.destinationName}:`
    );
    console.log(message.payloadString);
  };

  client.connect({
    onSuccess: onConnectSuccess,
    onFailure: onConnectFailure,
  });
}

function onConnectSuccess() {
  console.log(
    `[${new Date().toISOString()}] ✓ Connected to broker successfully`
  );
  isConnected = true;

  console.log(`Bottle MAC Address: ${bottleMacAddress}`);
  console.log(`Patient ID: ${patientId}`);
  console.log(`Publishing to: ${topicPath}`);
  console.log("");

  // Start publishing hydration data
  publishHydrationData();
}

function onConnectFailure(error) {
  console.error(`[ERROR] Connection failed:`, error);
  console.log("Retrying in 5 seconds...");
  setTimeout(connect, 5000);
}

function publishHydrationData() {
  if (!isConnected) {
    console.log("[WARNING] Not connected, waiting...");
    setTimeout(publishHydrationData, 1000);
    return;
  }

  const event = generateHydrationEvent();
  const payload = JSON.stringify(event);

  try {
    const message = new mqtt.Message(payload);
    message.destinationName = topicPath;
    message.qos = 1;
    client.send(message);

    messageCount++;
    console.log(
      `[${new Date().toISOString()}] Message #${messageCount} published`
    );
    console.log(`  Hydration: ${event.hydration_ml}ml, Battery: ${event.battery_level}%`);
  } catch (error) {
    console.error(`[ERROR] Failed to publish message:`, error.message);
  }

  // Schedule next publication (randomized interval: 5-15 seconds)
  const nextInterval = 5000 + Math.random() * 10000;
  setTimeout(publishHydrationData, nextInterval);
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[INFO] Shutting down gracefully...");
  if (isConnected && client) {
    client.disconnect();
  }
  console.log(`[INFO] Published ${messageCount} messages`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[INFO] Shutting down gracefully...");
  if (isConnected && client) {
    client.disconnect();
  }
  console.log(`[INFO] Published ${messageCount} messages`);
  process.exit(0);
});

// Start the simulator
console.log("=== NutriApp IoT SmartBottle Simulator ===");
console.log(`Client ID: ${clientId}`);
connect();
