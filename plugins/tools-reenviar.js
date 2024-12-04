import { downloadContentFromMessage } from '@whiskeysockets/baileys';

let handler = async (m, { conn }) => {
    try {
        // Verificar si se respondió a un mensaje
        if (!m.quoted) {
            // Enviar instrucciones al usuario
            await conn.reply(
                m.chat,
                `❌ **Admin-TK informa:**\nDebes responder a un mensaje para reenviarlo.

📋 *Ejemplo de uso:*
1️⃣ Responde al mensaje que deseas reenviar.
2️⃣ Escribe el comando: *.reenviar*

✔️ *Soporte para texto, fotos, videos, documentos y más.*`,
                m
            );
            return;
        }

        // Reaccionar al mensaje del usuario indicando que se está procesando
        await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key }});

        const quoted = m.quoted;
        const mime = quoted.mimetype || '';
        const text = quoted.text || '';

        let messageOptions = {};

        if (mime) {
            // Mensaje multimedia
            const mediaType = mime.split('/')[0];
            const buffer = await quoted.download();
            if (!buffer) throw new Error('No se pudo descargar el medio');

            if (mime.includes('image')) {
                messageOptions.image = buffer;
            } else if (mime.includes('video')) {
                messageOptions.video = buffer;
            } else if (mime.includes('audio')) {
                messageOptions.audio = buffer;
                messageOptions.ptt = false; // Enviar como audio normal
            } else if (mime.includes('application')) {
                messageOptions.document = buffer;
                messageOptions.fileName = quoted.fileName || 'Documento';
                messageOptions.mimetype = mime;
            }

            messageOptions.caption = `📤 *Admin-TK Reenvío:*\n\n${text}`;
        } else if (quoted.mtype === 'stickerMessage') {
            // Sticker
            const buffer = await quoted.download();
            if (!buffer) throw new Error('No se pudo descargar el sticker');

            messageOptions.sticker = buffer;
        } else if (text) {
            // Mensaje de texto
            messageOptions.text = `📤 *Admin-TK Reenvío:*\n\n${text}`;
        } else {
            // Mensaje no soportado
            await conn.reply(
                m.chat,
                `❌ **Admin-TK informa:**\nLo siento, el tipo de mensaje no es compatible para reenviar.`,
                m
            );
            // Reaccionar con ❌
            await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key }});
            return;
        }

        // Enviar el mensaje reenviado
        await conn.sendMessage(m.chat, messageOptions, { quoted: m });

        // Reaccionar al mensaje del usuario indicando éxito
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key }});
    } catch (error) {
        console.error("❌ Error en el plugin tools-reenviar:", error);

        // Enviar mensaje de error al usuario
        await conn.reply(
            m.chat,
            `❌ **Admin-TK informa:**\nNo se pudo reenviar el mensaje debido a un error: ${error.message}`,
            m
        );

        // Reaccionar al mensaje del usuario indicando error
        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key }});
    }
};

handler.help = ['reenviar'];
handler.tags = ['tools'];
handler.command = ['reenviar'];

export default handler;

