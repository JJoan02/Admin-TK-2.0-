let handler = async (m, { conn }) => {
    try {
        if (!m.quoted) {
            await conn.reply(m.chat, `🚩 **Admin-TK informa:**\nPor favor, responde al mensaje que deseas reenviar.`, m);
            return;
        }

        let statusMessage = await conn.reply(m.chat, `📤 **Admin-TK informa:**\nReenviando el mensaje...`, m);
        await conn.sendMessage(m.chat, { forward: m.quoted.fakeObj }, { quoted: m });
        await conn.updateMessage(m.chat, statusMessage.key, `✅ **Admin-TK informa:**\nMensaje reenviado correctamente. 📩`);
    } catch (error) {
        console.error("❌ Error en el plugin tools-reenviar:", error);
        await conn.reply(m.chat, `❌ **Admin-TK informa:**\nNo se pudo reenviar el mensaje: ${error.message}`, m);
    }
};

handler.help = ['reenviar'];
handler.tags = ['tools'];
handler.command = ['reenviar'];

export default handler;
