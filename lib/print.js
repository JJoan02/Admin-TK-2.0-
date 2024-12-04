import { WAMessageStubType } from '@whiskeysockets/baileys'
import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { watchFile } from 'fs'

const terminalImage = global.opts['img'] ? require('terminal-image') : ''
const urlRegex = (await import('url-regex-safe')).default({ strict: false })

export default async function (m, conn = { user: {} }) {
  let senderName = await conn.getName(m.sender)
  let sender = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international') + (senderName ? ` ~ ${senderName}` : '')
  let chatName = await conn.getName(m.chat)
  let img

  try {
    if (global.opts['img'])
      img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false
  } catch (e) {
    console.error(e)
  }

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
  ) || 0

  const user = global.DATABASE.data.users[m.sender]
  const botNumber = PhoneNumber('+' + conn.user?.jid.replace('@s.whatsapp.net', '')).getNumber('international')

  // Encabezado estilizado
  console.log(chalk.cyanBright(`
╭─────────────────────────────╮
│        🌟 Admin-TK 🌟        │
╰─────────────────────────────╯
  `))

  // Información básica del mensaje
  console.log(`
📤 Remitente: ${chalk.magentaBright(sender)}
📥 Chat: ${chalk.greenBright(chatName || 'Desconocido')}
📄 Tipo: ${chalk.yellow(m.mtype || 'Mensaje')}
⏱️ Hora: ${chalk.blueBright((m.messageTimestamp ? new Date(1000 * m.messageTimestamp.low || m.messageTimestamp) : new Date()).toLocaleTimeString())}
📦 Tamaño: ${chalk.whiteBright(filesize)} bytes
  `)

  // Mensaje multimedia
  if (img) {
    console.log(chalk.gray('🖼️ Imagen/Sticker detectado:'))
    console.log(img.trimEnd())
  }

  // Cuerpo del mensaje
  if (typeof m.text === 'string' && m.text) {
    let log = m.text.replace(/\u200e+/g, '')
    const mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
    const mdFormat = (depth = 4) => (_, type, text, monospace) => {
      const types = { _: 'italic', '*': 'bold', '~': 'strikethrough' }
      text = text || monospace
      const formatted = !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)))
      return formatted
    }

    log = log.replace(urlRegex, url => chalk.blueBright(url))
    log = log.replace(mdRegex, mdFormat(4))

    console.log(chalk.cyan('💬 Mensaje:'))
    console.log(chalk.whiteBright(log))
  }

  // Menciones
  if (m.mentionedJid) {
    console.log(chalk.yellow('🔔 Menciones:'))
    for (const user of m.mentionedJid) {
      const name = await conn.getName(user)
      console.log(chalk.greenBright(`@${name || user.split('@')[0]}`))
    }
  }

  // Información de archivos/documentos
  if (/document/i.test(m.mtype)) console.log(`🗂️ Documento: ${m.msg.fileName || 'Sin nombre'}`)
  else if (/audio/i.test(m.mtype)) {
    const duration = m.msg.seconds
    console.log(`🎵 Audio (${m.msg.ptt ? 'PTT' : 'Normal'}): ${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`)
  }

  // Pie estilizado
  console.log(chalk.cyanBright(`
╭─────────────────────────────╮
│         Fin del Log         │
╰─────────────────────────────╯
  `))
}

let file = global.__filename(import.meta.url)
watchFile(file, () => {
  console.log(chalk.redBright("⚠️ Archivo 'lib/print.js' actualizado. Reinicia el bot para aplicar cambios."))
})

