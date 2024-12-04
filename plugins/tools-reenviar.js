let handler = async (m, { conn }) => {
    // Mensaje inicial
    let statusMessage = await conn.reply(m.chat, `📤 **Admin-TK informa:**\nPreparando el reenvío del mensaje...`, m);

    try {
        // Verificar si hay un mensaje citado
        if (!m.quoted) {
            await conn.updateMessage(m.chat, statusMessage.key, `❌ **Admin-TK informa:**\nPor favor, responde al mensaje que deseas reenviar.`);
            return;
        }

        // Intentar reenviar el mensaje citado
        await conn.sendMessage(m.chat, { forward: m.quoted.fakeObj }, { quoted: m });

        // Editar el mensaje inicial para indicar éxito
        await conn.updateMessage(m.chat, statusMessage.key, `✅ **Admin-TK informa:**\nEl mensaje ha sido reenviado con éxito. 📩`);
    } catch (error) {
        console.error("❌ Error en el plugin tools-reenviar:", error);

        // Editar el mensaje inicial para indicar error
        await conn.updateMessage(m.chat, statusMessage.key, `❌ **Admin-TK informa:**\nNo se pudo reenviar el mensaje: ${error.message}`);
    }
};

handler.help = ['reenviar'];
handler.tags = ['tools'];
handler.command = ['reenviar'];

export default handler;

