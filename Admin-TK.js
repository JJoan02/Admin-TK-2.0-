process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { createRequire } from 'module';
import path, { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import * as ws from 'ws';
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, rmSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';
import pino from 'pino';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import { Low, JSONFile } from 'lowdb';
import store from './lib/store.js';
const { proto } = (await import('@whiskeysockets/baileys')).default;
const { makeInMemoryStore, fetchLatestBaileysVersion, useMultiFileAuthState, DisconnectReason } = await import('@whiskeysockets/baileys');
import readline from 'readline';
import NodeCache from 'node-cache';
const { CONNECTING } = ws;
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

protoType();
serialize();

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? (/^file:\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};

const __dirname = global.__dirname(import.meta.url);

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());

// Corregir el escape de la barra invertida en la cadena
global.prefix = new RegExp('^[' + (global.opts['prefix'] || '!#$%./-').replace(/[-\/\\^$*+?.()\[\]{}]/g, '\\$&') + ']');

// Cargar la base de datos
global.db = new Low(new JSONFile(`storage/databases/database.json`));
global.DATABASE = global.db;
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => {
    let interval = setInterval(async function () {
      if (!global.db.READ) {
        clearInterval(interval);
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
      }
    }, 1000);
  });
  if (global.db.data !== null) return;
  global.db.READ = true;
  await global.db.read().catch(console.error);
  global.db.READ = null;
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
    sticker: {},
    settings: {},
    ...(global.db.data || {})
  };
  global.db.chain = chain(global.db.data);
};
await loadDatabase();

// Autenticación y estado
const { state, saveCreds } = await useMultiFileAuthState("sessions");
const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Menú de vinculación
console.log(chalk.green('╭──────────────────────────╮'));
console.log(chalk.green('│      Admin-TK Bot        │'));
console.log(chalk.green('╰──────────────────────────╯'));
console.log(chalk.yellow('🔰 Elige el método de vinculación:'));
console.log(chalk.yellow('1. Vinculación mediante código de emparejamiento (recomendado)'));
console.log(chalk.magenta('Creado por Joan TK'));
const choice = await question(chalk.blue('Elige una opción (1): '));

// Configuración de conexión
const connectionOptions = {
  logger: pino({ level: "silent" }),
  printQRInTerminal: false,
  auth: state,
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  fireInitQueries: true,
  generateHighQualityLinkPreview: true,
  syncFullHistory: true,
  markOnlineOnConnect: true,
  browser: ["Ubuntu", "Chrome", "20.0.04"],
};

global.conn = makeWASocket(connectionOptions);

if (!state.creds.registered) {
  if (choice === '1' || choice === '') {
    let phoneNumber;
    do {
      console.log(chalk.yellow('📞 Ejemplo: 51910234457 (sin el signo "+" al inicio)'));
      phoneNumber = await question(chalk.blue('🔰 Admin-TK: Ingresa el número de WhatsApp en el cual estará el Bot: '));
      phoneNumber = phoneNumber.replace(/\D/g, '');
    } while (phoneNumber.length === 0);

    if (global.conn.requestPairingCode) {
      let code = await global.conn.requestPairingCode(phoneNumber);
      code = code?.match(/.{1,4}/g)?.join("-") || code;
      console.log(chalk.magenta(`✅ Admin-TK: Su código de emparejamiento es:`, code));
      console.log(chalk.cyan('🔄 Admin-TK: Espera unos momentos mientras el dispositivo se empareja...'));
    } else {
      console.log(chalk.red('❌ Admin-TK: No se pudo generar el código de emparejamiento. Por favor, inténtalo de nuevo.'));
    }
  }
} else {
  console.log(chalk.green('✅ Admin-TK: El dispositivo ya está registrado.'));
  console.log(chalk.cyan('📲 Admin-TK: Ya puedes comenzar a utilizar el bot en tu dispositivo.'));
}

// Funciones adicionales
global.conn.isInit = false;
global.conn.well = false;

if (!global.opts['test']) {
  if (global.db) {
    setInterval(async () => {
      if (global.db.data) await global.db.write();
      if (global.opts['autocleartmp'] && (global.support || {}).find) {
        const tmpDirs = [tmpdir(), 'tmp', 'serbot'];
        tmpDirs.forEach((dirname) => spawn('find', [dirname, '-amin', '3', '-type', 'f', '-delete']));
      }
    }, 30 * 1000);
  }
}

