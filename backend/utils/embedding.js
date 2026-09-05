import { pipeline } from '@xenova/transformers';

let embeddingModel = null;
let isInitializing = null;

const TARGET_DIMENSION = 1536;

/**
 * Initialize embedding model (runs once on startup and caches model)
 * @returns {Promise<void>}
 */
export async function initializeEmbedder() {
  if (embeddingModel) {
    return;
  }

  if (isInitializing) {
    await isInitializing;
    return;
  }

  isInitializing = (async () => {
    try {
      console.log('Loading embedding model... (first time takes 1-2 min)');
      embeddingModel = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      console.log('✅ Embedding model loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load embedding model:', error.message);
      throw new Error(`Failed to load embedding model: ${error.message}`);
    } finally {
      isInitializing = null;
    }
  })();

  await isInitializing;
}

/**
 * Generate embedding vector for input text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - 1536-dimensional embedding vector
 */
export async function generateEmbedding(text) {
  if (!embeddingModel) {
    await initializeEmbedder();
  }

  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text cannot be empty for embedding generation');
    }

    const output = await embeddingModel(text.trim(), {
      pooling: 'mean',
      normalize: true,
    });

    let vector = Array.from(output.data);

    // Xenova/all-MiniLM-L6-v2 produces a 384-dimensional vector.
    // When 1536 dimensions are required by the vector database schema (VECTOR(1536)),
    // zero-padding the normalized vector preserves cosine similarity.
    if (vector.length < TARGET_DIMENSION) {
      const padding = new Array(TARGET_DIMENSION - vector.length).fill(0);
      vector = vector.concat(padding);
    } else if (vector.length > TARGET_DIMENSION) {
      vector = vector.slice(0, TARGET_DIMENSION);
    }

    return vector;
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}
