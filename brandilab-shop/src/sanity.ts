import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { sanityConfig } from './sanityConfig'

export const sanity = createClient({
  ...sanityConfig,
  useCdn: true, // Usa la CDN globale superveloce per servire i JSON
})

const builder = imageUrlBuilder(sanity)
export function urlFor(source: any) {
  return builder.image(source)
}