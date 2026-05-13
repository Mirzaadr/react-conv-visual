import React, { useState, useMemo } from 'react';
import { LayerConfig, calculateNetwork, calculateHoverMap } from './lib/cnn';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ComputationTrace from './components/ComputationTrace';
import { Menu, X, Calculator } from 'lucide-react';

const DEFAULT_INPUT_SIZE = 32;
const DEFAULT_LAYERS: LayerConfig[] = [
  { id: '1', type: 'Conv2D', k: 3, s: 1, p: 0, d: 1 },
  { id: '2', type: 'MaxPool2D', k: 2, s: 2, p: 0, d: 1 },
  { id: '3', type: 'Conv2D', k: 3, s: 1, p: 1, d: 1 },
  { id: '4', type: 'Conv2D', k: 3, s: 1, p: 0, d: 1 },
];

export default function App() {
  const [inputSize, setInputSize] = useState(DEFAULT_INPUT_SIZE);
  const [layers, setLayers] = useState<LayerConfig[]>(DEFAULT_LAYERS);

  const metrics = useMemo(() => calculateNetwork(inputSize, layers), [inputSize, layers]);

  const [hoveredNeuron, setHoveredNeuron] = useState<{ row: number, cell: number } | null>(null);

  const hoverMap = useMemo(() => {
    if (!hoveredNeuron) return { real: {}, padded: {} };
    return calculateHoverMap(layers, metrics, hoveredNeuron.row, hoveredNeuron.cell);
  }, [layers, metrics, hoveredNeuron]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  const handleReset = () => {
    setInputSize(DEFAULT_INPUT_SIZE);
    setLayers(DEFAULT_LAYERS.map(l => ({ ...l })));
    setHoveredNeuron(null);
  };

  return (
    <div className="flex h-[100dvh] w-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 transition-colors focus:outline-none"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5"/>
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 w-80 bg-white z-40 transform transition-transform duration-300 shadow-2xl
        md:relative md:translate-x-0 md:shadow-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {sidebarOpen && (
          <button 
            className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 z-50 bg-slate-50 rounded-full"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5"/>
          </button>
        )}
        <Sidebar 
          inputSize={inputSize} 
          setInputSize={setInputSize} 
          layers={layers} 
          setLayers={setLayers} 
          metrics={metrics}
          onReset={handleReset}
        />
      </div>

      <div className="flex-1 w-full h-full overflow-auto relative bg-slate-100/50">
        <button
          onClick={() => setShowTrace(true)}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white px-3 py-2 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200 transition-colors"
        >
          <Calculator className="w-4 h-4 text-indigo-600" />
          <span className="hidden sm:inline">Math Trace</span>
        </button>

        <Canvas 
          inputSize={inputSize}
          layers={layers}
          metrics={metrics}
          hoverMap={hoverMap}
          hoveredNeuron={hoveredNeuron}
          setHoveredNeuron={setHoveredNeuron}
        />
      </div>

      {/* Computation Trace Modal / Panel */}
      {showTrace && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/20 z-40" 
            onClick={() => setShowTrace(false)} 
          />
          <ComputationTrace 
             inputSize={inputSize}
             layers={layers}
             metrics={metrics}
             onClose={() => setShowTrace(false)}
          />
        </>
      )}
    </div>
  );
}
