const linkRegex = /chat.whatsapp.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i;

export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (m.isBaileys && m.fromMe) return true; // Ignorar mensajes enviados por el bot mismo
    if (!m.isGroup) return false; // Solo actúa en grupos

    let chat = global.db.data.chats[m.chat];
    if (!chat.antiLink) return true; // Si antiLink no está activado, no hace nada

    const isGroupLink = linkRegex.exec(m.text); // Detectar si el mensaje contiene un enlace
    if (isGroupLink && !isAdmin) {
        if (isBotAdmin) {
            const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`;
            if (m.text.includes(linkThisGroup)) return true; // Permitir el enlace si es del mismo grupo

            // Primera alternativa: Eliminar mensaje y enviar advertencia en privado
            if (chat.antiLink === 'warn') {
                await conn.sendMessage(m.chat, { delete: m.key }); // Elimina el mensaje

                // Enviar advertencia al privado
                const privateWarning = `
🚨 *Hola, soy Admin-TK* 🛡️

Noté que enviaste un enlace en el grupo *${await conn.getName(m.chat)}*. 
Por favor, evita enviar enlaces a otros grupos, ya que esta acción no está permitida. 😊

¡Gracias por tu comprensión! 🤖
                `;
                await conn.sendMessage(m.sender, { text: privateWarning });

                console.log(`🔔 Admin-TK: Advertencia enviada en privado a ${m.sender}.`);
            }

            // Segunda alternativa: Eliminar mensaje, notificar en el grupo y advertir en privado
            if (chat.antiLink === 'remove') {
                await conn.sendMessage(m.chat, { delete: m.key }); // Elimina el mensaje

                // Notificar en el grupo
                await conn.sendMessage(m.chat, {
                    text: `⚠️ *Admin-TK informa*: 
El usuario *@${m.sender.split('@')[0]}* ha enviado un enlace de grupo, lo cual está prohibido aquí. 🚫
El mensaje fue eliminado y el usuario fue advertido.`,
                    mentions: [m.sender]
                });

                // Enviar advertencia al privado
                const privateNotification = `
🚨 *Hola, soy Admin-TK* 🛡️

Enviaste un enlace en el grupo *${await conn.getName(m.chat)}*, y esto está prohibido para mantener el orden. 
Tu mensaje fue eliminado y notifiqué al grupo el motivo. Por favor, evita enviar enlaces en el futuro. 🙏

Si tienes dudas, ¡puedes escribirme! 😊
                `;
                await conn.sendMessage(m.sender, { text: privateNotification });

                console.log(`🔔 Admin-TK: Mensaje eliminado y notificación enviada en privado a ${m.sender}.`);
            }
        } else {
            // Si el bot no es administrador, no puede tomar acción
            await conn.sendMessage(m.chat, {
                text: `❌ *Admin-TK informa*: 
No puedo eliminar mensajes ni advertir usuarios porque no tengo permisos de administrador. 🛑`,
            });
        }
    }

    return true;
}
