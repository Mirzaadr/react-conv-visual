export type LayerType = 'Conv2D' | 'MaxPool2D' | 'AvgPool2D' | 'ReLU' | 'Identity' | 'BatchNorm2D';

export interface LayerConfig {
  id: string;
  type: LayerType;
  k: number;
  s: number;
  p: number;
  d: number;
}

export interface LayerMetrics {
  id: string;
  type: LayerType;
  k: number;
  s: number;
  p: number;
  d: number;
  keff: number;
  inSize: number;
  outSize: number;
  j: number;
  r: number;
  start: number;
}

export function calculateNetwork(inputSize: number, layers: LayerConfig[]): LayerMetrics[] {
  const metrics: LayerMetrics[] = [];
  let currentIn = inputSize;
  let currentJ = 1;
  let currentR = 1;
  let currentStart = 0.5;

  for (const layer of layers) {
    const keff = layer.k + (layer.k - 1) * (layer.d - 1);
    const outSize = Math.floor((currentIn + 2 * layer.p - keff) / layer.s) + 1;
    
    // Clamp outSize to 0
    const safeOutSize = Math.max(0, outSize);

    const j = currentJ * layer.s;
    const r = currentR + (keff - 1) * currentJ;
    const start = currentStart + ((keff - 1) / 2 - layer.p) * currentJ;

    metrics.push({
      id: layer.id,
      type: layer.type,
      k: layer.k,
      s: layer.s,
      p: layer.p,
      d: layer.d,
      keff,
      inSize: currentIn,
      outSize: safeOutSize,
      j,
      r,
      start,
    });

    currentIn = safeOutSize;
    currentJ = j;
    currentR = r;
    currentStart = start;
  }

  return metrics;
}

export interface HoverMapResult {
  real: Record<number, number[]>;
  padded: Record<number, number[]>;
}

export function calculateHoverMap(
  layers: LayerConfig[],
  metrics: LayerMetrics[],
  hoveredRowIndex: number,
  hoveredCellIndex: number
): HoverMapResult {
  const hoverState: HoverMapResult = { real: {}, padded: {} };
  
  if (hoveredRowIndex < 0 || hoveredRowIndex > layers.length) return hoverState;

  let currentActiveReal = [hoveredCellIndex];
  
  // For the hovered row itself, we don't know the padded context (it depends on the next layer which isn't part of this reverse pass).
  // But we can just assume padded = real + p of the next layer, IF it exists.
  const nextLayer = layers[hoveredRowIndex];
  const p = nextLayer ? nextLayer.p : 0;
  
  hoverState.real[hoveredRowIndex] = [...currentActiveReal];
  hoverState.padded[hoveredRowIndex] = currentActiveReal.map(idx => idx + p);

  for (let i = hoveredRowIndex; i > 0; i--) {
    const layerDef = layers[i - 1];
    const layerMetric = metrics[i - 1]; 
    
    const activePadded = new Set<number>();
    for (const n of currentActiveReal) {
      for (let m = 0; m < layerDef.k; m++) {
        activePadded.add(n * layerDef.s + m * layerDef.d);
      }
    }
    
    const prevActivePaddedArr = Array.from(activePadded);
    hoverState.padded[i - 1] = prevActivePaddedArr; 
    
    currentActiveReal = prevActivePaddedArr
      .filter(idx => idx >= layerDef.p && idx < layerDef.p + layerMetric.inSize)
      .map(idx => idx - layerDef.p);
      
    hoverState.real[i - 1] = [...currentActiveReal];
  }

  return hoverState;
}
