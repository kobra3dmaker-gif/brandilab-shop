/**
 * Turns a product description pasted from a marketplace listing (emoji bullets, "---"
 * separators, ALL-CAPS "LABEL:" lines, "•" lists) into structured blocks for the product sheet.
 */
export type DescriptionBlock =
  | { type: 'lead' | 'p'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: { label?: string; text: string }[] }
  | { type: 'rule' }

const LEADING_SYMBOLS = /^[\p{Extended_Pictographic}\p{Emoji_Presentation}️‍\s]+/u
const BULLET = /^[•\-–*]\s+/

function sentenceCase(text: string) {
  const lower = text.toLocaleLowerCase('it')
  return lower.charAt(0).toLocaleUpperCase('it') + lower.slice(1)
}

function isShouting(text: string) {
  // "NOTA BENE (Contenuto della Confezione)" shouts too: judge the words before any parenthesis
  const letters = text.split('(')[0]!.replace(/[^\p{L}]/gu, '')
  return letters.length > 2 && letters === letters.toLocaleUpperCase('it')
}

export function parseDescription(raw: string | undefined): DescriptionBlock[] {
  if (!raw) return []
  const blocks: DescriptionBlock[] = []

  for (const original of raw.split(/\r?\n/)) {
    const line = original.replace(LEADING_SYMBOLS, '').trim()
    if (!line) continue

    if (/^[-–—_*=]{3,}$/.test(line)) {
      if (blocks.length && blocks[blocks.length - 1]!.type !== 'rule') blocks.push({ type: 'rule' })
      continue
    }

    if (BULLET.test(line)) {
      const body = line.replace(BULLET, '')
      const colon = body.indexOf(':')
      const item =
        colon > 0 && colon <= 40
          ? { label: body.slice(0, colon).trim(), text: body.slice(colon + 1).trim() }
          : { text: body }
      const last = blocks[blocks.length - 1]
      if (last?.type === 'list') last.items.push(item)
      else blocks.push({ type: 'list', items: [item] })
      continue
    }

    const headingMatch = line.match(/^(.{2,60}):$/)
    if (headingMatch && (isShouting(headingMatch[1]!) || headingMatch[1]!.split(' ').length <= 6)) {
      const text = headingMatch[1]!.trim()
      blocks.push({ type: 'heading', text: isShouting(text) ? sentenceCase(text) : text })
      continue
    }

    blocks.push({ type: blocks.length === 0 ? 'lead' : 'p', text: line })
  }

  while (blocks.length && blocks[blocks.length - 1]!.type === 'rule') blocks.pop()
  return blocks
}
