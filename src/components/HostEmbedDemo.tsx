import React, { useState } from 'react';
import { MinePlan } from '../types/mine';
import { MinePlanViewer } from './MinePlanViewer';
import { DEMO_MINE_PLAN } from '../data/demoMinePlan';
import { createMinePlanTemplate } from '../utils/aiAgentBridge';
import {
  Laptop,
  Maximize,
  Columns,
  Cpu,
  Activity,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface HostEmbedDemoProps {
  plan: MinePlan;
  onPlanChange: (updated: MinePlan) => void;
}

export const HostEmbedDemo: React.FC<HostEmbedDemoProps> = ({ plan, onPlanChange }) => {
  // Container size simulation
  const [containerLayout, setContainerLayout] = useState<'full' | 'split' | 'card'>('full');

  // Viewer mode simulation
  const [viewerMode, setViewerMode] = useState<'full' | 'interactive' | 'viewer'>('full');
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Status message from AI agent simulation
  const [agentStatus, setAgentStatus] = useState<string | null>(null);

  // Trigger 1: AI Agent injects a new blast heading into the existing plan
  const handleAIAgentAddHeading = () => {
    const newTunnelId = `t-agent-${Date.now()}`;
    const updatedPlan: MinePlan = {
      ...plan,
      tunnels: [
        ...plan.tunnels,
        {
          id: newTunnelId,
          name: 'AI Heading 210-XC4 (Active Blast)',
          type: 'crosscut',
          points: [
            { x: 335900, y: 7802100 },
            { x: 335980, y: 7802080 },
            { x: 336040, y: 7802050 },
          ],
          width: 4.5,
          profile: 'arch',
          grade: '+1.5% (+1:67)',
          isSurveyed: false, // Illustrative proposed heading
          status: 'planned',
          notes: 'AI generated heading for blast sequence B-12',
        },
      ],
      annotations: [
        ...plan.annotations,
        {
          id: `ann-agent-${Date.now()}`,
          text: 'Proposed Heading 210-XC4\n(AI Generated Blast)',
          position: { x: 336060, y: 7802040 },
          target: { x: 336040, y: 7802050 },
          style: 'callout',
          fontSize: 11,
          isSurveyed: false,
        },
      ],
    };

    onPlanChange(updatedPlan);
    setAgentStatus('🤖 AI Agent injected planned Crosscut 210-XC4 into the active plan!');
    setTimeout(() => setAgentStatus(null), 4000);
  };

  // Trigger 2: AI Agent loads a completely new diamond sublevel stoping mine plan
  const handleAIAgentLoadSublevel = () => {
    const sublevelPlan = createMinePlanTemplate('sublevel_stoping');
    onPlanChange(sublevelPlan);
    setAgentStatus('🤖 AI Agent loaded a new Sublevel Stoping Mine Plan template!');
    setTimeout(() => setAgentStatus(null), 4000);
  };

  // Trigger 3: Reset to original WEBA Mine plan
  const handleResetToDemo = () => {
    onPlanChange(DEMO_MINE_PLAN);
    setAgentStatus('🔄 Reset to WEBA Mine 210 mL reference plan.');
    setTimeout(() => setAgentStatus(null), 3000);
  };

  return (
    <div className="flex-1 h-full w-full bg-slate-950 flex flex-col overflow-hidden text-slate-100 select-none">
      {/* Host App Top Simulation Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-100 font-bold tracking-tight">MINETRACK ENTERPRISE</span>
            <span className="text-slate-500 font-normal">|</span>
            <span className="text-slate-400 font-mono text-[11px]">Host App Integration Sandbox</span>
          </div>
          <span className="text-slate-600">/</span>
          <span className="text-cyan-400 font-medium">Underground Level 210 mL</span>
        </div>

        {/* AI Agent Status Pill */}
        {agentStatus && (
          <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-800 text-cyan-300 px-3 py-1 rounded-full text-xs animate-fade-in font-medium">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{agentStatus}</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-slate-400 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry Online (60 FPS)</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Standalone Widget</span>
          </div>
        </div>
      </div>

      {/* Host App Integration Controls Ribbon */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
        {/* Layout Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Host Container:</span>
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setContainerLayout('full')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                containerLayout === 'full'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize className="w-3 h-3" />
              <span>100% Lone Workspace</span>
            </button>
            <button
              onClick={() => setContainerLayout('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                containerLayout === 'split'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>Split Host Dashboard</span>
            </button>
            <button
              onClick={() => setContainerLayout('card')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                containerLayout === 'card'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Laptop className="w-3 h-3" />
              <span>Embedded Card (820px)</span>
            </button>
          </div>
        </div>

        {/* Viewer Mode Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Viewer Mode:</span>
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setViewerMode('full');
                setIsReadOnly(false);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewerMode === 'full' && !isReadOnly
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive CAD
            </button>
            <button
              onClick={() => {
                setViewerMode('viewer');
                setIsReadOnly(false);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewerMode === 'viewer' && !isReadOnly
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Viewer Only
            </button>
            <button
              onClick={() => {
                setIsReadOnly(!isReadOnly);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isReadOnly
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Read-Only
            </button>
          </div>
        </div>

        {/* External AI Agent Simulator Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAIAgentAddHeading}
            className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 font-medium rounded-lg text-xs transition-colors"
            title="Simulate external AI agent dynamically inserting a planned heading"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI: Add Heading</span>
          </button>
          <button
            onClick={handleAIAgentLoadSublevel}
            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/80 text-indigo-300 font-medium rounded-lg text-xs transition-colors"
            title="Simulate external AI agent loading a brand new mine layout"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AI: Load Sublevel Plan</span>
          </button>
          <button
            onClick={handleResetToDemo}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors"
            title="Reset to initial WEBA Mine 210 mL plan"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Host Application Canvas Body */}
      <div className="flex-1 flex overflow-hidden p-3 bg-slate-950 justify-center items-center">
        {containerLayout === 'full' && (
          // 100% Lone Workspace: The exact way host applications embed the lone component
          <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative bg-slate-900">
            <MinePlanViewer
              plan={plan}
              onPlanChange={onPlanChange}
              mode={viewerMode}
              readOnly={isReadOnly}
              className="w-full h-full"
            />
          </div>
        )}

        {containerLayout === 'split' && (
          // Split Host Dashboard: Demonstrating side-by-side integration with host data streams
          <div className="w-full h-full flex gap-3 overflow-hidden">
            <div className="flex-[3] h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative bg-slate-900">
              <MinePlanViewer
                plan={plan}
                onPlanChange={onPlanChange}
                mode={viewerMode}
                readOnly={isReadOnly}
                className="w-full h-full"
              />
            </div>

            {/* Simulated Host App Right Telemetry Panel */}
            <div className="flex-[1.2] min-w-[320px] max-w-[400px] h-full bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Active Face Operations
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  ONLINE
                </span>
              </div>

              {/* Face Details */}
              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="text-slate-400 text-[11px] mb-1">Active Heading</div>
                  <div className="font-bold text-slate-100 text-sm">Crosscut 210-XC2 @ 210 mL</div>
                  <div className="text-slate-400 mt-1 font-mono text-[11px]">Advance: 42.5 m / 120.0 m</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-cyan-400 h-full w-[35%]" />
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rock Mass Rating (RMR):</span>
                    <span className="font-mono font-bold text-emerald-400">68 (Good Rock)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Support Standard:</span>
                    <span className="font-mono text-slate-200">2.4m Split Sets @ 1.2m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ventilation Flow:</span>
                    <span className="font-mono text-cyan-400 font-bold">24.5 m³/s (Fresh)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Air Velocity:</span>
                    <span className="font-mono text-slate-200">0.85 m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CH₄ Gas Sensor (Junction):</span>
                    <span className="font-mono text-emerald-400 font-semibold">0.02% (Safe)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CO Gas Sensor:</span>
                    <span className="font-mono text-emerald-400 font-semibold">0 ppm</span>
                  </div>
                </div>

                {/* Fleet Assigned */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="text-slate-400 text-[11px] mb-2 font-semibold uppercase tracking-wider">
                    Assigned Fleet
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">Jumbo Drill J-04</span>
                      <span className="text-emerald-400">DRILLING</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">LHD Loader L-12</span>
                      <span className="text-amber-400">HAULING</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200">Haul Truck T-08</span>
                      <span className="text-slate-400">EN ROUTE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {containerLayout === 'card' && (
          // Embedded Card Layout: Testing responsive resize inside a fixed card
          <div className="w-[880px] h-[600px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="font-bold text-xs text-slate-200">Host Dashboard Card Component</span>
                <span className="text-slate-500 text-xs font-mono">(880 × 600 px)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Responsive ResizeObserver Active
              </span>
            </div>
            <div className="flex-1 w-full h-full relative overflow-hidden">
              <MinePlanViewer
                plan={plan}
                onPlanChange={onPlanChange}
                mode={viewerMode}
                readOnly={isReadOnly}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
