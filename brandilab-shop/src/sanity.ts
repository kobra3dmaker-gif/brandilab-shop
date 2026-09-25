import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const sanity = createClient({
  projectId: 'o8ywt0q6l',
  dataset: 'production',
  useCdn: true, // Usa la CDN globale superveloce per servire i JSON
  apiVersion: '2023-05-03',
})

const builder = imageUrlBuilder(sanity)
export function urlFor(source: any) {
  return builder.image(source)
}