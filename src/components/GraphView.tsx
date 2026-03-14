"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefAttributes,
} from "react";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas";
import {
  ArrowsPointingOutIcon,
  ArrowUturnRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import "jsoncrack-react/style.css";
import type { JSONCrackProps, JSONCrackRef, LayoutDirection } from "jsoncrack-react";
import type { JsonValue } from "@/lib/json/core";

const JSONCrackDynamic = dynamic(
  () => import("jsoncrack-react").then((module) => module.JSONCrack),
  { ssr: false },
) as ComponentType<JSONCrackProps & RefAttributes<JSONCrackRef>>;

interface GraphViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
}

export interface GraphViewRef {
  copyPngToClipboard: () => Promise<void>;
  downloadPng: () => Promise<void>;
}

const LAYOUTS: LayoutDirection[] = ["DOWN", "RIGHT", "UP", "LEFT"];

export const GraphView = forwardRef<GraphViewRef, GraphViewProps>(function GraphView(
  { data, className, isDark = false }: GraphViewProps,
  ref,
) {
  const graphRef = useRef<JSONCrackRef | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>("DOWN");
  const [showGrid, setShowGrid] = useState(true);
  const [search, setSearch] = useState("");

  const normalizedData = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return data;
    return { value: data };
  }, [data]);

  const searchMatches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return 0;
    const source = JSON.stringify(normalizedData).toLowerCase();
    return source.split(term).length - 1;
  }, [normalizedData, search]);

  useEffect(() => {
    const el = exportRef.current;
    if (!el) return;
    const term = search.trim().toLowerCase();
    const texts = el.querySelectorAll("text");
    texts.forEach((t) => {
      const content = t.textContent ?? "";
      if (term && content.toLowerCase().includes(term)) {
        t.setAttribute("fill", isDark ? "#fbbf24" : "#ca8a04");
        t.setAttribute("font-weight", "bold");
      } else {
        t.removeAttribute("font-weight");
        t.removeAttribute("fill");
      }
    });
  }, [search, isDark]);

  const rotateLayout = () => {
    setLayoutDirection((prev) => {
      const current = LAYOUTS.indexOf(prev);
      return LAYOUTS[(current + 1) % LAYOUTS.length];
    });
  };

  const toolbarBorderClass = isDark ? "border-white/45" : "border-base-300";
  const joinItemBorderClass = "[&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:!border-base-300";
  const toolbarBtnIcon =
    "btn btn-sm btn-square btn-soft h-9 min-h-9 rounded-md";
  const toolbarBtnActive =
    "btn btn-sm btn-square h-9 min-h-9 rounded-md btn-primary";
  const searchInputClass =
    `input input-sm h-9 w-48 rounded-md border ${toolbarBorderClass} bg-base-100 text-base-content shadow-none`;

  const renderGraphPng = async () => {
    const source = exportRef.current;
    if (!source) {
      throw new Error("Graph canvas is not ready yet.");
    }

    // Try to find a canvas element directly rendered by JSONCrack
    const nativeCanvas = source.querySelector("canvas") as HTMLCanvasElement | null;
    if (nativeCanvas && nativeCanvas.width > 0 && nativeCanvas.height > 0) {
      try {
        return await new Promise<Blob>((resolve, reject) => {
          nativeCanvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to export canvas."));
              }
            },
            "image/png"
          );
        });
      } catch (error) {
        console.warn("Native canvas export failed, trying fallback...");
      }
    }

    // Fallback: Render via SVG serialization
    const rect = source.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (!width || !height) {
      throw new Error("Graph element is empty.");
    }

    const scale = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable.");
    }

    ctx.scale(scale, scale);
    ctx.fillStyle = isDark ? "#1e1e1e" : "#ffffff";
    ctx.fillRect(0, 0, width, height);

    try {
      const svgString = new XMLSerializer().serializeToString(source);
      const svg = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svg);
      
      const img = new Image();
      
      return await new Promise<Blob>((resolve, reject) => {
        const timeout = setTimeout(() => {
          URL.revokeObjectURL(url);
          reject(new Error("Image rendering timeout."));
        }, 3000);
        
        img.onload = () => {
          clearTimeout(timeout);
          try {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("PNG conversion failed."));
              }
            }, "image/png");
          } catch (drawError) {
            URL.revokeObjectURL(url);
            reject(drawError);
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          URL.revokeObjectURL(url);
          reject(new Error("SVG image failed to load."));
        };
        
        img.src = url;
      });
    } catch {
      // Final fallback: html2canvas with onclone to replace lab/oklch colors
      try {
        const fallbackColor = isDark ? "#111111" : "#ffffff";
        const canvas = await html2canvas(source, {
          backgroundColor: fallbackColor,
          scale: window.devicePixelRatio || 1,
          useCORS: true,
          allowTaint: true,
          logging: false,
          onclone: (clonedDoc, clonedElement) => {
            [clonedDoc.documentElement, clonedDoc.body, clonedElement as HTMLElement].forEach((el) => {
              if (el?.style) el.style.setProperty("background-color", fallbackColor, "important");
            });
            clonedDoc.querySelectorAll("*").forEach((el) => {
              const htmlEl = el as HTMLElement;
              try {
                const comp = clonedDoc.defaultView?.getComputedStyle(htmlEl);
                const bg = comp?.backgroundColor ?? "";
                if (bg && (bg.includes("lab") || bg.includes("oklch") || bg.includes("oklab"))) {
                  htmlEl.style.setProperty("background-color", "transparent", "important");
                }
              } catch {
                htmlEl.style?.setProperty("background-color", "transparent", "important");
              }
            });
          },
        });
        return await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("PNG conversion failed."));
          }, "image/png");
        });
      } catch (fallbackError) {
        throw fallbackError instanceof Error ? fallbackError : new Error("Graph export failed.");
      }
    }
  };

  useImperativeHandle(ref, () => ({
    copyPngToClipboard: async () => {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("PNG clipboard copy is not supported in this browser.");
      }
      const blob = await renderGraphPng();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    },
    downloadPng: async () => {
      const blob = await renderGraphPng();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "jsonix-graph.png";
      anchor.click();
      URL.revokeObjectURL(url);
    },
  }));

  return (
    <div className={`relative h-full overflow-hidden border ${className ?? ""}`}>
      <div ref={exportRef} className="h-full">
        <JSONCrackDynamic
          ref={graphRef}
          json={normalizedData}
          theme={isDark ? "dark" : "light"}
          layoutDirection={layoutDirection}
          showControls={false}
          showGrid={showGrid}
          trackpadZoom={false}
          centerOnLayout
          maxRenderableNodes={1200}
        />
      </div>

      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2">
        <div className={`join overflow-hidden rounded-md border ${toolbarBorderClass} ${joinItemBorderClass}`}>
          <button
            type="button"
            className={`${toolbarBtnIcon} join-item rounded-none border-0`}
            onClick={() => graphRef.current?.focusFirstNode()}
            aria-label="Focus root"
            title="Focus root"
          >
            <HomeIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`${toolbarBtnIcon} join-item rounded-none border-0`}
            onClick={() => graphRef.current?.centerView()}
            aria-label="Fit graph"
            title="Fit graph"
          >
            <ArrowsPointingOutIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`${toolbarBtnIcon} join-item rounded-none border-0`}
            onClick={rotateLayout}
            aria-label="Rotate layout"
            title={`Rotate layout`}
          >
            <ArrowUturnRightIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`${showGrid ? toolbarBtnActive : toolbarBtnIcon} join-item rounded-none border-0`}
            onClick={() => setShowGrid((prev) => !prev)}
            aria-label={showGrid ? "Hide rulers" : "Show rulers"}
            title={showGrid ? "Hide rulers" : "Show rulers"}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        <label className={`${searchInputClass} flex items-center gap-2 px-2`}>
          <MagnifyingGlassIcon className="h-4 w-4 opacity-60" />
          <input
            type="text"
            placeholder="Search node"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-transparent text-sm outline-none"
            aria-label="Search graph"
          />
        </label>
        {search.trim() ? <span className="text-xs text-base-content/70">{searchMatches} matches</span> : null}
      </div>
    </div>
  );
});
