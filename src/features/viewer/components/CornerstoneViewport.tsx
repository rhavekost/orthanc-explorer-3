import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RenderingEngine, Enums, type Types } from '@cornerstonejs/core';
import { ToolGroupManager } from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { initCornerstone } from '@/lib/cornerstone';
import { buildWadorsImageId } from '@/lib/cornerstoneImageIds';
import { useSeriesInstances } from '@/features/studies/hooks/use-studies';
import { Loader2 } from 'lucide-react';

const { ViewportType, Events } = Enums;

export interface SeriesInfo {
  orthancSeriesId: string;
  studyInstanceUID: string;
  seriesInstanceUID: string;
}

export interface CornerstoneViewportProps {
  /** The series to display. Pass null to show an empty black viewport. */
  seriesInfo: SeriesInfo | null;
  toolGroupId: string;
  isActive?: boolean;
  className?: string;
}

/**
 * Single Cornerstone3D WebGL viewport.
 *
 * - Creates a RenderingEngine on mount, destroys it on unmount.
 * - Fetches Instance[] via useSeriesInstances and builds wadors: imageIds.
 * - Joins the shared ToolGroup so toolbar tools apply to all viewports.
 */
export function CornerstoneViewport({
  seriesInfo,
  toolGroupId,
  isActive = false,
  className,
}: CornerstoneViewportProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RenderingEngine | null>(null);
  // crypto.randomUUID() avoids module-level counter state (HMR-safe, test-safe)
  const viewportIdRef = useRef<string>(`vp-${crypto.randomUUID()}`);
  const [engineReady, setEngineReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [currentSlice, setCurrentSlice] = useState(0);

  // Empty string disables the query — useSeriesInstances must guard against ''
  const { data: instances, isLoading: instancesLoading } = useSeriesInstances(
    seriesInfo?.orthancSeriesId ?? ''
  );

  // Memoize imageIds — avoids join(',') hack in dep array and prevents spurious stack reloads
  const imageIds = useMemo<string[]>(() => {
    if (!instances || !seriesInfo) return [];
    return [...instances]
      .sort((a, b) => a.instanceNumber - b.instanceNumber)
      .map((inst) =>
        buildWadorsImageId({
          studyUID: seriesInfo.studyInstanceUID,
          seriesUID: seriesInfo.seriesInstanceUID,
          instanceUID: inst.sopInstanceUID,
        })
      );
  }, [instances, seriesInfo]);

  // Initialize RenderingEngine once on mount; tear down on unmount
  useEffect(() => {
    if (!divRef.current) return;
    let mounted = true;
    const viewportId = viewportIdRef.current;
    const engineId = `engine-${viewportId}`;

    initCornerstone()
      .then(() => {
        if (!mounted || !divRef.current) return;

        const engine = new RenderingEngine(engineId);
        engineRef.current = engine;

        const viewportInput: Types.PublicViewportInput = {
          viewportId,
          type: ViewportType.STACK,
          element: divRef.current,
        };
        engine.enableElement(viewportInput);
        // Resize so the WebGL canvas matches the element's CSS dimensions.
        // Without this, the canvas may be 0×0 if the grid layout wasn't
        // fully computed before enableElement ran.
        engine.resize(true, false);

        const tg = ToolGroupManager.getToolGroup(toolGroupId);
        tg?.addViewport(viewportId, engineId);

        if (mounted) setEngineReady(true);
      })
      .catch((err) => {
        if (mounted) setRenderError(err instanceof Error ? err.message : 'Cornerstone init failed');
      });

    // STACK_NEW_IMAGE fires on the viewport element — update slice counter.
    // Must be added directly to the element, not the global eventTarget.
    const el = divRef.current;
    const onNewImage = (evt: Event) => {
      const idx = (evt as CustomEvent).detail?.imageIdIndex;
      if (typeof idx === 'number') setCurrentSlice(idx);
    };
    el?.addEventListener(Events.STACK_NEW_IMAGE, onNewImage);

    // Keep the WebGL canvas in sync whenever the container is resized.
    const resizeObserver = new ResizeObserver(() => {
      engineRef.current?.resize(true, false);
    });
    if (el) resizeObserver.observe(el);

    return () => {
      mounted = false;
      el?.removeEventListener(Events.STACK_NEW_IMAGE, onNewImage);
      resizeObserver.disconnect();
      const engine = engineRef.current;
      if (engine) {
        const tg = ToolGroupManager.getToolGroup(toolGroupId);
        tg?.removeViewports(engine.id, viewportIdRef.current);
        engine.destroy();
        engineRef.current = null;
      }
      // Do NOT call setEngineReady here — component is unmounting, state is discarded
    };
  }, [toolGroupId]);

  // Load/update stack whenever imageIds change.
  // WADO-RS requires series metadata to be registered in metaDataManager
  // before setStack is called — otherwise imagePixelModule returns undefined.
  useEffect(() => {
    if (!engineReady || !engineRef.current || imageIds.length === 0 || !seriesInfo) return;

    const vp = engineRef.current.getViewport(viewportIdRef.current);
    if (!vp || vp.type !== ViewportType.STACK) {
      setRenderError('Viewport not available or wrong type');
      return;
    }

    const { studyInstanceUID, seriesInstanceUID } = seriesInfo;
    const metadataUrl =
      `/orthanc-proxy/dicom-web/studies/${studyInstanceUID}` +
      `/series/${seriesInstanceUID}/metadata`;

    fetch(metadataUrl, { headers: { Accept: 'application/dicom+json' } })
      .then((r) => {
        if (!r.ok) throw new Error(`Metadata fetch failed: ${r.status}`);
        return r.json() as Promise<Record<string, { vr: string; Value?: unknown[] }>[]>;
      })
      .then((instanceMetaList) => {
        // Register each instance's metadata so the WADO-RS loader can
        // resolve imagePixelModule, voiLutModule, etc. before decoding.
        instanceMetaList.forEach((meta) => {
          const sopUIDEntry = meta['00080018'];
          const sopUID = Array.isArray(sopUIDEntry?.Value) ? (sopUIDEntry.Value[0] as string) : null;
          if (!sopUID) return;
          const imageId = buildWadorsImageId({
            studyUID: studyInstanceUID,
            seriesUID: seriesInstanceUID,
            instanceUID: sopUID,
          });
          cornerstoneDICOMImageLoader.wadors.metaDataManager.add(imageId, meta);
        });
      })
      .then(() =>
        (vp as Types.IStackViewport).setStack(imageIds, 0)
      )
      .then(() => {
        vp.resetCamera();
        (vp as Types.IStackViewport).render();
      })
      .catch((err) => setRenderError(err instanceof Error ? err.message : 'Stack load failed'));
  }, [imageIds, engineReady, seriesInfo]);

  const isLoading = !renderError && (instancesLoading || (seriesInfo !== null && !engineReady));
  const totalSlices = imageIds.length;

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    setCurrentSlice(idx);
    if (!engineRef.current) return;
    const vp = engineRef.current.getViewport(viewportIdRef.current);
    if (vp && vp.type === ViewportType.STACK) {
      (vp as Types.IStackViewport).setImageIdIndex(idx);
    }
  }, []);

  return (
    <div
      className={`relative bg-black overflow-hidden ${className ?? ''}`}
      style={{ minHeight: 300 }}
    >
      {/* Cornerstone renders into this div via WebGL */}
      <div
        ref={divRef}
        style={{ width: '100%', height: '100%' }}
        className={isActive ? 'outline outline-2 outline-blue-500 outline-offset-[-2px]' : ''}
      />

      {/* Empty state */}
      {!seriesInfo && (
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs select-none">
          Drag a series here
        </div>
      )}

      {/* Loading */}
      {isLoading && seriesInfo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        </div>
      )}

      {/* Error */}
      {renderError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-red-400 text-xs p-4 text-center">
          {renderError}
        </div>
      )}

      {/* Slice slider — only shown when a series is loaded */}
      {totalSlices > 1 && !renderError && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-1 bg-black/50">
          <span className="text-white/60 text-xs tabular-nums w-16 shrink-0">
            {currentSlice + 1} / {totalSlices}
          </span>
          <input
            type="range"
            aria-label="Slice"
            min={0}
            max={totalSlices - 1}
            value={currentSlice}
            onChange={handleSliderChange}
            className="flex-1 h-1 accent-blue-400 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
