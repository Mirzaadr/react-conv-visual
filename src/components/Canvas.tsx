import React, { useMemo, useState } from 'react';
import { LayerConfig, LayerMetrics, HoverMapResult } from '../lib/cnn';
import { cn } from '../lib/utils';

// CanvasProps and imports
interface CanvasProps {
  inputSize: number;
  layers: LayerConfig[];
  metrics: LayerMetrics[];
  hoverMap: HoverMapResult;
  hoveredNeuron: { row: number, cell: number } | null;
  setHoveredNeuron: (n: { row: number, cell: number } | null) => void;
}

export default function Canvas({ inputSize, layers, metrics, hoverMap, hoveredNeuron, setHoveredNeuron }: CanvasProps) {
  const [foldedRows, setFoldedRows] = useState<Set<number>>(new Set());

  const toggleFold = (rowIndex: number) => {
    setFoldedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex);
      else next.add(rowIndex);
      return next;
    });
  };
  
  // Calculate rendering widths and SVG size
  const svgMetrics = useMemo(() => {
    let maxPaddedSize = inputSize;
    
    // We have (layers.length + 1) rows. Row 0 is input. Row N is out of layer N.
    const rowInfo = Array.from({ length: layers.length + 1 }).map((_, i) => {
      const realSize = i === 0 ? inputSize : metrics[i - 1].outSize;
      
      // If this row is input to the NEXT layer, what's its padding?
      const p = i < layers.length ? layers[i].p : 0;
      const paddedSize = realSize + 2 * p;
      
      if (paddedSize > maxPaddedSize) {
        maxPaddedSize = paddedSize;
      }
      
      return {
        rowIndex: i,
        realSize,
        p,
        paddedSize,
      };
    });

    let cellW = 28;
    let cellH = 34;
    let rowGap = 120;
    let canvasPad = 120;
    let simplify = false;

    if (maxPaddedSize > 128) {
      cellW = 4;
      cellH = 10;
      rowGap = 60;
      simplify = true;
    } else if (maxPaddedSize > 64) {
      cellW = 10;
      cellH = 18;
      rowGap = 80;
    } else if (maxPaddedSize > 32) {
      cellW = 18;
      cellH = 24;
      rowGap = 100;
    }

    const dynamicY: number[] = [];
    let currentY = canvasPad;
    for (let i = 0; i < rowInfo.length; i++) {
      dynamicY.push(currentY);
      const isFolded = foldedRows.has(i);
      const currentCellH = isFolded ? 20 : cellH;
      currentY += currentCellH + rowGap;
    }

    const maxRowWidth = maxPaddedSize * cellW;
    const svgW = Math.max(500, maxRowWidth + canvasPad * 2);
    const svgH = currentY - rowGap + canvasPad;
    
    return { rowInfo, svgW, svgH, cellW, cellH, rowGap, canvasPad, simplify, dynamicY };
  }, [inputSize, layers, metrics, foldedRows]);

  const { rowInfo, svgW, svgH, cellW, cellH, rowGap, canvasPad, simplify, dynamicY } = svgMetrics;

  const getRowStartX = (paddedSize: number) => svgW / 2 - (paddedSize * cellW) / 2;
  const getRowY = (rowIndex: number) => dynamicY[rowIndex];
  
  const hasHover = Object.keys(hoverMap.real).length > 0;

  return (
    <div className="w-full h-full overflow-auto p-4 md:p-8 flex justify-center md:justify-start">
      <svg 
        width={svgW} 
        height={svgH} 
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="block max-w-full h-auto md:max-w-none"
        onMouseLeave={() => setHoveredNeuron(null)}
      >
        {/* Draw Connections */}
        {layers.map((layer, i) => {
          const rowFrom = rowInfo[i];
          const rowTo = rowInfo[i + 1];
          const isFromFolded = foldedRows.has(rowFrom.rowIndex);
          const isToFolded = foldedRows.has(rowTo.rowIndex);
          
          const startX_From = getRowStartX(rowFrom.paddedSize);
          const startX_To = getRowStartX(rowTo.paddedSize);
          const yFrom = getRowY(i) + (isFromFolded ? 20 : cellH);
          const yTo = getRowY(i + 1);

          const paths = [];
          for (let n = 0; n < rowTo.realSize; n++) {
            // target range in From row (padded)
            const leftPaddedIdx = n * layer.s;
            const rightPaddedIdx = n * layer.s + metrics[i].keff - 1;
            
            const pxFromL = startX_From + leftPaddedIdx * cellW;
            const pxFromR = startX_From + (rightPaddedIdx + 1) * cellW;
            
            // To row is real cells, but it might have padding itself for the NEXT layer.
            // The real cells start AFTER its own padding (`rowTo.p`).
            const pxToL = startX_To + (rowTo.p + n) * cellW;
            const pxToR = pxToL + cellW;

            const isActive = hoverMap.real[i + 1] ? hoverMap.real[i + 1].includes(n) : false;
            
            if ((isFromFolded || isToFolded) && !isActive) continue;
            
            const isPool = layer.type.includes('Pool');
            const defaultColor = isPool ? "rgba(34, 197, 94, 0.05)" : "rgba(59, 130, 246, 0.05)";
            const activeColor = isPool ? "rgba(34, 197, 94, 0.4)" : "rgba(59, 130, 246, 0.4)";
            const strokeColor = isPool ? "rgba(34, 197, 94, 0.8)" : "rgba(59, 130, 246, 0.8)";
            
            const isFaded = hasHover && !isActive;

            const d = `M ${pxToL} ${yTo} 
                       C ${pxToL} ${yTo - rowGap * 0.4}, 
                         ${pxFromL} ${yFrom + rowGap * 0.4}, 
                         ${pxFromL} ${yFrom} 
                       L ${pxFromR} ${yFrom} 
                       C ${pxFromR} ${yFrom + rowGap * 0.4}, 
                         ${pxToR} ${yTo - rowGap * 0.4}, 
                         ${pxToR} ${yTo} Z`;

            paths.push(
              <path
                key={n}
                d={d}
                fill={isActive ? activeColor : defaultColor}
                stroke={isActive ? strokeColor : "transparent"}
                strokeWidth={1.5}
                className="transition-all duration-150"
                style={{ opacity: isFaded ? 0.3 : 1 }}
              />
            );
          }
          
          return <g key={`connections-${i}`}>{paths}</g>;
        })}

        {/* Draw Cells */}
        {rowInfo.map((row) => {
          const startX = getRowStartX(row.paddedSize);
          const y = getRowY(row.rowIndex);
          const isFolded = foldedRows.has(row.rowIndex);
          const currentCellH = isFolded ? 20 : cellH;
          
          const cells = [];
          if (isFolded) {
             const isActiveRow = hoverMap.real[row.rowIndex] && hoverMap.real[row.rowIndex].length > 0;
             const isFaded = hasHover && !isActiveRow;
             
             cells.push(
               <rect
                 key="folded"
                 x={startX}
                 y={y}
                 width={row.paddedSize * cellW}
                 height={currentCellH}
                 fill={isActiveRow ? "#e0e7ff" : "#f1f5f9"}
                 stroke={isActiveRow ? "#6366f1" : "#cbd5e1"}
                 strokeWidth={isActiveRow ? 2 : 1}
                 strokeDasharray="4 4"
                 rx={4}
                 className="transition-all duration-150"
                 style={{ opacity: isFaded ? 0.4 : 1 }}
               />
             );
             
             if (!simplify) {
               cells.push(
                 <text
                   key="folded-text"
                   x={startX + (row.paddedSize * cellW) / 2}
                   y={y + currentCellH / 2 + 1}
                   dominantBaseline="middle"
                   textAnchor="middle"
                   className="text-[10px] font-bold fill-slate-400 pointer-events-none tracking-widest"
                 >
                   COLLAPSED
                 </text>
               );
             }
          } else {
            for (let c = 0; c < row.paddedSize; c++) {
              const isPadding = c < row.p || c >= row.p + row.realSize;
              
              const isActive = hoverMap.padded[row.rowIndex] ? hoverMap.padded[row.rowIndex].includes(c) : false;
              const isFaded = hasHover && !isActive;
              
              let fill = "white";
              let stroke = "#cbd5e1"; // slate-300
              let strokeDasharray = "none";
              
              if (isPadding) {
                fill = "#f8fafc"; // slate-50
                strokeDasharray = simplify ? "none" : "4 4";
              }
              
              if (isActive) {
                 if (isPadding) {
                   fill = "#e0e7ff"; // indigo-100
                   stroke = "#6366f1"; // indigo-500
                 } else {
                   fill = "#bfdbfe"; // blue-200
                   stroke = "#2563eb"; // blue-600
                 }
              }
              
              cells.push(
                <rect
                  key={c}
                  x={startX + c * cellW}
                  y={y}
                  width={cellW}
                  height={cellH}
                  fill={fill}
                  stroke={simplify ? "transparent" : stroke}
                  strokeDasharray={strokeDasharray}
                  strokeWidth={simplify ? 0 : (isActive ? 2 : 1)}
                  className="transition-all duration-150 cursor-pointer"
                  style={{ opacity: isFaded ? 0.4 : 1 }}
                  onMouseEnter={() => {
                     if (!isPadding) {
                        setHoveredNeuron({ row: row.rowIndex, cell: c - row.p });
                     }
                  }}
                  onTouchStart={() => {
                     if (!isPadding) {
                        setHoveredNeuron({ row: row.rowIndex, cell: c - row.p });
                     }
                  }}
                />
              );
              
              // Add a subtle P for padding if active or just normally
              if (isPadding && !isFaded && !simplify) {
                 cells.push(
                   <text
                     key={`p-${c}`}
                     x={startX + c * cellW + cellW / 2}
                     y={y + cellH / 2}
                     dominantBaseline="middle"
                     textAnchor="middle"
                     className="text-[10px] font-bold fill-slate-300 pointer-events-none"
                   >
                     P
                   </text>
                 )
              }
            }
          }
          
          return (
            <g key={`row-${row.rowIndex}`}>
              {/* Row Label */}
              <g 
                transform={`translate(60, ${y + currentCellH / 2 - 20})`} 
                className="cursor-pointer group"
                onClick={() => toggleFold(row.rowIndex)}
              >
                <rect x={-20} y={0} width={160} height={40} fill="transparent" />
                <g transform="translate(0, 4)">
                  <circle cx="12" cy="12" r="14" fill="#f8fafc" className="group-hover:fill-indigo-50 transition-colors" />
                  <svg x="2" y="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {isFolded ? (
                      <path d="m9 18 6-6-6-6" />
                    ) : (
                      <path d="m6 9 6 6 6-6" />
                    )}
                  </svg>
                </g>
                <text 
                  x={36} 
                  y={12} 
                  dominantBaseline="middle"
                  className="text-sm font-semibold fill-slate-700 uppercase tracking-wider group-hover:fill-indigo-600 transition-colors"
                >
                  {row.rowIndex === 0 ? 'Input' : `${layers[row.rowIndex - 1].type}`}
                </text>
                <text 
                  x={36} 
                  y={30} 
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-slate-400 group-hover:fill-indigo-400 transition-colors"
                >
                  Size: {row.realSize}
                </text>
              </g>
              
              {cells}
            </g>
          );
        })}

        {/* Input Layer Receptive Field Indicator */}
        {hoverMap.real[0] && hoverMap.real[0].length > 0 && hoveredNeuron && hoveredNeuron.row > 0 && (() => {
           const minIdx = Math.min(...hoverMap.real[0]);
           const maxIdx = Math.max(...hoverMap.real[0]);
           
           const row0 = rowInfo[0];
           const startX = getRowStartX(row0.paddedSize);
           const pxStart = startX + (row0.p + minIdx) * cellW;
           const pxEnd = startX + (row0.p + maxIdx + 1) * cellW;
           const y = getRowY(0) - 10;
           
           return (
             <g className="pointer-events-none transition-all duration-150">
               <path d={`M ${pxStart} ${y + 5} L ${pxStart} ${y} L ${pxEnd} ${y} L ${pxEnd} ${y + 5}`} fill="none" stroke="#6366f1" strokeWidth="2" />
               <text x={(pxStart + pxEnd) / 2} y={y - 8} dominantBaseline="auto" textAnchor="middle" className="text-xs font-bold fill-indigo-600">
                 RF: {maxIdx - minIdx + 1}
               </text>
             </g>
           );
        })()}

        {/* Tooltip for Hovered Neuron */}
        {hoveredNeuron && (() => {
           const row = rowInfo[hoveredNeuron.row];
           const metric = hoveredNeuron.row > 0 ? metrics[hoveredNeuron.row - 1] : null;
           
           const rField = metric ? metric.r : 1;
           const center = metric ? metric.start + hoveredNeuron.cell * metric.j : hoveredNeuron.cell + 0.5;
           
           const startX = getRowStartX(row.paddedSize);
           const cx = startX + (row.p + hoveredNeuron.cell) * cellW + cellW / 2;
           const cy = getRowY(row.rowIndex) + cellH + 15;
           
           return (
             <g className="pointer-events-none transition-all duration-150">
               <rect x={cx - 55} y={cy} width={110} height={50} rx={4} fill="#1e293b" opacity={0.9} />
               <polygon points={`${cx - 6},${cy} ${cx + 6},${cy} ${cx},${cy - 6}`} fill="#1e293b" opacity={0.9} />
               
               <text x={cx} y={cy + 18} textAnchor="middle" className="text-[10px] font-bold fill-white">
                 RF Size: {rField}
               </text>
               <text x={cx} y={cy + 32} textAnchor="middle" className="text-[10px] font-medium fill-slate-300">
                 Center: {center}
               </text>
             </g>
           );
        })()}
      </svg>
    </div>
  );
}
