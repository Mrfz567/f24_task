import { describe, expect, it } from 'vitest'
import { displayedEntryName, fileExtension } from './fileName'

describe('file name display helpers', () => {
  it('hides only the final extension', () => {
    expect(displayedEntryName('report.final.pdf', 'file', false)).toBe('report.final')
    expect(fileExtension('report.final.pdf')).toBe('pdf')
  })

  it('keeps hidden files and extensionless names unchanged', () => {
    expect(displayedEntryName('.gitignore', 'file', false)).toBe('.gitignore')
    expect(displayedEntryName('README', 'file', false)).toBe('README')
  })

  it('never changes folder names', () => {
    expect(displayedEntryName('Archive.2026', 'folder', false)).toBe('Archive.2026')
  })
})
