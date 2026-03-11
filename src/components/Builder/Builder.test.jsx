import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Builder from './Builder.jsx'
import { useCardStore } from '../../store/useCardStore.js'
import { useProgressStore } from '../../store/useProgressStore.js'

async function clickTokensInOrder(user, words) {
  for (const word of words) {
    const bankLane = screen.getByTestId('builder-bank-lane')
    await user.click(within(bankLane).getByRole('button', { name: new RegExp(`^${word}$`, 'i') }))
  }
}

describe('Builder', () => {
  it('supports click-based assembly, recovery after an incorrect attempt and saving to flashcards', async () => {
    const user = userEvent.setup()

    render(
      <Builder
        initialWords={[
          {
            wordId: 'word-1',
            wordText: 'relentless',
            originalSentence: 'The team was relentless in pursuing their goal.',
          },
        ]}
      />,
    )

    await screen.findByText(/Exercício 1 de 3/i)

    await clickTokensInOrder(user, ['relentless', 'I'])
    await user.click(screen.getByRole('button', { name: /verificar/i }))
    expect(await screen.findByText(/Ainda nao ficou certo/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /limpar/i }))
    await clickTokensInOrder(user, ['I', 'learned', 'the', 'word', 'relentless', 'today'])
    await user.click(screen.getByRole('button', { name: /verificar/i }))

    expect(await screen.findByText(/Resposta correta/i)).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText(/Type your own sentence here/i),
      'I stay relentless when I study.',
    )
    await user.click(screen.getByRole('button', { name: /Salvar no Flashcard/i }))
    expect(useCardStore.getState().flashcards).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /Próxima/i }))
    expect(await screen.findByText(/Exercício 2 de 3/i)).toBeInTheDocument()
    expect(useProgressStore.getState().totals.productionWrites).toBe(1)
  })
})
