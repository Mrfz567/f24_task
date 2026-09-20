import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EntryIcon } from './EntryIcon'

describe('EntryIcon', () => {
  it.each([
    ['proposal.docx', 'DOC'],
    ['budget.xlsx', 'XLS'],
    ['slides.pptx', 'PPT'],
  ])('renders an Office badge for %s', (name, badge) => {
    const { container } = render(<EntryIcon name={name} type="file" />)

    expect(container).toHaveTextContent(badge)
  })

  it('uses different folder artwork for empty and non-empty folders', () => {
    const { container, rerender } = render(
      <EntryIcon hasChildren={false} name="Empty" type="folder" />,
    )
    const emptyFolderMarkup = container.innerHTML

    rerender(<EntryIcon hasChildren name="With files" type="folder" />)

    expect(container.innerHTML).not.toBe(emptyFolderMarkup)
  })
})
