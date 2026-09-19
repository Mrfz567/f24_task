import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the file system foundation', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'F24 File System' }),
    ).toBeInTheDocument()
  })
})
