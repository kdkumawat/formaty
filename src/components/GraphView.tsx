"use client";

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefAttributes,
} from "react";
import dynamic from "next/dynamic";
import {
  ArrowsPointingOutIcon,
  ArrowUturnRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
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

function inlineComputedStyles(source: Element, target: Element) {
  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  const computedStyle = window.getComputedStyle(source);

  if (target instanceof HTMLElement || target instanceof SVGElement) {
    for (const property of computedStyle) {
      target.style.setProperty(
        property,
        computedStyle.getPropertyValue(property),
        computedStyle.getPropertyPriority(property),
      );
    }
  }

  if (source instanceof HTMLInputElement && target instanceof HTMLInputElement) {
    target.value = source.value;
    target.setAttribute("value", source.value);
  }

  if (source instanceof HTMLTextAreaElement && target instanceof HTMLTextAreaElement) {
    target.value = source.value;
    target.textContent = source.value;
  }

  sourceChildren.forEach((child, index) => {
    const clonedChild = targetChildren[index];
    if (clonedChild) {
      inlineComputedStyles(child, clonedChild);
    }
  });
}

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

  const rotateLayout = () => {
    setLayoutDirection((prev) => {
      const current = LAYOUTS.indexOf(prev);
      return LAYOUTS[(current + 1) % LAYOUTS.length];
    });
  };

  const toolbarBorderClass = isDark ? "border-white/45" : "border-base-300";
  const toolbarBtnIcon =
    `btn btn-sm btn-square h-9 min-h-9 rounded-md border ${toolbarBorderClass} bg-base-100 text-base-content shadow-none hover:bg-base-200`;
  const toolbarBtnActive =
    "btn btn-sm btn-square h-9 min-h-9 rounded-md border border-primary bg-primary text-primary-content shadow-none hover:bg-primary/90";
  const searchInputClass =
    `input input-sm h-9 w-48 rounded-md border ${toolbarBorderClass} bg-base-100 text-base-content shadow-none`;

  const renderGraphPng = async () => {
    const source = exportRef.current;
    if (!source) {
      throw new Error("Graph canvas is not ready yet.");
    }

    const rect = source.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (!width || !height) {
      throw new Error("Graph canvas is empty.");
    }

    const clone = source.cloneNode(true) as HTMLDivElement;
    inlineComputedStyles(source, clone);
    clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");

    const serializedClone = new XMLSerializer().serializeToString(clone);
    const svgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <foreignObject width="100%" height="100%">${serializedClone}</foreignObject>
      </svg>
    `;

    const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const nextImage = new Image();
        nextImage.onload = () => resolve(nextImage);
        nextImage.onerror = () => reject(new Error("Failed to render graph image."));
        nextImage.src = url;
      });

      const scale = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas export is not available.");
      }

      ctx.scale(scale, scale);
      ctx.drawImage(image, 0, 0, width, height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) {
            resolve(result);
            return;
          }
          reject(new Error("Failed to create PNG."));
        }, "image/png");
      });

      return blob;
    } finally {
      URL.revokeObjectURL(url);
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
        <div className={`join overflow-hidden rounded-md border ${toolbarBorderClass}`}>
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
            <ScaleIcon className="h-4 w-4" />
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
