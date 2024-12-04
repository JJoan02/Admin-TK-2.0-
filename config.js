import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import axios from 'axios';

//*─ Configuración de propietarios ─*
global.owner = [
  ['51910234457', 'Joan TK', true]
];

//*─ Otros ajustes ─*
global.mods = [];
global.prems = [];

//*─ Información del bot ─*
global.packname = ``;
global.author = '{\n "bot": {\n   "name": "Ai Hoshino",\n     "author": "atom.bio/joan_tk02",\n   "status_bot": "active"\n }\n}';
global.wait = '🐢 *Aguarde un momento, soy lenta... ฅ^•ﻌ•^ฅ*';
global.botname = '🔰 Admin-TK 🔰';
global.textbot = `Admin-TK`;
global.listo = '*Aquí tiene ฅ^•ﻌ•^ฅ*';
global.namechannel = '【 ✯ Official Channel ✰ 】';
global.support = {
  ffmpeg: true,
  ffprobe: true,
  ffmpegWebp: true,
  convert: true,
  magick: false,
  gm: false,
  find: false
};

//*─ Archivos multimedia ─*
global.catalogo = fs.readFileSync('./storage/img/catalogo.png');
global.miniurl = fs.readFileSync('./storage/img/miniurl.jpg');

//*─ Enlaces y redes sociales ─*
global.pagina = 'atom.bio/joan_tk02';
global.group = '';
global.canal = 'https://whatsapp.com/channel/0029VawpOoGHwXb6LgJkXN2R';

//*─ Estilo de mensajes ─*
global.estilo = {
  key: {
    fromMe: false,
    participant: `0@s.whatsapp.net`,
    ...(false ? { remoteJid: "5219992095479-1625305606@g.us" } : {})
  },
  message: {
    orderMessage: {
      itemCount: -999999,
      status: 1,
      surface: 1,
      message: global.botname,
      orderTitle: 'Admin-TK',
      thumbnail: global.catalogo,
      sellerJid: '0@s.whatsapp.net'
    }
  }
};

//*─ Módulos adicionales ─*
global.cheerio = cheerio;
global.fs = fs;
global.fetch = fetch;
global.axios = axios;

//*─ Configuraciones de economía y otros ─*
global.multiplier = 69;
global.maxwarn = '2'; // Máximo de advertencias

//*─ Observador de cambios en el archivo de configuración ─*
let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
  unwatchFile(file);
  console.log(chalk.redBright("🔄 Admin-TK: Update 'config.js'"));
  import(`${file}?update=${Date.now()}`);
});
