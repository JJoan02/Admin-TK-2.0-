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

  // Encabezado estilizado
  console.log(chalk.cyanBright(`
🌟 Admin-TK 🌟
  `));

  // Información básica del mensaje con estilo narrativo
  console.log(chalk.yellow(`
💬 Admin-TK: Acabo de recibir un mensaje. Esto es lo que encontré:
📤 Remitente: ${chalk.magentaBright(sender)}
📥 Chat: ${chalk.greenBright(chatName || 'Desconocido')}
${isGroup ? '👥 Tipo de Chat: Grupo. ¡Hay mucha gente aquí! 🧑‍🤝‍🧑' : '👤 Tipo de Chat: Individual. Solo tú y yo. 🤝'}
📄 Tipo de Mensaje: ${chalk.yellow(m.mtype || 'Mensaje')}
⏱️ Hora: ${chalk.blueBright((m.messageTimestamp ? new Date(1000 * (m.messageTimestamp.low || m.messageTimestamp)) : new Date()).toLocaleTimeString())}
📦 Tamaño: ${chalk.whiteBright(filesize)} bytes
  `));

  // Mostrar imagen o sticker si existe
  if (img) {
    console.log(chalk.gray('🖼️ Admin-TK: ¡Veo una imagen o un sticker interesante! Aquí está:'));
    console.log(img.trimEnd());
  }

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
  }

  // Mostrar menciones si existen
  if (m.mentionedJid) {
    console.log(chalk.yellow('🔔 Admin-TK: Parece que mencionaron a alguien:'));
    for (const user of m.mentionedJid) {
      const name = await conn.getName(user);
      console.log(chalk.greenBright(`@${name || user.split('@')[0]}`));
    }
  }

  // Información de archivos/documentos
  if (/document/i.test(m.mtype)) {
    console.log(`🗂️ Admin-TK: El mensaje incluye un documento llamado: ${chalk.magentaBright(m.msg.fileName || 'Sin nombre')}`);
  } else if (/audio/i.test(m.mtype)) {
    const duration = m.msg.seconds;
    console.log(`🎵 Admin-TK: ¡Recibí un audio! Duración: ${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`);
  }

  // Pie de página estilizado
  console.log(chalk.cyanBright(`
✨ Admin-TK: ¡Hasta la próxima! 🚀
🌟 Comunidad TK
  `));
}

let file = global.__filename(import.meta.url);
watchFile(file, () => {
  console.log(chalk.redBright("⚠️ Admin-TK: ¡El archivo 'lib/print.js' ha cambiado! Por favor, reinicia para aplicar los cambios."));
});


