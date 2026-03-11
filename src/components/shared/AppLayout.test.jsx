import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AppLayout from './AppLayout.jsx';
import { useCardStore } from '../../store/useCardStore.js';
import { getDayKey, useProgressStore } from '../../store/useProgressStore.js';
import { useUiStore } from '../../store/useUiStore.js';
import { useWordStore } from '../../store/useWordStore.js';

function renderLayout(initialPath = '/reader') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<div>Dashboard page</div>} />
          <Route path="/reader" element={<div>Reader page</div>} />
          <Route path="/practice" element={<div>Practice page</div>} />
          <Route path="/flashcards" element={<div>Flashcards page</div>} />
          <Route path="/settings" element={<div>Settings page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  it('shows notification count and opens the popover', async () => {
    const user = userEvent.setup();

    useUiStore.getState().pushNotification({ title: 'Sessao concluida', read: false });

    renderLayout('/reader');

    expect(screen.getByTestId('notifications-unread-count')).toHaveTextContent('1');

    await user.click(screen.getByTestId('notifications-trigger'));

    expect(screen.getByTestId('notifications-panel')).toBeInTheDocument();
    expect(screen.getByText('Sessao concluida')).toBeInTheDocument();
  });

  it('renders navigation badges without breaking the route shell', () => {
    const todayKey = getDayKey();

    useProgressStore.setState((state) => ({
      ...state,
      dailyStats: {
        ...state.dailyStats,
        [todayKey]: {
          ...(state.dailyStats[todayKey] || {}),
          readerWords: 3,
        },
      },
    }));
    useCardStore.setState({
      flashcards: [
        {
          id: 'card-1',
          sentenceId: 'sentence-1',
          wordId: 'word-1',
          front: 'frente',
          back: 'back',
          interval: 1,
          nextReview: Date.now() - 1000,
          reviewCount: 0,
        },
      ],
    });
    useWordStore.getState().addWord('persist', { initialStatus: 'ativa' });

    renderLayout('/reader');

    expect(screen.getByText('Reader page')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-reader')).toHaveTextContent('3');
    expect(screen.getByTestId('nav-item-practice')).toHaveTextContent('PROMPT');
    expect(screen.getByTestId('nav-item-flashcards')).toHaveTextContent('1');
  });
});
