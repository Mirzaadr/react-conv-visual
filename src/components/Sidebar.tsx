import React, { useState } from 'react';
import { LayerConfig, LayerType, LayerMetrics } from '../lib/cnn';
import { PlusCircle, Trash2, Settings2, GripVertical, ChevronRight, ChevronDown, RotateCcw, Info } from 'lucide-react';

const LAYER_INFO: Record<LayerType, string> = {
  Conv2D: "Applies a 2D convolution over an input signal. Extracts features using learnable filters.",
  MaxPool2D: "Applies a 2D max pooling. Downsamples by taking the max value over a spatial window.",
  AvgPool2D: "Applies a 2D average pooling. Downsamples by taking the avg value over a spatial window.",
  ReLU: "Applies the rectified linear unit activation function. Does not affect spatial dimensions.",
  Identity: "Passes the input unchanged. Acts as a skip connection.",
  BatchNorm2D: "Normalizes the output of the previous layer. Does not affect spatial dimensions."
};

interface SidebarProps {
  inputSize: number;
  setInputSize: (size: number) => void;
  layers: LayerConfig[];
  setLayers: (layers: LayerConfig[]) => void;
  metrics: LayerMetrics[];
  onReset: () => void;
}

export default function Sidebar({ inputSize, setInputSize, layers, setLayers, metrics, onReset }: SidebarProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());
  const [selectedNewType, setSelectedNewType] = useState<LayerType>('Conv2D');

  const addLayer = (type: LayerType) => {
    const newId = Math.random().toString(36).substring(7);
    const isSpatial = type === 'Conv2D' || type === 'MaxPool2D' || type === 'AvgPool2D';
    const newLayer: LayerConfig = {
      id: newId,
      type,
      k: isSpatial ? (type === 'Conv2D' ? 3 : 2) : 1,
      s: isSpatial ? (type === 'Conv2D' ? 1 : 2) : 1,
      p: 0,
      d: 1,
    };
    setLayers([...layers, newLayer]);
  };

  const removeLayer = (index: number) => {
    setLayers(layers.filter((_, i) => i !== index));
  };

  const updateLayer = (index: number, key: keyof LayerConfig, value: number | string) => {
    const newLayers = [...layers];
    newLayers[index] = { ...newLayers[index], [key]: value };
    setLayers(newLayers);
  };

  const toggleCollapse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCollapsedLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newLayers = [...layers];
    const [draggedLayer] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(dropIndex, 0, draggedLayer);
    
    setLayers(newLayers);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="w-full h-full border-r border-slate-200 bg-white flex flex-col shadow-sm flex-shrink-0">
      <div className="p-5 border-b border-slate-200 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600" />
            Configurator
          </h1>
          <p className="text-xs text-slate-500 mt-1">Design your CNN architecture</p>
        </div>
        <button 
          onClick={onReset}
          title="Reset to default configuration"
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-5 space-y-6">
        
        {/* Input */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Input Size (1D)</label>
          <input 
            type="number" 
            min="1" 
            max="256"
            value={inputSize} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setInputSize(isNaN(val) ? 1 : Math.min(256, Math.max(1, val)));
            }}
            className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Layers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Layers</h2>
          </div>
          
          {layers.map((layer, i) => {
            const isCollapsed = collapsedLayers.has(layer.id);
            return (
            <div 
              key={layer.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`border border-slate-200 rounded-lg bg-white relative hover:z-50 shadow-sm transition-opacity ${draggedIndex === i ? 'opacity-50' : 'opacity-100'}`}
            >
              <div 
                className="bg-slate-50 rounded-t-lg px-3 py-2 border-b border-slate-200 flex justify-between items-center cursor-move"
                onClick={(e) => toggleCollapse(e, layer.id)}
              >
                <div className="flex items-center gap-1">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  <button className="p-0.5 text-slate-500 hover:text-indigo-600 transition-colors">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <span className="font-semibold text-sm text-slate-800 select-none ml-1">{i + 1}. {layer.type}</span>
                  <div className="relative ml-1 flex items-center group">
                    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 cursor-help" />
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 p-2 bg-slate-800 text-white text-xs font-normal normal-case rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                      {LAYER_INFO[layer.type]}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-slate-800"></div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLayer(i);
                  }}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-red-500 transition-colors relative z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {!isCollapsed && (
                <>
                  {layer.type === 'ReLU' || layer.type === 'Identity' || layer.type === 'BatchNorm2D' ? (
                    <div className="p-4 text-xs text-slate-500 text-center italic border-b border-slate-100">
                      This layer operates element-wise and does not alter spatial dimensions.
                    </div>
                  ) : (
                  <div className="p-3 grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Kernel (k)</label>
                      <input 
                        type="number" min="1" max="32" value={layer.k}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          updateLayer(i, 'k', isNaN(val) ? 1 : Math.min(32, Math.max(1, val)));
                        }}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Stride (s)</label>
                      <input 
                        type="number" min="1" max="32" value={layer.s}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          updateLayer(i, 's', isNaN(val) ? 1 : Math.min(32, Math.max(1, val)));
                        }}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Padding (p)</label>
                      <input 
                        type="number" min="0" max="32" value={layer.p}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          updateLayer(i, 'p', isNaN(val) ? 0 : Math.min(32, Math.max(0, val)));
                        }}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Dilation (d)</label>
                      <input 
                        type="number" min="1" max="32" value={layer.d}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          updateLayer(i, 'd', isNaN(val) ? 1 : Math.min(32, Math.max(1, val)));
                        }}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  )}
                  
                  {/* Metrics visualizer for this layer */}
                  {metrics[i] && (
                    <div className="bg-indigo-50/50 p-3 border-t border-slate-200 grid grid-cols-2 gap-y-2 text-xs rounded-b-lg">
                      <div className="text-slate-500 font-medium">Output: <span className="text-slate-900">{metrics[i].outSize}</span></div>
                      <div className="text-slate-500 font-medium">RF (r): <span className="text-slate-900">{metrics[i].r}</span></div>
                      <div className="text-slate-500 font-medium">Jump (j): <span className="text-slate-900">{metrics[i].j}</span></div>
                      <div className="text-slate-500 font-medium">Start: <span className="text-slate-900">{metrics[i].start}</span></div>
                      {metrics[i].keff !== layer.k && (
                        <div className="text-slate-500 font-medium col-span-2">Eff. Kernel: <span className="text-slate-900">{metrics[i].keff}</span></div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            );
          })}
          
        </div>

        <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-200">
          <select 
            value={selectedNewType}
            onChange={(e) => setSelectedNewType(e.target.value as LayerType)}
            className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="Conv2D">Conv2D</option>
            <option value="MaxPool2D">MaxPool2D</option>
            <option value="AvgPool2D">AvgPool2D</option>
            <option value="BatchNorm2D">BatchNorm2D</option>
            <option value="ReLU">ReLU</option>
            <option value="Identity">Identity</option>
          </select>
          <button 
            onClick={() => addLayer(selectedNewType)}
            className="flex items-center justify-center bg-indigo-600 text-white p-2 rounded-md shadow-sm hover:bg-indigo-700 transition-colors"
            title="Add Layer"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
