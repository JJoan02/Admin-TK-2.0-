import { File } from "megajs";
import path from "path";

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        if (!args[0]) {
            return m.reply(`🚀 *Uso del comando:*\n${usedPrefix + command} <enlace MEGA>\n\n📝 *Ejemplo:*\n${usedPrefix + command} https://mega.nz/file/ovJTHaQZ#yAbkrvQgykcH_NDKQ8eIc0zvsN7jonBbHZ_HTQL6lZ8`);
        }

        const link = args[0];

        // Validar formato del enlace
        if (!/^https:\/\/mega\.nz\/file\/[A-Za-z0-9_-]+#[A-Za-z0-9_-]+$/.test(link)) {
            return m.reply(`❌ *Error:* El enlace proporcionado no es válido. Asegúrate de usar un enlace de MEGA correcto.`);
        }

        const file = File.fromURL(link);
        await file.loadAttributes();

        // Verificar tamaño del archivo
        if (file.size >= 300 * 1024 * 1024) {
            return m.reply(`⚠️ *Error:* El archivo es demasiado grande (Máximo permitido: 300 MB).`);
        }

        // Enviar mensaje inicial
        const initialMessage = await conn.reply(m.chat, `⏳ *Admin-TK informa:*\nPreparando la descarga...`, m);

        // Agregar reacción inicial
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "⏳" }
        });

        // Editar mensaje: Iniciando descarga
        await conn.updateMessage(m.chat, initialMessage.key, `⬇️ *Admin-TK informa:*\nDescargando el archivo: ${file.name}\nPor favor, espera un momento...`);

        const data = await file.downloadBuffer();
        const fileExtension = path.extname(file.name).toLowerCase();

        // Determinar el tipo MIME
        const mimeTypes = {
            ".mp4": "video/mp4",
            ".pdf": "application/pdf",
            ".zip": "application/zip",
            ".rar": "application/x-rar-compressed",
            ".7z": "application/x-7z-compressed",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png"
        };

        const mimetype = mimeTypes[fileExtension] || "application/octet-stream";

        // Editar mensaje: Descarga completa
        await conn.updateMessage(m.chat, initialMessage.key, `✅ *Admin-TK informa:*\nDescarga completada.\nEnviando el archivo...`);

        // Enviar archivo al chat
        await conn.sendFile(
            m.chat,
            data,
            file.name,
            `📁 *Archivo:* ${file.name}\n📦 *Tamaño:* ${formatBytes(file.size)}\n\n¡Descarga y envío exitosos!`,
            m,
            null,
            { mimetype, asDocument: true }
        );

        // Reacción final de éxito
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "✅" }
        });
    } catch (error) {
        console.error("❌ Error en el plugin dl-mega:", error);

        // Editar mensaje: Error durante el proceso
        await conn.reply(m.chat, `❌ *Admin-TK informa:*\nOcurrió un error durante el proceso:\n\`${error.message}\``, m);

        // Reacción de error
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "❌" }
        });
    }
};

handler.help = ["mega"];
handler.tags = ["downloader"];
handler.command = /^(mega)$/i;

export default handler;

// Función para formatear tamaños de archivo
function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

