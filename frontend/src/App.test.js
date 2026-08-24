import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the asset tracker', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /asset inventory/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add asset/i })).toBeInTheDocument();
});
