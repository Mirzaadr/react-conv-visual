import React, { useState } from 'react';
import { LayerConfig, LayerType, LayerMetrics } from '../lib/cnn';
import { PlusCircle, Trash2, Settings2, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';

interface SidebarProps {
  inputSize: number;
  setInputSize: (size: number) => void;
  layers: LayerConfig[];
  setLayers: (layers: LayerConfig[]) => void;
  metrics: LayerMetrics[];
}

export default function Sidebar({ inputSize, setInputSize, layers, setLayers, metrics }: SidebarProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());

  const addLayer = (type: LayerType) => {
    const newId = Math.random().toString(36).substring(7);
    const newLayer: LayerConfig = {
      id: newId,
      type,
      k: type === 'Conv2D' ? 3 : 2,
      s: type === 'Conv2D' ? 1 : 2,
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
    <div className="w-80 h-full border-r border-slate-200 bg-white flex flex-col shadow-sm z-10 flex-shrink-0">
      <div className="p-5 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-600" />
          Configurator
        </h1>
        <p className="text-xs text-slate-500 mt-1">Design your CNN architecture</p>
      </div>
      
      <div className="flex-1 overflow-auto p-5 space-y-6">
        
        {/* Input */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Input Size (1D)</label>
          <input 
            type="number" 
            min="1" 
            value={inputSize} 
            onChange={(e) => setInputSize(parseInt(e.target.value) || 1)}
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
              className={`border border-slate-200 rounded-lg bg-white overflow-hidden shadow-sm transition-opacity ${draggedIndex === i ? 'opacity-50' : 'opacity-100'}`}
            >
              <div 
                className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center cursor-move"
                onClick={(e) => toggleCollapse(e, layer.id)}
              >
                <div className="flex items-center gap-1">
                  <GripVertical className="w-4 h-4 text-slate-400" />
                  <button className="p-0.5 text-slate-500 hover:text-indigo-600 transition-colors">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <span className="font-semibold text-sm text-slate-800 select-none ml-1">{i + 1}. {layer.type}</span>
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
                  <div className="p-3 grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Kernel (k)</label>
                      <input 
                        type="number" min="1" value={layer.k}
                        onChange={e => updateLayer(i, 'k', parseInt(e.target.value) || 1)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Stride (s)</label>
                      <input 
                        type="number" min="1" value={layer.s}
                        onChange={e => updateLayer(i, 's', parseInt(e.target.value) || 1)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Padding (p)</label>
                      <input 
                        type="number" min="0" value={layer.p}
                        onChange={e => updateLayer(i, 'p', parseInt(e.target.value) || 0)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] uppercase font-bold text-slate-400 mb-1">Dilation (d)</label>
                      <input 
                        type="number" min="1" value={layer.d}
                        onChange={e => updateLayer(i, 'd', parseInt(e.target.value) || 1)}
                        className="border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:border-indigo-400"
                      />
                    </div>
                  </div>
                  
                  {/* Metrics visualizer for this layer */}
                  {metrics[i] && (
                    <div className="bg-indigo-50/50 p-3 border-t border-slate-200 grid grid-cols-2 gap-y-2 text-xs">
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

        <div className="grid grid-cols-3 gap-2 pt-2">
          <button 
            onClick={() => addLayer('Conv2D')}
            className="flex items-center justify-center gap-1 bg-white border border-slate-300 text-slate-700 py-2 rounded shadow-sm text-sm font-medium hover:bg-slate-50"
          >
            <PlusCircle className="w-4 h-4" /> Conv
          </button>
          <button 
            onClick={() => addLayer('MaxPool2D')}
            className="flex items-center justify-center gap-1 bg-white border border-slate-300 text-slate-700 py-2 rounded shadow-sm text-sm font-medium hover:bg-slate-50"
          >
            <PlusCircle className="w-4 h-4" /> MaxP
          </button>
          <button 
            onClick={() => addLayer('AvgPool2D')}
            className="flex items-center justify-center gap-1 bg-white border border-slate-300 text-slate-700 py-2 rounded shadow-sm text-sm font-medium hover:bg-slate-50"
          >
            <PlusCircle className="w-4 h-4" /> AvgP
          </button>
        </div>

      </div>
    </div>
  );
}
