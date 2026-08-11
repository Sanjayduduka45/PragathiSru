import React, { useState, useRef, useEffect } from 'react';
import { Crop as CropIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, RefreshCw, Check as CheckIcon, X as XIcon, Move, RotateCcw } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  initialAspectRatio?: string;
  onConfirm: (croppedBlob: Blob, croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  initialAspectRatio = '16:9',
  onConfirm,
  onCancel,
}) => {
  const [aspectRatio, setAspectRatio] = useState<string>(initialAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      setPan({ x: 0, y: 0 });
      setZoom(1);
    };
  }, [imageSrc]);

  // Target canvas dimensions based on aspect ratio
  const getCropDimensions = () => {
    switch (aspectRatio) {
      case '1:1':
        return { width: 800, height: 800 };
      case '4:3':
        return { width: 960, height: 720 };
      case 'free':
        return { width: 900, height: 600 };
      case '16:9':
      default:
        return { width: 1280, height: 720 };
    }
  };

  // Render crop preview on canvas whenever parameters change
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width: targetW, height: targetH } = getCropDimensions();
    canvas.width = targetW;
    canvas.height = targetH;

    const img = imgRef.current;
    ctx.clearRect(0, 0, targetW, targetH);

    // Calculate aspect fill scale
    const scaleW = targetW / img.width;
    const scaleH = targetH / img.height;
    const baseScale = Math.max(scaleW, scaleH);
    const finalScale = baseScale * zoom;

    const drawW = img.width * finalScale;
    const drawH = img.height * finalScale;

    // Center offset + user drag pan offset
    const drawX = (targetW - drawW) / 2 + pan.x;
    const drawY = (targetH - drawH) / 2 + pan.y;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Generate real-time preview data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCroppedPreviewUrl(dataUrl);
  }, [imageLoaded, aspectRatio, zoom, pan]);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Confirm Crop Callback
  const handleConfirmCrop = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onConfirm(blob, croppedPreviewUrl);
        }
      },
      'image/jpeg',
      0.92
    );
  };

  // Reset crop parameters
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAspectRatio('16:9');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl text-white my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CropIcon className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-extrabold text-white">Visual Image Crop & Alignment</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Canvas Viewport */}
        <div className="space-y-4">
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-full h-[320px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center cursor-grab active:cursor-grabbing select-none group"
          >
            {/* Hidden Canvas for rendering */}
            <canvas ref={canvasRef} className="hidden" />

            {croppedPreviewUrl ? (
              <img
                src={croppedPreviewUrl}
                alt="Crop preview"
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <div className="text-slate-500 text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading Image canvas...</span>
              </div>
            )}

            {/* Overlay instruction */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-slate-300 border border-slate-800 flex items-center gap-1.5 pointer-events-none">
              <Move className="w-3.5 h-3.5 text-blue-400" />
              <span>Drag to Pan • Zoom Below</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            {/* Aspect Ratio Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">
                Aspect Ratio Output
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['16:9', '4:3', '1:1', 'free'].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      aspectRatio === ratio
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1.5">
                <span>Zoom Scale: {zoom.toFixed(2)}x</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <ZoomOutIcon className="w-4 h-4 text-slate-500" />
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <ZoomInIcon className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmCrop}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Confirm & Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
