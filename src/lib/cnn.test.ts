import { describe, it, expect } from 'vitest';
import { calculateNetwork, calculateHoverMap, LayerConfig } from './cnn';

describe('calculateNetwork', () => {
  it('calculates metrics for a single Conv2D layer', () => {
    const inputSize = 32;
    const layers: LayerConfig[] = [
      { id: '1', type: 'Conv2D', k: 3, s: 1, p: 0, d: 1 },
    ];

    const metrics = calculateNetwork(inputSize, layers);

    expect(metrics).toHaveLength(1);
    expect(metrics[0].outSize).toBe(30); // (32 + 2*0 - 3) / 1 + 1 = 30
    expect(metrics[0].j).toBe(1); // 1 * 1 = 1
    expect(metrics[0].r).toBe(3); // 1 + (3 - 1) * 1 = 3
    expect(metrics[0].start).toBe(1.5); // 0.5 + ((3 - 1) / 2 - 0) * 1 = 1.5
  });

  it('calculates metrics for multiple layers', () => {
    const inputSize = 32;
    const layers: LayerConfig[] = [
      { id: '1', type: 'Conv2D', k: 3, s: 1, p: 0, d: 1 },
      { id: '2', type: 'MaxPool2D', k: 2, s: 2, p: 0, d: 1 },
    ];

    const metrics = calculateNetwork(inputSize, layers);

    expect(metrics).toHaveLength(2);
    
    // Layer 1
    expect(metrics[0].outSize).toBe(30);
    expect(metrics[0].j).toBe(1);
    expect(metrics[0].r).toBe(3);
    
    // Layer 2
    expect(metrics[1].outSize).toBe(15); // (30 + 0 - 2) / 2 + 1 = 15
    expect(metrics[1].j).toBe(2);
    expect(metrics[1].r).toBe(4); // 3 + (2 - 1) * 1 = 4
    expect(metrics[1].start).toBe(2); // 1.5 + ((2 - 1) / 2 - 0) * 1 = 2
  });

  it('handles padding correctly', () => {
    const inputSize = 32;
    const layers: LayerConfig[] = [
      { id: '1', type: 'Conv2D', k: 3, s: 1, p: 1, d: 1 },
    ];

    const metrics = calculateNetwork(inputSize, layers);

    expect(metrics).toHaveLength(1);
    expect(metrics[0].outSize).toBe(32); // (32 + 2 - 3) / 1 + 1 = 32
  });

  it('handles dilation correctly', () => {
    const inputSize = 32;
    const layers: LayerConfig[] = [
      { id: '1', type: 'Conv2D', k: 3, s: 1, p: 0, d: 2 },
    ];

    const metrics = calculateNetwork(inputSize, layers);

    expect(metrics).toHaveLength(1);
    expect(metrics[0].keff).toBe(5); // 3 + (3 - 1) * 1 = 5
    expect(metrics[0].outSize).toBe(28); // (32 + 0 - 5) / 1 + 1 = 28
  });
});

describe('calculateHoverMap', () => {
  it('calculates back-propagated fields correctly', () => {
    const inputSize = 32;
    const layers: LayerConfig[] = [
      { id: '1', type: 'Conv2D', k: 3, s: 1, p: 0, d: 1 },
      { id: '2', type: 'MaxPool2D', k: 2, s: 2, p: 0, d: 1 },
    ];

    const metrics = calculateNetwork(inputSize, layers);

    // Hover on output of layer 2 at index 0
    const hoverState = calculateHoverMap(layers, metrics, 2, 0);

    // Layer 2 is hovered real cell 0
    expect(hoverState.real[2]).toEqual([0]);
    // Layer 2's 'padded' state depends on if there's a next layer but since there isn't, p=0
    expect(hoverState.padded[2]).toEqual([0]);

    // Layer 1's real cells connected to Layer 2 cell 0
    // MaxPool k=2, s=2: relates to padded cells 0, 1 -> real cells 0, 1
    expect(hoverState.padded[1]).toEqual([0, 1]);
    expect(hoverState.real[1]).toEqual([0, 1]);

    // Input Layer (Layer 0)'s connected real cells
    // Conv2D k=3, s=1: for out cells 0, 1 -> padded cells 0, 1, 2, 3 -> real cells 0, 1, 2, 3
    expect(hoverState.padded[0]).toEqual([0, 1, 2, 3]);
    expect(hoverState.real[0]).toEqual([0, 1, 2, 3]);
  });
});