// Función para limpiar archivos temporales
async function clearTmp() {
  const tmpPaths = [tmpdir(), join(__dirname, './tmp')];
  const files = [];
  tmpPaths.forEach(dirname => readdirSync(dirname).forEach(file => files.push(join(dirname, file))));

  files.forEach(file => {
    const stats = statSync(file);
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 1)) {
      unlinkSync(file);
    }
  });
}

setInterval(async () => {
  await clearTmp();
  console.log(chalk.cyan(`🗑️ Admin-TK: Se limpió la carpeta tmp`));
}, 60000);

// Actualización de conexión
async function connectionUpdate(update) {
  const { connection, lastDisconnect, isNewLogin } = update;
  global.stopped = connection;
  if (isNewLogin) global.conn.isInit = true;
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
  if (code && code !== DisconnectReason.loggedOut && global.conn?.ws.socket == null) {
    await global.reloadHandler(true).catch(console.error);
  }
  if (global.db.data == null) await loadDatabase();

  if (connection == 'open') {
    console.log(chalk.cyan('✅ Admin-TK: Conectado correctamente.'));
  }
}

process.on('uncaughtException', console.error);

// Manejo de mensajes y plugins
let isInit = true;
let handler = await import('./handler.js');

global.reloadHandler = async function (restartConn) {
  try {
    const Handler = await import(`./handler.js?update=${Date.now()}`);
    if (Object.keys(Handler || {}).length) handler = Handler;
  } catch (e) {
    console.error(e);
  }
  if (restartConn) {
    const oldChats = global.conn.chats;
    try {
      global.conn.ws.close();
    } catch { }
    global.conn.ev.removeAllListeners();
    global.conn = makeWASocket(connectionOptions, { chats: oldChats });
    isInit = true;
  }
  if (!isInit) {
    global.conn.ev.off('messages.upsert', global.conn.handler);
    global.conn.ev.off('connection.update', global.conn.connectionUpdate);
    global.conn.ev.off('creds.update', global.conn.credsUpdate);
  }

  global.conn.handler = handler.handler.bind(global.conn);
  global.conn.connectionUpdate = connectionUpdate.bind(global.conn);
  global.conn.credsUpdate = saveCreds.bind(global.conn, true);

  global.conn.ev.on('messages.upsert', global.conn.handler);
  global.conn.ev.on('connection.update', global.conn.connectionUpdate);
  global.conn.ev.on('creds.update', global.conn.credsUpdate);
  isInit = false;
  return true;
};

// Inicialización de plugins
const pluginFolder = join(__dirname, './plugins');
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function filesInit() {
  for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      const file = pathToFileURL(join(pluginFolder, filename)).href;
      const module = await import(file);
      global.plugins[filename] = module.default || module;
    } catch (e) {
      console.error(`Error al cargar el plugin '${filename}':`, e);
      delete global.plugins[filename];
    }
  }
}

filesInit().then(() => Object.keys(global.plugins)).catch(console.error);

// Recarga de plugins al detectar cambios
global.reload = async (_ev, filename) => {
  if (pluginFilter(filename)) {
    const dir = join(pluginFolder, filename);
    if (filename in global.plugins) {
      if (existsSync(dir)) {
        console.log(chalk.magenta(`🔄 Admin-TK: Plugin actualizado - '${filename}'`));
      } else {
        console.log(chalk.yellow(`🗑️ Admin-TK: Plugin eliminado - '${filename}'`));
        delete global.plugins[filename];
        return;
      }
    } else {
      console.log(chalk.green(`🆕 Admin-TK: Nuevo plugin - '${filename}'`));
    }
    const err = syntaxerror(readFileSync(dir), filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    if (err) {
      console.error(chalk.red(`❌ Admin-TK: Error de sintaxis en '${filename}'\n${format(err)}`));
    } else {
      try {
        const module = await import(`${pathToFileURL(dir).href}?update=${Date.now()}`);
        global.plugins[filename] = module.default || module;
      } catch (e) {
        console.error(e);
      }
    }
  }
};

Object.freeze(global.reload);
watch(pluginFolder, global.reload);

// Iniciar el manejador
await global.reloadHandler();
