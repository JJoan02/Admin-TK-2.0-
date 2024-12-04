let handler = async (m, { conn }) => {
    try {
        // Verificar si el comando fue enviado sin citar un mensaje
        if (!m.quoted) {
            await conn.reply(
                m.chat,
                `❌ **Admin-TK informa:**\nDebes responder a un mensaje para reenviarlo.\n\n📋 *Ejemplo de uso:*\n1️⃣ Responde al mensaje que deseas reenviar.\n2️⃣ Escribe el comando: *.reenviar*.\n\n✔️ *Soporte para texto, fotos, videos, documentos y más.*`,
                m
            );
            return;
        }

        // Mensaje inicial mientras se procesa el reenvío
        let statusMessage = await conn.reply(
            m.chat,
            `📤 **Admin-TK informa:**\nPreparando el reenvío del mensaje...`,
            m
        );

        // Obtener el mensaje citado y verificar su contenido
        const quoted = m.quoted;
        if (!quoted) {
            await conn.updateMessage(
                m.chat,
                statusMessage.key,
                `❌ **Admin-TK informa:**\nNo se encontró un mensaje válido para reenviar.`
            );
            return;
        }

        // Construir el contenido reenviado con título de Admin-TK
        let forwardedContent = {
            text: `📤 *Admin-TK Reenvío:*\n\n${quoted.text || 'Contenido reenviado'}`,
            mentions: quoted.mentionedJid || []
        };

        // Si el mensaje citado tiene un archivo adjunto, incluirlo en el reenvío
        if (quoted.message) {
            const type = Object.keys(quoted.message)[0];
            forwardedContent = { ...forwardedContent, [type]: quoted.message[type] };
        }

        // Enviar el mensaje reenviado
        await conn.sendMessage(m.chat, forwardedContent, { quoted: m });

        // Editar el mensaje inicial para indicar éxito
        await conn.updateMessage(
            m.chat,
            statusMessage.key,
            `✅ **Admin-TK informa:**\nEl mensaje ha sido reenviado correctamente. 📩`
        );
    } catch (error) {
        console.error("❌ Error en el plugin tools-reenviar:", error);

        // Manejo de errores
        await conn.updateMessage(
            m.chat,
            `❌ **Admin-TK informa:**\nNo se pudo reenviar el mensaje debido a un error: ${error.message}`
        );
    }
};

handler.help = ['reenviar'];
handler.tags = ['tools'];
handler.command = ['reenviar'];

export default handler;




