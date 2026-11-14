import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('App', () => {
  it('renders application header', () => {
    render(<App />);
    expect(screen.getAllByText(/VoxFable/i).length).toBeGreaterThan(0);
  });
});

