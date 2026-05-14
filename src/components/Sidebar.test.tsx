import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Sidebar from './Sidebar';
import { LayerConfig, LayerMetrics } from '../lib/cnn';

describe('Sidebar Component', () => {
  const mockSetInputSize = vi.fn();
  const mockSetLayers = vi.fn();
  const mockOnReset = vi.fn();

  const defaultLayers: LayerConfig[] = [
    { id: 'foo', type: 'Conv2D', k: 3, s: 1, p: 0, d: 1 },
  ];
  const defaultMetrics: LayerMetrics[] = [];

  it('renders correctly with given parameters', () => {
    render(
      <Sidebar 
        inputSize={32}
        setInputSize={mockSetInputSize}
        layers={defaultLayers}
        setLayers={mockSetLayers}
        metrics={defaultMetrics}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText(/1\. Conv2D/i)).toBeDefined();
    expect(screen.getByDisplayValue('32')).toBeDefined();
  });

  it('updates input size when typing in the input field', () => {
    render(
      <Sidebar 
        inputSize={32}
        setInputSize={mockSetInputSize}
        layers={defaultLayers}
        setLayers={mockSetLayers}
        metrics={defaultMetrics}
        onReset={mockOnReset}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '64' } });

    expect(mockSetInputSize).toHaveBeenCalledWith(64);
  });
});
