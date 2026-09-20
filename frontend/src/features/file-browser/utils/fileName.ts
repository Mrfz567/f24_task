export function fileExtension(name: string): string | null {
  const lastDot = name.lastIndexOf('.')

  if (lastDot <= 0 || lastDot === name.length - 1) {
    return null
  }

  return name.slice(lastDot + 1).toLowerCase()
}

export function displayedEntryName(name: string, type: 'file' | 'folder', showExtension: boolean): string {
  if (type === 'folder' || showExtension) {
    return name
  }

  const extension = fileExtension(name)

  return extension === null ? name : name.slice(0, -(extension.length + 1))
}
