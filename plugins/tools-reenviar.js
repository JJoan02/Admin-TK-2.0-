import fs from 'fs';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

let handler = async (m, { conn }) => {
    // Mensaje inicial y reacción de inicio
    let statusMessage = await conn.reply(
        m.chat,
        `📤 **Admin-TK informa:**\nPreparando el reenvío del mensaje...`,
        m
    );
    await conn.relayMessage(m.chat, {
        reactionMessage: { key: m.key, text: "⏳" } // Reacción de inicio
    });

    try {
        // Verificar si se respondió a un mensaje
        if (!m.quoted) {
            await conn.updateMessage(
                m.chat,
                statusMessage.key,
                `❌ **Admin-TK informa:**\nDebes responder a un mensaje para reenviarlo.\n\n📋 *Ejemplo de uso:*\n1️⃣ Responde al mensaje que deseas reenviar.\n2️⃣ Escribe el comando: *.reenviar*\n\n✔️ *Soporte para texto, fotos, videos, documentos y más.*`
            );
            return;
        }

        const quoted = m.quoted;
        const mime = quoted.mimetype || '';
        const text = quoted.text || '';

        // Construir el mensaje a enviar
        let messageOptions = {
            caption: `📤 *Admin-TK Reenvío:*\n\n${text}`,
            mentions: quoted.mentionedJid || []
        };

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
                messageOptions.ptt = true; // Si deseas que se envíe como nota de voz
            } else if (mediaType === 'document') {
                messageOptions.document = buffer;
                messageOptions.fileName = quoted.fileName || 'Documento';
                messageOptions.mimetype = mime;
            }
        } else if (quoted.sticker) {
            // Si es un sticker, descargar y reenviar
            const stream = await downloadContentFromMessage(quoted.message[quoted.mtype], 'sticker');
            let buffer = Buffer.from([]);

            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            messageOptions.sticker = buffer;
        } else {
            // Si es solo texto, enviar como texto
            messageOptions.text = `📤 *Admin-TK Reenvío:*\n\n${text}`;
        }

        // Enviar el mensaje reenviado
        await conn.sendMessage(m.chat, messageOptions, { quoted: m });

        // Editar el mensaje inicial para indicar éxito
        await conn.updateMessage(
            m.chat,
            statusMessage.key,
            `✅ **Admin-TK informa:**\nEl mensaje ha sido reenviado correctamente. 📩`
        );

        // Reacción de éxito
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "✅" }
        });
    } catch (error) {
        console.error("❌ Error en el plugin tools-reenviar:", error);

        // Editar el mensaje inicial para indicar error
        await conn.updateMessage(
            m.chat,
            statusMessage.key,
            `❌ **Admin-TK informa:**\nNo se pudo reenviar el mensaje debido a un error: ${error.message}`
        );

        // Reacción de error
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "❌" }
        });
    }
};

handler.help = ['reenviar'];
handler.tags = ['tools'];
handler.command = ['reenviar'];

export default handler;
