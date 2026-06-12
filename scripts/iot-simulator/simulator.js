#!/usr/bin/env node
/**
 * NutriApp IoT Simulator — SmartBottle
 *
 * Publica mensagens MQTT simulando goles de uma garrafa inteligente.
 *
 * Uso:
 *   node simulator.js --patient <uuid> [--interval <segundos>]
 *
 * Exemplos:
 *   node simulator.js --patient 123e4567-e89b-12d3-a456-426614174000
 *   node simulator.js --patient 123e4567-e89b-12d3-a456-426614174000 --interval 5
 *
 * Tópico publicado: nutriapp/v1/{patientId}/water
 * Broker padrão: mqtt://broker.emqx.io:1883 (público, sem autenticação)
 *
 * Payload (JSON):
 *   { deviceId: string, amountMl: number, timestamp: string }
 */

'use strict';

const mqtt = require('mqtt');

// --- CLI args ---
const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
}

const patientId = getArg('--patient');
if (!patientId) {
  console.error('[SmartBottle] Argumento obrigatório: --patient <uuid>');
  process.exit(1);
}

const intervalSec = parseInt(getArg('--interval') ?? '8', 10);
const broker = getArg('--broker') ?? 'mqtt://broker.emqx.io:1883';
const topic = `nutriapp/v1/${patientId}/water`;
const deviceId = `smartbottle-sim-${Math.random().toString(36).slice(2, 7)}`;

// --- Connect ---
console.log(`[SmartBottle] Conectando em ${broker}...`);
console.log(`[SmartBottle] Tópico: ${topic}`);
console.log(`[SmartBottle] Intervalo: ${intervalSec}s`);

const client = mqtt.connect(broker, {
  clientId: `nutriapp-sim-${Date.now()}`,
  clean: true,
  connectTimeout: 10_000,
});

let timer = null;

client.on('connect', () => {
  console.log('[SmartBottle] Conectado. Iniciando publicações...\n');
  publish();
  timer = setInterval(publish, intervalSec * 1000);
});

client.on('error', (err) => {
  console.error('[SmartBottle] Erro:', err.message);
});

client.on('close', () => {
  if (timer) clearInterval(timer);
  console.log('[SmartBottle] Desconectado.');
});

function publish() {
  const amountMl = Math.floor(150 + Math.random() * 201); // 150–350ml
  const payload = JSON.stringify({
    deviceId,
    amountMl,
    timestamp: new Date().toISOString(),
  });

  client.publish(topic, payload, { qos: 0 }, (err) => {
    if (err) {
      console.error('[SmartBottle] Falha ao publicar:', err.message);
    } else {
      const time = new Date().toLocaleTimeString('pt-BR');
      console.log(`[SmartBottle] publicado: ${amountMl}ml para ${patientId} às ${time}`);
    }
  });
}

// --- Graceful shutdown ---
process.on('SIGINT', () => {
  console.log('\n[SmartBottle] Encerrando...');
  if (timer) clearInterval(timer);
  client.end();
  process.exit(0);
});
