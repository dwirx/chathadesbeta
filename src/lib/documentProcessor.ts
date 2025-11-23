// Document Processor for RAG - Extracts text from various file formats

export interface ProcessedDocument {
  id: string;
  filename: string;
  content: string;
  size: number;
  type: string;
  timestamp: number;
  chunks?: string[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
}

/**
 * Extract text from uploaded file
 */
export async function extractTextFromFile(
  file: File
): Promise<ProcessedDocument> {
  const fileType = file.type;
  const filename = file.name;
  const size = file.size;
  const timestamp = Date.now();
  const id = `doc-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

  let content = "";

  try {
    if (fileType === "text/plain" || filename.endsWith(".txt")) {
      content = await extractFromText(file);
    } else if (fileType === "text/markdown" || filename.endsWith(".md")) {
      content = await extractFromMarkdown(file);
    } else if (
      fileType === "application/json" ||
      filename.endsWith(".json")
    ) {
      content = await extractFromJSON(file);
    } else if (fileType === "text/html" || filename.endsWith(".html")) {
      content = await extractFromHTML(file);
    } else if (fileType === "text/csv" || filename.endsWith(".csv")) {
      content = await extractFromCSV(file);
    } else if (
      fileType === "application/pdf" ||
      filename.endsWith(".pdf")
    ) {
      // PDF extraction would require pdf.js or similar library
      throw new Error(
        "PDF support coming soon. Please convert to text format."
      );
    } else if (
      fileType.includes("word") ||
      filename.endsWith(".doc") ||
      filename.endsWith(".docx")
    ) {
      throw new Error(
        "Word document support coming soon. Please convert to text format."
      );
    } else {
      throw new Error(
        `Unsupported file type: ${fileType}. Supported: TXT, MD, JSON, HTML, CSV`
      );
    }

    // Create chunks for better RAG performance
    const chunks = chunkText(content, 1000); // 1000 chars per chunk

    return {
      id,
      filename,
      content,
      size,
      type: fileType,
      timestamp,
      chunks,
    };
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw error;
  }
}

/**
 * Extract text from plain text file
 */
async function extractFromText(file: File): Promise<string> {
  return await file.text();
}

/**
 * Extract text from markdown file
 */
async function extractFromMarkdown(file: File): Promise<string> {
  const text = await file.text();
  // Remove markdown syntax for cleaner text
  return text
    .replace(/#{1,6}\s/g, "") // Remove headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.+?)\*/g, "$1") // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links, keep text
    .replace(/`{1,3}(.+?)`{1,3}/g, "$1") // Remove code formatting
    .replace(/^\s*[-*+]\s/gm, "") // Remove list markers
    .replace(/^\s*\d+\.\s/gm, ""); // Remove numbered list markers
}

/**
 * Extract text from JSON file
 */
async function extractFromJSON(file: File): Promise<string> {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    return JSON.stringify(json, null, 2);
  } catch (error) {
    throw new Error("Invalid JSON file");
  }
}

/**
 * Extract text from HTML file
 */
async function extractFromHTML(file: File): Promise<string> {
  const html = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove script and style tags
  const scripts = doc.querySelectorAll("script, style");
  scripts.forEach((script) => script.remove());

  // Get text content
  return doc.body.textContent || "";
}

/**
 * Extract text from CSV file
 */
async function extractFromCSV(file: File): Promise<string> {
  const text = await file.text();
  return text;
}

/**
 * Chunk text into smaller pieces for RAG
 */
export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    const chunk = text.slice(start, end);
    chunks.push(chunk.trim());

    // Move start position with overlap
    start = end - overlap;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Format document content for RAG context
 */
export function formatDocumentForRAG(doc: ProcessedDocument): string {
  return `
Document: ${doc.filename}
Type: ${doc.type}
Size: ${formatFileSize(doc.size)}
---
${doc.content}
`;
}

/**
 * Format multiple documents for RAG context
 */
export function formatDocumentsForRAG(docs: ProcessedDocument[]): string {
  if (docs.length === 0) return "";

  let context = "\n[Uploaded Documents Context]\n\n";

  docs.forEach((doc, index) => {
    context += `Document ${index + 1}: ${doc.filename}\n`;
    context += `${doc.content.substring(0, 2000)}${doc.content.length > 2000 ? "..." : ""}\n\n`;
  });

  context += "\nPlease use the above documents to provide accurate answers.\n\n---\n\n";

  return context;
}

/**
 * Search within document content
 */
export function searchInDocuments(
  docs: ProcessedDocument[],
  query: string
): ProcessedDocument[] {
  const lowerQuery = query.toLowerCase();

  return docs.filter((doc) =>
    doc.content.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Find relevant chunks from documents
 */
export function findRelevantChunks(
  docs: ProcessedDocument[],
  query: string,
  maxChunks: number = 5
): string[] {
  const lowerQuery = query.toLowerCase();
  const relevantChunks: { chunk: string; score: number }[] = [];

  docs.forEach((doc) => {
    if (doc.chunks) {
      doc.chunks.forEach((chunk) => {
        const lowerChunk = chunk.toLowerCase();
        // Simple relevance scoring based on keyword matches
        const score = calculateRelevance(lowerChunk, lowerQuery);

        if (score > 0) {
          relevantChunks.push({ chunk, score });
        }
      });
    }
  });

  // Sort by score and return top chunks
  return relevantChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .map((item) => item.chunk);
}

/**
 * Calculate relevance score between text and query
 */
function calculateRelevance(text: string, query: string): number {
  const queryWords = query.split(/\s+/);
  let score = 0;

  queryWords.forEach((word) => {
    if (word.length > 2) {
      // Ignore very short words
      const regex = new RegExp(word, "gi");
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
  });

  return score;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Validate file for upload
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "text/plain",
    "text/markdown",
    "application/json",
    "text/html",
    "text/csv",
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size exceeds 10MB limit",
    };
  }

  const isAllowedType =
    allowedTypes.includes(file.type) ||
    file.name.endsWith(".txt") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".json") ||
    file.name.endsWith(".html") ||
    file.name.endsWith(".csv");

  if (!isAllowedType) {
    return {
      valid: false,
      error: "Unsupported file type. Supported: TXT, MD, JSON, HTML, CSV",
    };
  }

  return { valid: true };
}
