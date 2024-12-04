let handler = m => m;

handler.before = async function (m, { conn, isAdmin, isBotAdmin, isOwner }) {
    if (!m.isGroup) return true; // Solo aplica en grupos

    let chat = global.db.data.chats[m.chat]; // Configuración del grupo

    // Lista de prefijos permitidos (América y países específicos)
    const allowedPrefixes = [
        "+1", "+299", "+52", "+501", "+502", "+503", "+504", "+505", "+506", "+507", "+500",
        "+51", "+54", "+55", "+56", "+57", "+58", "+591", "+592", "+593", "+594", "+595",
        "+597", "+598", "+30", "+33", "+34", "+354", "+39", "+81", "+82", "+850", "+86"
    ];

    // Si está activado el filtro en el grupo
    if (isBotAdmin && chat.onlyLatinos && !isAdmin && !isOwner) {
        let senderPrefix = `+${m.sender.split("@")[0].slice(0, 3)}`; // Obtener el prefijo del remitente

        // Validar si el número no pertenece a un prefijo permitido
        if (!allowedPrefixes.some(prefix => senderPrefix.startsWith(prefix))) {
            // Mensaje personalizado en el idioma del remitente
            const languageMessages = {
                "+34": "🌍 Hola, lo sentimos, este grupo es exclusivo para personas de habla hispana. No eres bienvenido aquí. ¡Cuídate! 🤝",
                "+81": "🌏 Hello! Sorry, this group is exclusive to Spanish-speaking people. You're not welcome here. Take care! 🤝",
                "+850": "🌏 안녕하세요! 죄송합니다. 이 그룹은 스페인어 사용자 전용입니다. 여기에 초대되지 않았습니다. 조심하세요! 🤝",
                "+86": "🌏 你好！抱歉，该群仅限讲西班牙语的人。您不欢迎在这里。保重！🤝",
                "default": "🌍 Hola, lo sentimos, este grupo es exclusivo para personas de habla hispana. ¡Cuídate! 🤝"
            };

            let messageToSend = languageMessages[senderPrefix] || languageMessages["default"];

            // Enviar mensaje privado al usuario
            await conn.sendMessage(m.sender, { text: messageToSend }, { quoted: m });

            // Remover del grupo
            await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');

            // Admin-TK reporta la acción en consola (no en el grupo para evitar spam)
            console.log(`
🛡️ Admin-TK: He retirado al usuario ${m.sender} del grupo ${m.chat}.
Razón: Prefijo no permitido (${senderPrefix}).
`);
            return false; // Finalizar la ejecución
        }
    }

    return true; // Continuar con otros handlers si aplica
};

export default handler;
