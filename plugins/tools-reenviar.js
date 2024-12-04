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

        // Si el mensaje tiene contenido multimedia, descargarlo y reenviarlo
        if (mime) {
            const mediaType = mime.split('/')[0];
            const stream = await downloadContentFromMessage(quoted.message[quoted.mtype], mediaType);
            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Añadir el contenido multimedia al mensaje
            if (mediaType === 'image') {
                messageOptions.image = buffer;
            } else if (mediaType === 'video') {
                messageOptions.video = buffer;
            } else if (mediaType === 'audio') {
                messageOptions.audio = buffer;
                messageOptions.ptt = true; // Enviar como nota de voz si es audio
            } else if (mediaType === 'application') {
                messageOptions.document = buffer;
                messageOptions.fileName = quoted.filename || 'Documento';
                messageOptions.mimetype = mime;
            }
            messageOptions.caption = `📤 *Admin-TK Reenvío:*\n\n${text}`;
        } else if (quoted.type === 'stickerMessage') {
            // Si es un sticker, descargar y reenviar
            const stream = await downloadContentFromMessage(quoted.message[quoted.mtype], 'sticker');
            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            messageOptions.sticker = buffer;
        } else if (text) {
            // Si es solo texto, enviar como texto
            messageOptions.text = `📤 *Admin-TK Reenvío:*\n\n${text}`;
        } else {
            // Si el mensaje no es compatible
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

