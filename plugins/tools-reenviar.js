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

        // Intentar reenviar el mensaje citado
        await conn.sendMessage(m.chat, { forward: m.quoted.fakeObj }, { quoted: m });

        // Editar el mensaje inicial para indicar éxito
        await conn.updateMessage(
            m.chat,
            statusMessage.key,
            `✅ **Admin-TK informa:**\nEl mensaje ha sido reenviado correctamente. 📩`
        );
    } catch (error) {
        console.error("❌ Error en el plugin tools-reenviar:", error);

        // Mensaje de error editado
        await conn.reply(
            m.chat,
            `❌ **Admin-TK informa:**\nNo se pudo reenviar el mensaje debido a un error: ${error.message}`,
            m
        );
    }
};

handler.help = ['reenviar'];
handler.tags = ['tools'];
handler.command = ['reenviar'];

export default handler;



