// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import InfoTip from './InfoTip'

afterEach(cleanup)

describe('InfoTip', () => {
  it('renders an accessible help button and hides the tooltip by default', () => {
    render(<InfoTip text="Explains the streak." label="Streak" />)
    const btn = screen.getByRole('button', { name: /help: streak/i })
    expect(btn).toBeTruthy()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens the tooltip on click and shows the copy', () => {
    render(<InfoTip text="Explains the streak." label="Streak" />)
    fireEvent.click(screen.getByRole('button', { name: /help/i }))
    const tip = screen.getByRole('tooltip')
    expect(tip.textContent).toContain('Explains the streak.')
    expect(tip.textContent).toContain('Streak')
  })

  it('closes on Escape', () => {
    render(<InfoTip text="Body copy here." label="X" />)
    fireEvent.click(screen.getByRole('button', { name: /help/i }))
    expect(screen.getByRole('tooltip')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens on hover (mouse enter) and closes on leave', () => {
    const { container } = render(<InfoTip text="Hover body." label="H" />)
    const wrap = container.firstChild
    fireEvent.mouseEnter(wrap)
    expect(screen.getByRole('tooltip').textContent).toContain('Hover body.')
    fireEvent.mouseLeave(wrap)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
