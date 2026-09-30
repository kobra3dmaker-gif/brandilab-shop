import type { SanityImageSource } from '@sanity/image-url'

export interface Product {
  _id: string
  title: string
  slug?: { current: string }
  price: number
  material?: string
  description: string
  image: SanityImageSource
  category?: string
  color?: string
  featured?: boolean
}
