import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Compass,
  FileCheck,
  Table,
} from 'lucide-react';
import { MinePlan, SurveyStation, StationType } from '../types/mine';

interface SurveyPanelProps {
  plan: MinePlan;
  setPlan: React.Dispatch<React.SetStateAction<MinePlan>>;
  onClose: () => void;
}

export const SurveyPanel: React.FC<SurveyPanelProps> = ({
  plan,
  setPlan,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stations' | 'calibration' | 'geometry_audit'>('stations');
  
  // New station form state
  const [newStation, setNewStation] = useState<Partial<SurveyStation>>({
    name: '',
    easting: 336000,
    northing: 7802100,
    elevationRL: 210.0,
    type: 'wall_peg',
    accuracyClass: 'Class B (1:15,000)',
    status: 'verified',
    notes: '',
  });

  const handleTogglePlanCalibration = () => {
    setPlan((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        isSurveyCalibrated: !prev.metadata.isSurveyCalibrated,
      },
    }));
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name) return;

    const station: SurveyStation = {
      id: `stn-${Date.now()}`,
      name: newStation.name,
      easting: Number(newStation.easting) || 336000,
      northing: Number(newStation.northing) || 7802100,
      elevationRL: Number(newStation.elevationRL) || 210.0,
      type: (newStation.type as StationType) || 'wall_peg',
      accuracyClass: newStation.accuracyClass as any || 'Class B (1:15,000)',
      status: 'verified',
      notes: newStation.notes || '',
    };

    setPlan((prev) => ({
      ...prev,
      surveyStations: [...prev.surveyStations, station],
    }));

    setNewStation({
      name: '',
      easting: 336000,
      northing: 7802100,
      elevationRL: 210.0,
      type: 'wall_peg',
      accuracyClass: 'Class B (1:15,000)',
      status: 'verified',
      notes: '',
    });
  };

  const handleDeleteStation = (id: string) => {
    setPlan((prev) => ({
      ...prev,
      surveyStations: prev.surveyStations.filter((s) => s.id !== id),
    }));
  };

  const handleToggleTunnelSurveyed = (id: string) => {
    setPlan((prev) => ({
      ...prev,
      tunnels: prev.tunnels.map((t) =>
        t.id === id ? { ...t, isSurveyed: !t.isSurveyed } : t
      ),
    }));
  };

  const handleToggleGeologySurveyed = (id: string) => {
    setPlan((prev) => ({
      ...prev,
      geologicalFeatures: prev.geologicalFeatures.map((g) =>
        g.id === id ? { ...g, isSurveyed: !g.isSurveyed } : g
      ),
    }));
  };

  const surveyedTunnelsCount = plan.tunnels.filter((t) => t.isSurveyed).length;
  const surveyedGeologyCount = plan.geologicalFeatures.filter((g) => g.isSurveyed).length;

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Underground Survey Ledger & Calibration
              </h1>
              {plan.metadata.isSurveyCalibrated ? (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  SURVEY CERTIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-amber-950 border border-amber-800 text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ILLUSTRATIVE DRAFT
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Datum: <span className="font-mono text-slate-300">{plan.metadata.datum}</span> ·
              Elevation Datum: <span className="font-mono text-slate-300">{plan.metadata.level}</span> ·
              Traverse Closure: <span className="font-mono text-cyan-400">Class B (1:15,000)</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePlanCalibration}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                plan.metadata.isSurveyCalibrated
                  ? 'bg-amber-950/60 border-amber-700 text-amber-300 hover:bg-amber-900/60'
                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
              }`}
            >
              {plan.metadata.isSurveyCalibrated
                ? 'Downgrade to Illustrative Draft'
                : 'Certify as Survey Calibrated'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Return to Plan View
            </button>
          </div>
        </div>

        {/* Informational Callout regarding Survey vs Illustrative */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-slate-100 text-sm">
              Critical Mining Principle: Surveyed vs Illustrative Geometry
            </div>
            <p className="text-slate-400 leading-relaxed">
              In underground mining engineering, coordinates, gradients, and dimensions must strictly
              distinguish between genuine surveyed data (measured with Total Station/EDM and tied to certified
              pegs) and illustrative conceptual sketches (such as planned future stopes or approximate drill
              target boundaries). Unsurveyed headings must never be used for breakthrough drilling or geotechnical clearance.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('stations')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'stations'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Survey Stations ({plan.surveyStations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('geometry_audit')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'geometry_audit'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Geometry Audit ({surveyedTunnelsCount}/{plan.tunnels.length} Surveyed)</span>
          </button>
        </div>

        {/* Tab 1: Survey Stations */}
        {activeTab === 'stations' && (
          <div className="space-y-6">
            {/* Station Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Station ID</th>
                    <th className="py-3 px-4 font-mono">Easting (m E)</th>
                    <th className="py-3 px-4 font-mono">Northing (m N)</th>
                    <th className="py-3 px-4 font-mono">RL (mL)</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {plan.surveyStations.map((station) => (
                    <tr key={station.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-cyan-300">{station.name}</td>
                      <td className="py-3 px-4 text-slate-200">{station.easting.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-slate-200">{station.northing.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-slate-200">{station.elevationRL.toFixed(2)}</td>
                      <td className="py-3 px-4 font-sans text-slate-300 capitalize">
                        {station.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400">
                        {station.accuracyClass}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-400 max-w-xs truncate">
                        {station.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteStation(station.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete Station"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add New Station Form */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
              <h3 className="font-semibold text-sm text-slate-200 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Survey Station / Benchmark Peg</span>
              </h3>
              <form onSubmit={handleAddStation} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Station Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STN-210-07"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Easting (m E)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newStation.easting}
                    onChange={(e) => setNewStation({ ...newStation, easting: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Northing (m N)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newStation.northing}
                    onChange={(e) => setNewStation({ ...newStation, northing: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono">RL Elevation (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newStation.elevationRL}
                    onChange={(e) => setNewStation({ ...newStation, elevationRL: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Station Type</label>
                  <select
                    value={newStation.type}
                    onChange={(e) => setNewStation({ ...newStation, type: e.target.value as StationType })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="instrument">Instrument Setup Point</option>
                    <option value="backsight">Backsight Reference Peg</option>
                    <option value="wall_peg">Wall Survey Peg</option>
                    <option value="grade_peg">Grade & Alignment Peg</option>
                    <option value="benchmark">Level Benchmark (Plat Datum)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-400 mb-1">Survey Notes & Collar Info</label>
                  <input
                    type="text"
                    placeholder="e.g. Wall pin in decline sidewall at 1.4m height above sill"
                    value={newStation.notes}
                    onChange={(e) => setNewStation({ ...newStation, notes: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-1.5 px-3 rounded transition-colors"
                  >
                    Add Station
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Geometry Audit */}
        {activeTab === 'geometry_audit' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tunnels Audit */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-100">
                    Excavations & Tunnels ({surveyedTunnelsCount}/{plan.tunnels.length} Surveyed)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {Math.round((surveyedTunnelsCount / Math.max(1, plan.tunnels.length)) * 100)}% Verified
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {plan.tunnels.map((tunnel) => (
                    <div
                      key={tunnel.id}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-200">{tunnel.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Width: {tunnel.width}m · {tunnel.points.length} nodes · Grade: {tunnel.grade || 'Flat'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleTunnelSurveyed(tunnel.id)}
                        className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors border ${
                          tunnel.isSurveyed
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                            : 'bg-amber-950/80 border-amber-800 text-amber-400 hover:bg-amber-900/60'
                        }`}
                      >
                        {tunnel.isSurveyed ? 'Surveyed' : 'Illustrative'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geological Features Audit */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-100">
                    Geological Features & Stopes ({surveyedGeologyCount}/{plan.geologicalFeatures.length} Surveyed)
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {Math.round((surveyedGeologyCount / Math.max(1, plan.geologicalFeatures.length)) * 100)}% Verified
                  </span>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {plan.geologicalFeatures.map((geo) => (
                    <div
                      key={geo.id}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-200">{geo.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {geo.type.replace('_', ' ')} · Pattern: {geo.fillPattern.replace('_', ' ')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleGeologySurveyed(geo.id)}
                        className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors border ${
                          geo.isSurveyed
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                            : 'bg-amber-950/80 border-amber-800 text-amber-400 hover:bg-amber-900/60'
                        }`}
                      >
                        {geo.isSurveyed ? 'Surveyed' : 'Illustrative'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
