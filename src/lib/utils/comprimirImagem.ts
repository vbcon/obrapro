/**
 * Comprime uma imagem no navegador antes do upload.
 * - Reduz a maior dimensão para `maxLado` (mantém proporção)
 * - Converte para JPEG com a `qualidade` informada
 * - Corrige a orientação (fotos de celular deitadas)
 *
 * Arquivos que não são imagem (PDF, DWG, etc.) são retornados sem alteração.
 * Se algo falhar, retorna o arquivo original — nunca bloqueia o upload.
 */
export async function comprimirImagem(
  file: File,
  opts?: { maxLado?: number; qualidade?: number },
): Promise<File> {
  const maxLado   = opts?.maxLado   ?? 1600
  const qualidade = opts?.qualidade ?? 0.7

  // Só comprime imagens estáticas (GIF animado fica de fora)
  if (!file.type.startsWith('image/')) return file
  if (file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as any)

    let { width, height } = bitmap
    if (width > maxLado || height > maxLado) {
      const escala = Math.min(maxLado / width, maxLado / height)
      width  = Math.round(width  * escala)
      height = Math.round(height * escala)
    }

    const canvas = document.createElement('canvas')
    canvas.width  = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) { bitmap.close?.(); return file }

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob: Blob | null = await new Promise(res =>
      canvas.toBlob(res, 'image/jpeg', qualidade),
    )
    if (!blob) return file

    // Se não reduziu, mantém o original
    if (blob.size >= file.size) return file

    const nomeBase = file.name.replace(/\.(png|webp|heic|heif|jpe?g|gif|bmp|tiff?)$/i, '')
    return new File([blob], `${nomeBase}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}
