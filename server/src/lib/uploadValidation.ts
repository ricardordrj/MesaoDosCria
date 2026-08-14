import path from 'node:path'

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'])

const CODE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.css',
  '.html',
  '.md',
  '.py',
  '.java',
  '.cs',
  '.go',
  '.rs',
  '.sql',
  '.yaml',
  '.yml',
  '.sh',
  '.ps1',
])

export type AttachmentKind = 'image' | 'code'

/**
 * A extensão é a fonte confiável aqui: o mimetype reportado pelo navegador/SO
 * para arquivos de código costuma ser inconsistente ou genérico.
 */
export function resolveAttachmentKind(fileName: string): AttachmentKind | undefined {
  const ext = path.extname(fileName).toLowerCase()
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (CODE_EXTENSIONS.has(ext)) return 'code'
  return undefined
}
