import { areJidsSameUser } from '@whiskeysockets/baileys';

export async function before(m, { participants, conn }) {
    if (m.isGroup) {
        let chat = global.db.data.chats[m.chat];

        // Verifica si la configuración "antiBot" está habilitada
        if (!chat.antiBot) return;

        let botJid = global.conn.user.jid;

        // Si el bot que ejecuta este código es el principal, no hace nada
        if (botJid === conn.user.jid) return;

        // Verifica si el JID del bot principal está en la lista de participantes
        let isBotPresent = participants.some(p => areJidsSameUser(botJid, p.id));

        if (isBotPresent) {
            // Anuncio en el grupo
            await conn.sendMessage(m.chat, {
                text: `👋 Hola a todos, soy *Admin-TK* 🛡️. Para mantener el orden, solo yo estoy autorizado como bot en este grupo. Si hay dudas o sugerencias, ¡escríbeme en privado! 😊`,
            });

            // Mensaje privado al bot eliminado
            const privateMessage = `
🛑 *Hola, soy Admin-TK.*

He detectado que también eres un bot, pero en este grupo solo está permitido un bot para evitar confusiones y mantener el orden. 
Por ello, he tenido que retirarte del grupo. Si tienes dudas o necesitas ayuda, ¡contáctame en privado!

🤖 *Admin-TK, tu administrador confiable.*
            `;

            // Esperar 5 segundos antes de eliminar al otro bot
            setTimeout(async () => {
                // Envía el mensaje privado al bot eliminado
                await conn.sendMessage(botJid, { text: privateMessage });

                // Expulsa al otro bot del grupo
                await conn.groupParticipantsUpdate(m.chat, [botJid], 'remove');

                // Reporta en consola
                console.log(`
📢 Admin-TK: He eliminado al bot ${botJid} del grupo ${m.chat}.
Razón: Solo un bot permitido en el grupo.
`);
            }, 5000);
        }
    }
}
