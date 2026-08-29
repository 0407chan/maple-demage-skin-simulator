type NamedItem = {
  name: string
}

export const getUniqueByName = <T extends NamedItem>(items: T[]): T[] => {
  const seenNames = new Set<string>()

  return items.filter((item) => {
    const name = item.name.trim()
    if (seenNames.has(name)) return false

    seenNames.add(name)
    return true
  })
}
