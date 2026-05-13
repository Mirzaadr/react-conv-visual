import React from 'react';
import { LayerConfig, LayerMetrics } from '../lib/cnn';
import { X } from 'lucide-react';

interface TraceProps {
  inputSize: number;
  layers: LayerConfig[];
  metrics: LayerMetrics[];
  onClose: () => void;
}

export default function ComputationTrace({ inputSize, layers, metrics, onClose }: TraceProps) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform duration-300">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="font-bold text-slate-800 text-lg">Computation Trace</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <div className="text-sm border border-slate-200 rounded p-3 bg-slate-50 shadow-sm">
          <div className="font-semibold text-slate-700 mb-1">Layer 0 (Input)</div>
          <div className="font-mono text-xs text-slate-600 space-y-1">
            <div>in = {inputSize}</div>
            <div>j₀ = 1</div>
            <div>r₀ = 1</div>
            <div>start₀ = 0.5</div>
          </div>
        </div>

        {layers.map((layer, i) => {
          const m = metrics[i];
          if (!m) return null;

          const prevIn = i === 0 ? inputSize : metrics[i - 1].outSize;
          const prevJ = i === 0 ? 1 : metrics[i - 1].j;
          const prevR = i === 0 ? 1 : metrics[i - 1].r;
          const prevStart = i === 0 ? 0.5 : metrics[i - 1].start;
          
          return (
            <div key={`${layer.id}-trace`} className="text-sm border border-slate-200 rounded p-3 shadow-sm">
              <div className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-1">
                Layer {i + 1}: {layer.type}
              </div>
              <div className="font-mono text-xs text-slate-600 space-y-2">
                {m.keff !== layer.k && (
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-indigo-600 font-bold">k_eff</span> = {layer.k} + ({layer.k} - 1) × ({layer.d} - 1) = <span className="font-bold text-slate-900">{m.keff}</span>
                  </div>
                )}
                
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-blue-600 font-bold">out</span> = ⌊({prevIn} + 2×{layer.p} - {m.keff}) / {layer.s}⌋ + 1<br/>
                  = ⌊{(prevIn + 2 * layer.p - m.keff)} / {layer.s}⌋ + 1 = <span className="font-bold text-slate-900">{m.outSize}</span>
                </div>
                
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-emerald-600 font-bold">j_{i+1}</span> = {prevJ} × {layer.s} = <span className="font-bold text-slate-900">{m.j}</span>
                </div>
                
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-purple-600 font-bold">r_{i+1}</span> = {prevR} + ({m.keff} - 1) × {prevJ}<br/>
                  = {prevR} + {(m.keff - 1) * prevJ} = <span className="font-bold text-slate-900">{m.r}</span>
                </div>

                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-rose-600 font-bold">start_{i+1}</span> = {prevStart} + (({m.keff} - 1)/2 - {layer.p}) × {prevJ}<br/>
                  = {prevStart} + {((m.keff - 1) / 2 - layer.p) * prevJ} = <span className="font-bold text-slate-900">{m.start}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
