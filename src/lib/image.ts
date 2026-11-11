/**
 * Downscales an image file and returns the canvas.
 * Shared by the data-URL (mock) and Blob (Storage) helpers.
 */
async function drawScaled(file: File, maxWidth: number) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Could not process the image.')
  }
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas
}

/**
 * Downscales an image file and returns it as a JPEG data URL.
 * Keeps posters small enough to store in localStorage for the mock backend.
 */
export async function resizeImageToDataUrl(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  const canvas = await drawScaled(file, maxWidth)
  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Downscales an image file and returns it as a JPEG Blob, ready for a
 * Supabase Storage upload (smaller than sending the original photo).
 */
export async function resizeImageToBlob(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  const canvas = await drawScaled(file, maxWidth)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
      'image/jpeg',
      quality,
    )
  })
}
