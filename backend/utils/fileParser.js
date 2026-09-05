import pdfParse from 'pdf-parse';

/**
 * Extract text from uploaded file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - Extracted text
 */
export async function extractText(file) {
  if (!file) {
    throw new Error('No file provided for extraction');
  }

  const { mimetype, buffer, originalname } = file;

  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty');
  }

  try {
    const isPdf = mimetype === 'application/pdf' || originalname?.toLowerCase().endsWith('.pdf');
    const isTxtOrMd =
      mimetype === 'text/plain' ||
      mimetype === 'text/markdown' ||
      originalname?.toLowerCase().endsWith('.txt') ||
      originalname?.toLowerCase().endsWith('.md');

    // Handle PDF files
    if (isPdf) {
      const parsePdf = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse);
      const pdfData = await parsePdf(buffer);
      if (!pdfData || typeof pdfData.text !== 'string') {
        throw new Error('Could not parse PDF content or file is corrupt');
      }
      return pdfData.text;
    }

    // Handle TXT and Markdown files
    if (isTxtOrMd) {
      return buffer.toString('utf-8');
    }

    // Unsupported format
    throw new Error(
      `Unsupported file type: ${mimetype || 'unknown'}. Supported formats: PDF, TXT, MD`
    );
  } catch (error) {
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}
