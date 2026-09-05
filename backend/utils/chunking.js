/**
 * Split text into chunks
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Size of each chunk (default 500)
 * @param {number} overlap - Overlap between chunks (default 50)
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, chunkSize = 500, overlap = 50) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }

  const chunks = [];
  const cleanText = text.replace(/\s+/g, ' ').trim();

  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  const step = Math.max(1, chunkSize - overlap);

  for (let i = 0; i < cleanText.length; i += step) {
    const chunk = cleanText.slice(i, i + chunkSize);
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}
