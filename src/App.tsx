import React, { useState, useMemo } from 'react';
import { LayerConfig, calculateNetwork, calculateHoverMap } from './lib/cnn';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';

export default function App() {
  const [inputSize, setInputSize] = useState(32);
  const [layers, setLayers] = useState<LayerConfig[]>([
    { id: '1', type: 'Conv2D', k: 3, s: 1, p: 0, d: 1 },
    { id: '2', type: 'MaxPool2D', k: 2, s: 2, p: 0, d: 1 },
    { id: '3', type: 'Conv2D', k: 3, s: 1, p: 1, d: 1 },
    { id: '4', type: 'Conv2D', k: 3, s: 1, p: 0, d: 1 },
  ]);

  const metrics = useMemo(() => calculateNetwork(inputSize, layers), [inputSize, layers]);

  const [hoveredNeuron, setHoveredNeuron] = useState<{ row: number, cell: number } | null>(null);

  const hoverMap = useMemo(() => {
    if (!hoveredNeuron) return { real: {}, padded: {} };
    return calculateHoverMap(layers, metrics, hoveredNeuron.row, hoveredNeuron.cell);
  }, [layers, metrics, hoveredNeuron]);

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar 
        inputSize={inputSize} 
        setInputSize={setInputSize} 
        layers={layers} 
        setLayers={setLayers} 
        metrics={metrics}
      />
      <div className="flex-1 overflow-auto relative bg-slate-100/50">
        <Canvas 
          inputSize={inputSize}
          layers={layers}
          metrics={metrics}
          hoverMap={hoverMap}
          hoveredNeuron={hoveredNeuron}
          setHoveredNeuron={setHoveredNeuron}
        />
      </div>
    </div>
  );
}
