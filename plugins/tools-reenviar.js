let handler = async (m, { conn }) => {
    // Mensaje inicial
    let statusMessage = await conn.reply(
        m.chat,
        `📤 **Admin-TK informa:**\nPreparando el reenvío del mensaje...`,
        m
    );

    try {
        // Verificar si el mensaje es citado
        if (!m.quoted) {
            await conn.updateMessage(
                m.chat,
                statusMessage.key,
                `❌ **Admin-TK informa:**\nPor favor, responde a un mensaje para reenviarlo.\n\n📋 *Ejemplo de uso:*\n1️⃣ Responde al mensaje que deseas reenviar.\n2️⃣ Escribe el comando: *.reenviar*.\n\n✔️ *El mensaje será reenviado correctamente, ya sea un video, documento, audio o texto.*`
            );
            return;
        }

        // Intentar reenviar el mensaje citado
        await conn.sendMessage(m.chat, { forward: m.quoted.fakeObj }, { quoted: m });

        // Editar el mensaje inicial para indicar éxito
        await conn.updateMessage(
            m.chat,
            statusMessage.key,
            `✅ **Admin-TK informa:**\nEl mensaje ha sido reenviado con éxito. 📩`
        );
    } catch (error) {
        console.error("❌ Error en el plugin tools-reenviar:", error);

        // Editar el mensaje inicial para indicar error
        await conn.updateMessage(
            m.chat,
            statusMessage.key,
            `❌ **Admin-TK informa:**\nNo se pudo reenviar el mensaje: ${error.message}`
        );
    }
};

handler.help = ['reenviar'];
handler.tags = ['tools'];
handler.command = ['reenviar'];

export default handler;


