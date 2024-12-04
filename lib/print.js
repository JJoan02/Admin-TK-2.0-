import { WAMessageStubType } from '@whiskeysockets/baileys';
import PhoneNumber from 'awesome-phonenumber';
import chalk from 'chalk';
import { watchFile } from 'fs';

const terminalImage = global.opts['img'] ? require('terminal-image') : '';
const urlRegex = (await import('url-regex-safe')).default({ strict: false });

export default async function (m, conn = { user: {} }) {
  // Mensajes iniciales con personalidad
  console.log(chalk.greenBright('✅ Admin-TK: ¡Hola! Estoy aquí para ayudarte con tus mensajes. 📩'));
  console.log(chalk.blueBright('📲 Admin-TK: Estoy revisando el mensaje, dame un segundo... 🕒'));

  // Obtener información del remitente
  const senderName = await conn.getName(m.sender);
  const senderNumber = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international');
  const sender = `${senderNumber}${senderName ? ` ~ ${senderName}` : ''}`;

  // Obtener información del chat
  const chatName = await conn.getName(m.chat);
  const isGroup = m.isGroup || m.chat.endsWith('@g.us');

  let img;

  try {
    if (global.opts['img'])
      img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false;
  } catch (e) {
    console.error(chalk.redBright(`❌ Admin-TK: Ups, hubo un problema al procesar la imagen. ¡No te preocupes, lo seguiré intentando!`));
  }

  // Calcular el tamaño del mensaje
  const filesize = (
    m.msg
      ? m.msg.vcard
        ? m.msg.vcard.length
        : m.msg.fileLength
          ? m.msg.fileLength.low || m.msg.fileLength
          : m.msg.axolotlSenderKeyDistributionMessage
            ? m.msg.axolotlSenderKeyDistributionMessage.length
            : m.text
              ? m.text.length
              : 0
      : m.text
        ? m.text.length
        : 0
  ) || 0;

  // Información básica del mensaje
  console.log(chalk.yellow(`
💬 Admin-TK: Acabo de recibir un mensaje. Esto es lo que encontré:
📤 Remitente: ${chalk.magentaBright(sender)}
📥 Chat: ${chalk.greenBright(chatName || 'Desconocido')}
${isGroup ? '👥 Tipo de Chat: Grupal' : '👤 Tipo de Chat: Individual'}
📄 Tipo de Mensaje: ${chalk.yellow(m.mtype || 'Mensaje')}
⏱️ Hora: ${chalk.blueBright((m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date()).toLocaleTimeString())}
📦 Tamaño: ${chalk.whiteBright(filesize)} bytes
  `));

  // Mostrar el cuerpo del mensaje
  if (typeof m.text === 'string' && m.text) {
    let log = m.text.replace(/\u200e+/g, '');
    const mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g;
    const mdFormat = (depth = 4) => (_, type, text, monospace) => {
      const types = { _: 'italic', '*': 'bold', '~': 'strikethrough' };
      text = text || monospace;
      const formatted = !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)));
      return formatted;
    };

    log = log.replace(urlRegex, url => chalk.blueBright(url));
    log = log.replace(mdRegex, mdFormat(4));

    console.log(chalk.cyan('💬 Admin-TK: Este es el contenido del mensaje:'));
    console.log(chalk.whiteBright(log));
  } else {
    console.log(chalk.cyan('💬 Admin-TK: El mensaje está vacío o no es un texto.'));
  }

  // Pie de página estilizado
  console.log(chalk.cyanBright(`
🌟 Comunidad TK
  `));
}

let file = global.__filename(import.meta.url);
watchFile(file, () => {
  console.log(chalk.redBright("⚠️ Admin-TK: ¡El archivo 'lib/print.js' ha cambiado! Por favor, reinicia para aplicar los cambios."));
});
