import { WAMessageStubType } from '@whiskeysockets/baileys';
import PhoneNumber from 'awesome-phonenumber';
import chalk from 'chalk';
import { watchFile } from 'fs';

const terminalImage = global.opts['img'] ? (await import('terminal-image')).default : null;
const urlRegex = (await import('url-regex-safe')).default({ strict: false });

export default async function (m, conn = { user: {} }) {
  let _name = await conn.getName(m.sender);
  let senderNumber = m.sender.replace('@s.whatsapp.net', '');
  let sender = PhoneNumber('+' + senderNumber).getNumber('international') + (_name ? ' ~ ' + _name : '');
  let chatName = await conn.getName(m.chat);
  let img;
  try {
    if (global.opts['img']) {
      img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false;
    }
  } catch (e) {
    console.error(e);
  }

  let filesize = (m.msg ?
    m.msg.vcard ? m.msg.vcard.length :
      m.msg.fileLength ? m.msg.fileLength.low || m.msg.fileLength :
        m.msg.axolotlSenderKeyDistributionMessage ? m.msg.axolotlSenderKeyDistributionMessage.length :
          m.text ? m.text.length : 0
    : m.text ? m.text.length : 0) || 0;

  let user = global.db.data.users[m.sender];
  let meNumber = (conn.user?.jid || conn.user?.id || '').replace('@s.whatsapp.net', '');
  let me = PhoneNumber('+' + meNumber).getNumber('international');

  // Registro de mensaje en la consola con estilo personalizado
  console.log(
    chalk.magenta.bold('Admin-TK'),
    chalk.green('Mensaje de:'),
    chalk.blue(`${_name || senderNumber}`),
    chalk.green('en el chat:'),
    chalk.blue(`${chatName || m.chat}`)
  );

  if (img) console.log(img.trimEnd());

  if (typeof m.text === 'string' && m.text) {
    let log = m.text.replace(/\u200e+/g, '');
    let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g;
    let mdFormat = (depth = 4) => (_, type, text, monospace) => {
      let types = {
        '_': 'italic',
        '*': 'bold',
        '~': 'strikethrough'
      };
      text = text || monospace;
      let formatted = !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)));
      return formatted;
    };
    if (log.length < 4096) {
      log = log.replace(urlRegex, (url, i, text) => {
        let end = url.length + i;
        return i === 0 || end === text.length || (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1])) ? chalk.blueBright(url) : url;
      });
    }
    log = log.replace(mdRegex, mdFormat(4));
    if (m.mentionedJid) {
      for (let user of m.mentionedJid) {
        let userName = await conn.getName(user);
        log = log.replace('@' + user.split`@`[0], chalk.blueBright('@' + userName));
      }
    }
    console.log(m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log);
  }

  if (m.messageStubParameters) {
    console.log(m.messageStubParameters.map(jid => {
      jid = conn.decodeJid(jid);
      let name = conn.getName(jid);
      return chalk.gray(PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international') + (name ? ' ~ ' + name : ''));
    }).join(', '));
  }

  // Información adicional basada en el tipo de mensaje
  if (/document/i.test(m.mtype)) {
    console.log(`📄 ${m.msg.fileName || m.msg.displayName || 'Documento'}`);
  } else if (/ContactsArray/i.test(m.mtype)) {
    console.log(`👨‍👩‍👧‍👦 ${'Contactos'}`);
  } else if (/contact/i.test(m.mtype)) {
    console.log(`👨 ${m.msg.displayName || 'Contacto'}`);
  } else if (/audio/i.test(m.mtype)) {
    const duration = m.msg.seconds;
    console.log(`${m.msg.ptt ? '🎤 (PTT' : '🎵 (AUDIO)'} ${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`);
  }

  console.log();
}

// Observador de cambios en el archivo para recargarlo si es actualizado
let file = global.__filename(import.meta.url);
watchFile(file, () => {
  console.log(chalk.magenta("🔄 Admin-TK: Se actualizó 'print.js'"));
});
