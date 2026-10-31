import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import {
  ShieldCheck,
  Server,
  Lock,
  Cpu,
  Database,
  Activity,
  Layers,
  Globe,
  Key,
  FileCode,
  Video,
  AlertTriangle,
  RefreshCw,
  Zap,
  Terminal,
  CheckCircle2,
  X,
  Radio,
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';

interface SecurityArchitectureModalProps {
  language: Language;
  onClose: () => void;
}

export const SecurityArchitectureModal: React.FC<SecurityArchitectureModalProps> = ({
  language,
  onClose,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'architecture' | 'cybersecurity' | 'scalability' | 'soc' | 'drm'>('architecture');

  const microservices = [
    { name: 'Auth & IAM Service', tech: 'Go / Rust', desc: 'Passkeys, WebAuthn, JWT Rotation, OAuth 2.1' },
    { name: 'User Profile & Graph', tech: 'Node.js / GraphQL', desc: 'Pioneer Tiers, Social Graph, Follower Index' },
    { name: '8K Video Ingestion & Transcoding', tech: 'FFmpeg / C++ Cluster', desc: 'Chunked HLS/DASH, Watermarking, DRM Encryption' },
    { name: 'AI Recommendation Engine', tech: 'Python / Ray / PyTorch', desc: 'Real-time Vector Search, Multi-Armed Bandits' },
    { name: 'Messaging & WebSockets', tech: 'Elixir / Erlang Beam', desc: 'E2EE Signal Protocol, Ephemeral Storage' },
    { name: 'Season Competition & Voting', tech: 'Rust / Redis Cluster', desc: 'Distributed Consensus, Fraud Detection' },
    { name: 'AI Content Moderation', tech: 'Gemini Multimodal / Triton', desc: 'Automated 8K frame scan, Zero-day policy enforcement' },
    { name: 'Analytics & SOC SIEM', tech: 'ClickHouse / Kafka / OpenSearch', desc: '100k EPS telemetry, Anomaly detection' },
  ];

  const scalePhases = [
    {
      phase: 'Phase 1: Genesis',
      users: '100,000 Users',
      infra: 'EKS (3 nodes) + Aurora PostgreSQL + Cloudflare Enterprise',
      cost: '~$2,400 / mo',
      challenge: 'Fast cold starts & sub-50ms video delivery',
    },
    {
      phase: 'Phase 2: Cosmic Expansion',
      users: '1,000,000 Users',
      infra: 'Multi-AZ Kubernetes + Distributed ScyllaDB + Edge CDN Caching',
      cost: '~$18,500 / mo',
      challenge: 'Hot-partition mitigation on viral season clips',
    },
    {
      phase: 'Phase 3: Galactic Scale',
      users: '10,000,000 Users',
      infra: 'Multi-Region Active-Active Mesh + Redis Cluster + GPU Transcode Nodes',
      cost: '~$115,000 / mo',
      challenge: 'Global database replication latency & cross-region consistency',
    },
    {
      phase: 'Phase 4: Universal 100M+',
      users: '100,000,000+ Users',
      infra: 'Global Anycast BGP + Custom CDN Edge Points + Dedicated Tensor ML Clusters',
      cost: '~$780,000 / mo',
      challenge: 'Petabyte/sec egress bandwidth, real-time live-streaming sync',
    },
  ];

  return (
    <div
      id="security-architecture-backdrop"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 select-none"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#070712] border border-indigo-500/30 rounded-[32px] overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.3)] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-black">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  {t.cybersecurityHub}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                  SOC 2 TYPE II COMPLIANT
                </span>
              </div>
              <p className="text-xs text-white/50">{t.cybersecurityDesc}</p>
            </div>
          </div>

          <button
            id="close-security-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-all"
            aria-label={t.close}
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-3 border-b border-white/10 bg-white/[0.02] overflow-x-auto no-scrollbar">
          {[
            { id: 'architecture', label: language === 'ar' ? 'المعمارية والمايكروسيرفس' : 'Microservices Architecture', icon: Server },
            { id: 'cybersecurity', label: language === 'ar' ? 'الحماية وZero-Trust' : 'Zero-Trust Cybersecurity', icon: Lock },
            { id: 'drm', label: language === 'ar' ? 'حماية الفيديو DRM' : 'DRM & Content Protection', icon: Video },
            { id: 'soc', label: language === 'ar' ? 'مركز مراقبة SOC' : '24/7 SOC & SIEM', icon: Activity },
            { id: 'scalability', label: language === 'ar' ? 'خارطة الـ 100M مستخدم' : '100M Scale Roadmap', icon: Globe },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'btn-purple text-white shadow-md'
                    : 'text-white/50 hover:text-white bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 no-scrollbar text-white">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      Distributed Microservices Architecture
                    </div>
                    <div className="text-[11px] text-white/50 font-mono">
                      Decoupled gRPC + Envoy Service Mesh + Kubernetes Orchestration
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  99.999% SLA
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {microservices.map((svc) => (
                  <div
                    key={svc.name}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{svc.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[9px] font-mono text-indigo-300">
                        {svc.tech}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed">{svc.desc}</p>
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Zero-Trust Private Subnet Ingress</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ZERO TRUST CYBERSECURITY */}
          {activeTab === 'cybersecurity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-white">Identity & Access (IAM)</span>
                  <ul className="text-[11px] text-white/60 space-y-1 font-mono">
                    <li>• FIDO2 / WebAuthn Passkeys</li>
                    <li>• Context-Aware MFA Challenge</li>
                    <li>• Ephemeral JWT & Secret Rotation</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Database Protection</span>
                  <ul className="text-[11px] text-white/60 space-y-1 font-mono">
                    <li>• AES-256-GCM Encryption at Rest</li>
                    <li>• TLS 1.3 Strict in Transit</li>
                    <li>• Field-Level Key Sharding (FLE)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                  <Zap className="w-5 h-5 text-pink-400" />
                  <span className="text-xs font-bold text-white">WAF & Anti-DDoS</span>
                  <ul className="text-[11px] text-white/60 space-y-1 font-mono">
                    <li>• Rate Limiting: 10k req/s bucket</li>
                    <li>• AI Bot Shield & Heuristics</li>
                    <li>• OWASP Top 10 automated mitigation</li>
                  </ul>
                </div>
              </div>

              {/* DevSecOps Pipeline */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Automated DevSecOps Pipeline</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                    <span className="text-white/40 block">Step 1</span>
                    <span className="text-indigo-300 font-bold">SAST & Secret Scan</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                    <span className="text-white/40 block">Step 2</span>
                    <span className="text-indigo-300 font-bold">SCA & Dependency Audit</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                    <span className="text-white/40 block">Step 3</span>
                    <span className="text-indigo-300 font-bold">Container SBOM & Trivy</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                    <span className="text-white/40 block">Step 4</span>
                    <span className="text-emerald-400 font-bold">Signed Cosign Release</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DRM & VIDEO PROTECTION */}
          {activeTab === 'drm' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>8K Video & Asset Anti-Piracy Architecture</span>
                </div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Every 15-second clip uploaded to Five Seasons is secured via dynamic invisible steganographic watermarking, AES-128 tokenized HLS chunks, and short-lived HMAC Signed URLs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="font-bold text-indigo-300">HMAC Signed URL Validation</span>
                  <p className="text-[11px] text-white/50">
                    Video chunks are valid for 45 seconds only, bound to the user session IP and cryptographic nonce to prevent link sharing.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="font-bold text-indigo-300">Forensic Invisible Watermark</span>
                  <p className="text-[11px] text-white/50">
                    Embeds immutable creator ID and pioneer tier into the video luminance spectrum without degrading 8K visual fidelity.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="font-bold text-indigo-300">Client-side Tamper Shield</span>
                  <p className="text-[11px] text-white/50">
                    Detects runtime debugger injection, Frida hooks, and unauthorized screen recording triggers on mobile clients.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <span className="font-bold text-indigo-300">Widevine / FairPlay DRM Tier</span>
                  <p className="text-[11px] text-white/50">
                    Hardware-backed hardware decryption engine for premium annual award winning seasonal master clips.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOC & SIEM MONITORING */}
          {activeTab === 'soc' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold text-white">{t.securityStatus}</div>
                    <div className="text-[10px] text-white/50 font-mono">
                      Real-Time SOC Ingestion: 84,210 events/sec | Zero active alerts
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  DEFCON 5 (STABLE)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-xs text-white/50 block mb-1">RTO (Recovery Time)</span>
                  <span className="text-lg font-black text-white font-mono">&lt; 3 Minutes</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-xs text-white/50 block mb-1">RPO (Data Loss Point)</span>
                  <span className="text-lg font-black text-white font-mono">&lt; 15 Seconds</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-xs text-white/50 block mb-1">Incident Response</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">Automated AI</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: 100M USER SCALABILITY */}
          {activeTab === 'scalability' && (
            <div className="space-y-3">
              {scalePhases.map((phase, idx) => (
                <div
                  key={phase.phase}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400">{phase.phase}</span>
                      <span className="text-xs font-black text-white font-mono">({phase.users})</span>
                    </div>
                    <div className="text-[11px] text-white/70 font-mono">{phase.infra}</div>
                    <div className="text-[10px] text-white/40">Core challenge: {phase.challenge}</div>
                  </div>
                  <div className="text-right rtl:text-left">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Est. {phase.cost}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
