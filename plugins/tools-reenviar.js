let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) {
            await conn.reply(m.chat, `🚩 **Admin-TK informa:**\nPor favor, responde al mensaje que deseas reenviar.`, m);
            return;
        }

        // Mensaje inicial y reacción
        let statusMessage = await conn.reply(m.chat, `📤 **Admin-TK informa:**\nReenviando el mensaje...`, m);
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "📤" } // Reacción de progreso
        });

        // Reenviar mensaje
        await conn.sendMessage(m.chat, { forward: m.quoted.fakeObj }, { quoted: m });

        // Editar mensaje y reacción final
        await conn.updateMessage(m.chat, statusMessage.key, `✅ **Admin-TK informa:**\nMensaje reenviado correctamente. 📩`);
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "✅" } // Reacción de éxito
        });
    } catch (error) {
        console.error("❌ Error en el plugin tools-reenviar:", error);

        // Manejo de errores
        await conn.reply(m.chat, `❌ **Admin-TK informa:**\nNo se pudo reenviar el mensaje: ${error.message}`, m);
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "❌" } // Reacción de error
        });
    }
};

handler.help = ['reenviar'];
handler.tags = ['tools'];
handler.command = ['reenviar'];

export default handler;
