import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileCode,
  Image,
  Printer,
  FileJson,
  Check,
  AlertCircle,
  Copy,
  Sparkles,
} from 'lucide-react';
import { MinePlan } from '../types/mine';

interface ExportModalProps {
  plan: MinePlan;
  setPlan: React.Dispatch<React.SetStateAction<MinePlan>>;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  plan,
  setPlan,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import_ai' | 'json_spec'>('export');
  const [jsonText, setJsonText] = useState(() => JSON.stringify(plan, null, 2));
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // 1. Export as JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${plan.metadata.mineName.replace(/\s+/g, '_')}_${plan.metadata.level}_Plan.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Export as SVG file
  const handleExportSvg = () => {
    const svgEl = document.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = svgUrl;
    downloadAnchor.download = `${plan.metadata.mineName.replace(/\s+/g, '_')}_${plan.metadata.level}_Vector.svg`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(svgUrl);
  };

  // 3. Export as PNG Raster
  const handleExportPng = () => {
    const svgEl = document.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 2800; // 2x high resolution
    canvas.height = 1960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = pngUrl;
      downloadAnchor.download = `${plan.metadata.mineName.replace(/\s+/g, '_')}_${plan.metadata.level}_Plot.png`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    };

    img.src = url;
  };

  // 4. Print / PDF Export
  const handlePrint = () => {
    window.print();
  };

  // 5. Apply JSON Spec (e.g. from another AI agent or file)
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.metadata || !parsed.tunnels || !parsed.gridOrigin) {
        throw new Error('Missing essential properties: metadata, tunnels, or gridOrigin.');
      }
      setPlan(parsed);
      setImportStatus({
        success: true,
        message: `Plan loaded successfully! ${parsed.tunnels.length} tunnels, ${parsed.geologicalFeatures?.length || 0} geological features.`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `Validation Error: ${err.message}`,
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonText(content);
        const parsed = JSON.parse(content);
        if (parsed.metadata && parsed.tunnels) {
          setPlan(parsed);
          setImportStatus({
            success: true,
            message: `Loaded ${file.name} successfully!`,
          });
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setImportStatus({
            success: false,
            message: 'Invalid mine plan schema. File must contain metadata and tunnels array.',
          });
        }
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: `JSON Parse error: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export & AI Agent Integration</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Export high-res CAD engineering plans or exchange structured JSON with other AI agents.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/20 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Export Formats (PDF/PNG/SVG)
          </button>
          <button
            onClick={() => setActiveTab('json_spec')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'json_spec'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>AI Map JSON Specification</span>
          </button>
          <button
            onClick={() => setActiveTab('import_ai')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'import_ai'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Load File</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'export' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PDF Print Option */}
              <button
                onClick={handlePrint}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-100 text-sm">Print / Save as PDF</div>
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                  Engineering sheet layout formatted for A3 or A4 landscape, with title block, grid, and legend.
                </p>
              </button>

              {/* PNG High-Res Raster Option */}
              <button
                onClick={handleExportPng}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <Image className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-100 text-sm">Download PNG (2800px)</div>
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                  High-resolution raster image suitable for presentation slides and operational reports.
                </p>
              </button>

              {/* SVG Scalable Vector Graphic */}
              <button
                onClick={handleExportSvg}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-100 text-sm">Download SVG (Vector)</div>
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                  Lossless vector graphics compatible with AutoCAD, QGIS, ArcGIS, Illustrator, and Inkscape.
                </p>
              </button>

              {/* JSON CAD Model */}
              <button
                onClick={handleExportJson}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-cyan-500/50 text-left transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400 w-fit mb-3 group-hover:scale-105 transition-transform">
                  <FileJson className="w-5 h-5" />
                </div>
                <div className="font-semibold text-slate-100 text-sm">Download JSON Model</div>
                <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                  Full editable geometric model schema for reopening, editing, or AI agent processing.
                </p>
              </button>
            </div>
          )}

          {activeTab === 'json_spec' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">Structured AI Agent Schema</span>
                  <p className="text-[11px] text-slate-400">
                    Other AI agents can generate this JSON schema to create any underground mine plan.
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={14}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-500"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Global API available: <code className="text-slate-300">window.loadMinePlan(json)</code>
                </span>
                <button
                  onClick={handleApplyJson}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors"
                >
                  Apply & Render Plan
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import_ai' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center bg-slate-950/40 hover:bg-slate-950/80 transition-colors">
                <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <div className="font-semibold text-slate-200 text-sm">Upload Mine Plan JSON File</div>
                <p className="text-slate-400 text-[11px] mt-1 mb-4">
                  Select a exported .json mine file or an AI-generated map configuration
                </p>
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-colors inline-block">
                  <span>Browse File...</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Status Alert Banner */}
          {importStatus && (
            <div
              className={`mt-4 p-3 rounded-lg border flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300'
              }`}
            >
              {importStatus.success ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
