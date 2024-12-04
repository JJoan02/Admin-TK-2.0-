import fetch from 'node-fetch';
import { createWriteStream } from 'fs';
import { promises as fsPromises } from 'fs';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadImage = async (url, filename) => {
    const filePath = path.join(__dirname, `temp_image_${filename}.png`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo descargar la imagen: ${url}`);
    const stream = createWriteStream(filePath);
    response.body.pipe(stream);
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(filePath));
        stream.on('error', reject);
    });
};

const createPDF = async (images, part) => {
    const pdfPath = path.join(__dirname, `manga_part_${part}.pdf`);
    const doc = new PDFDocument();
    const stream = createWriteStream(pdfPath);
    doc.pipe(stream);
    for (const image of images) {
        doc.addPage().image(image, { fit: [500, 700], align: 'center', valign: 'center' });
    }
    doc.end();
    return new Promise((resolve, reject) => {
        stream.on('finish', () => resolve(pdfPath));
        stream.on('error', reject);
    });
};

let handler = async (m, { conn, args }) => {
    if (!args[0]) {
        await conn.reply(m.chat, `❌ **Admin-TK informa:**\nPor favor, ingresa el ID del manga que deseas descargar.`, m);
        return;
    }

    const mangaId = args[0];
    const langQuery = args[1] === 'es' ? 'translatedLanguage[]=es' : '';
    let statusMessage = await conn.reply(m.chat, `📖 **Admin-TK informa:**\nBuscando capítulos del manga...`, m);

    // Reacción inicial
    await conn.relayMessage(m.chat, {
        reactionMessage: { key: m.key, text: "🔍" } // Reacción de búsqueda
    });

    try {
        const response = await fetch(`https://api.mangadex.org/manga/${mangaId}/feed?${langQuery}`);
        if (!response.ok) throw new Error('No se pudo obtener información del manga.');
        const { data: chapters } = await response.json();
        if (!chapters || chapters.length === 0) {
            await conn.updateMessage(m.chat, statusMessage.key, `❌ **Admin-TK informa:**\nNo se encontraron capítulos para este manga.`);
            return;
        }

        const images = [];
        let part = 1;

        for (const chapter of chapters) {
            const { id: chapterId } = chapter;
            try {
                const imageResponse = await fetch(`https://api.mangadex.org/at-home/server/${chapterId}`);
                const imageData = await imageResponse.json();
                if (!imageData.chapter) continue;

                const { baseUrl, chapter: { hash, data } } = imageData;
                for (const filename of data) {
                    const imageUrl = `${baseUrl}/data/${hash}/${filename}`;
                    const imagePath = await downloadImage(imageUrl, filename);
                    images.push(imagePath);

                    if (images.length === 80) {
                        await conn.updateMessage(m.chat, statusMessage.key, `📦 **Admin-TK informa:**\nGenerando PDF, parte ${part}... 📄`);

                        // Reacción de progreso
                        await conn.relayMessage(m.chat, {
                            reactionMessage: { key: m.key, text: "📤" }
                        });

                        const pdfPath = await createPDF(images, part);
                        await conn.sendMessage(m.chat, { document: { url: pdfPath }, mimetype: 'application/pdf', fileName: `manga_part_${part}.pdf` }, { quoted: m });
                        await Promise.all(images.map(img => fsPromises.unlink(img)));
                        images.length = 0;
                        part++;
                    }
                }
            } catch (error) {
                await conn.updateMessage(m.chat, statusMessage.key, `⚠️ **Admin-TK informa:**\nError al procesar el capítulo ${chapterId}: ${error.message}`);
                continue;
            }
        }

        if (images.length > 0) {
            await conn.updateMessage(m.chat, statusMessage.key, `📦 **Admin-TK informa:**\nGenerando PDF final... 📄`);

            const pdfPath = await createPDF(images, part);
            await conn.sendMessage(m.chat, { document: { url: pdfPath }, mimetype: 'application/pdf', fileName: `manga_part_${part}.pdf` }, { quoted: m });
            await Promise.all(images.map(img => fsPromises.unlink(img)));
        }

        // Reacción final de éxito
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "✅" } // Reacción de éxito
        });

        await conn.updateMessage(m.chat, statusMessage.key, `✅ **Admin-TK informa:**\n¡Descarga completada con éxito! 🎉`);
    } catch (error) {
        await conn.updateMessage(m.chat, statusMessage.key, `❌ **Admin-TK informa:**\nOcurrió un error: ${error.message}`);

        // Reacción de error
        await conn.relayMessage(m.chat, {
            reactionMessage: { key: m.key, text: "❌" }
        });
    }
};

handler.help = ["mangadex <ID del manga> [es]"];
handler.tags = ['tools'];
handler.command = /^(mangadex)$/i;

export default handler;

