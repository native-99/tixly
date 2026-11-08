/**
 * Downscales an image file and returns it as a JPEG data URL.
 * Keeps posters small enough to store in localStorage for the mock backend.
 */
export async function resizeImageToDataUrl(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not process the image.')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return canvas.toDataURL('image/jpeg', quality)
}
