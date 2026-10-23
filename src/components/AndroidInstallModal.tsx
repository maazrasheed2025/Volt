import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Zap,
  Info,
  Terminal,
  CheckCircle2,
  X,
  Share2,
  QrCode,
  Send,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, install, isAndroid } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk' | 'cli'>('pwa');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://voltedge-app.web.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VoltEdge ERP - Generator Manufacturing & Finance',
          text: 'Open and install VoltEdge Generator Manufacturing ERP app on your Android phone or tablet:',
          url: currentUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
      } catch (err) {
        // User cancelled share or error
      }
    } else {
      handleCopyUrl();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Open and install VoltEdge Generator ERP App on your Android device: ${currentUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleInstallClick = async () => {
    await install();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
    >
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 my-6 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-slate-950 shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Android APK & Mobile Installation
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Install on Android phones & tablets for on-site checking, factory floor audits, or build a standalone .apk package.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Method 1: Direct 1-Click Install (Instant)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'apk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Method 2: Generate .APK File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cli')}
            className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'cli'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer CLI (Capacitor/TWA)</span>
          </button>
        </div>

        {/* TAB 1: Direct PWA Install */}
        {activeTab === 'pwa' && (
          <div className="space-y-4 text-xs">
            {/* Status card */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Install Directly on Any Android Device
                </span>
                <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                  No APK transfer or cables needed. The app installs directly into your Android app drawer with a native app icon, standalone full-screen window (no browser address bar), and offline data access.
                </p>
              </div>

              {isInstallable ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App Now</span>
                </button>
              ) : isInstalled ? (
                <div className="px-3.5 py-2 bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 rounded-xl font-bold flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Already Installed</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 shrink-0">
                  Open on your Android phone to install with 1-click
                </div>
              )}
            </div>

            {/* How to open on Android device */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider">
                How to open & install on another device:
              </span>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Share or copy the live link below to your Android device (via WhatsApp, Telegram, or email).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Open the link in <strong>Google Chrome</strong> or <strong>Edge</strong> on the Android phone or tablet.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span>Tap <strong>"Install App"</strong> (or tap the 3-dots menu in Chrome &rarr; <strong>"Install app"</strong> / <strong>"Add to Home Screen"</strong>).</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                  <span>The <strong>VOLTEDGE</strong> icon appears on your home screen and operates as a standalone app!</span>
                </div>
              </div>

              {/* Instant Share Options */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">Quick Share to Android Devices:</span>
                  <button
                    type="button"
                    onClick={() => setShowQr(!showQr)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQr ? 'Hide QR Code' : 'Show Camera QR Code'}</span>
                  </button>
                </div>

                {/* QR Code Container if toggled */}
                {showQr && (
                  <div className="p-3 bg-white rounded-2xl flex flex-col items-center justify-center text-slate-900 border border-slate-300 animate-fadeIn text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(currentUrl)}`}
                      alt="Scan to open VoltEdge ERP on Android"
                      className="w-36 h-36 rounded-lg"
                    />
                    <span className="text-[11px] font-bold mt-2 text-slate-800">
                      Point any Android camera at this code to open & install VoltEdge
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex-1 min-w-[140px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-xs shadow-md"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareSuccess ? 'Shared!' : 'Share to Android'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="flex-1 min-w-[140px] px-3 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-xs shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Share on WhatsApp</span>
                  </button>
                </div>

                {/* Link copy box */}
                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 bg-transparent text-slate-300 font-mono text-[11px] px-2 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Generate .APK file */}
        {activeTab === 'apk' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-indigo-950/30 border border-indigo-500/40 rounded-2xl space-y-2">
              <span className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-400" />
                Build a Standalone .APK File (No Android Studio Required)
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                You can generate a standalone <strong>.apk</strong> installer file ready to send via WhatsApp, email, or Google Drive and install on any phone:
              </p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="font-bold text-slate-200 text-xs">
                3-Step Guide using PWABuilder (Official Microsoft/Google Tool):
              </div>
              <ol className="space-y-2.5 text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <div>
                    Go to{' '}
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline font-bold inline-flex items-center gap-0.5"
                    >
                      pwabuilder.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    in your desktop or phone browser.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <div>
                    Enter this app's URL:
                    <div className="mt-1 font-mono text-[11px] bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-emerald-300 select-all">
                      {currentUrl}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <div>
                    Click <strong>"Start"</strong> &rarr; Click <strong>"Package for Android"</strong>. PWABuilder packages our pre-configured Web App Manifest & icons and downloads a signed <strong>.apk</strong> file.
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                  <div>
                    Transfer the <strong>.apk</strong> file to any Android device, tap to install, and allow "Install from this source".
                  </div>
                </li>
              </ol>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                PWA Manifest & high-res icons (192px, 512px, maskable) are already configured and live!
              </span>
              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition text-xs"
              >
                <span>Open PWABuilder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* TAB 3: Developer CLI */}
        {activeTab === 'cli' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <span className="font-bold text-slate-200 text-xs block uppercase tracking-wider">
                Option A: Google's Official Bubblewrap (TWA) CLI
              </span>
              <p className="text-slate-400 text-[11px]">
                Create a native Android Studio project or APK directly from the command line:
              </p>
              <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
{`# 1. Initialize Android project from our manifest
npx @bubblewrap/cli init --manifest=${currentUrl}/manifest.webmanifest

# 2. Build the APK / AAB
npx @bubblewrap/cli build`}
              </pre>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <span className="font-bold text-slate-200 text-xs block uppercase tracking-wider">
                Option B: Capacitor Native Wrapper
              </span>
              <p className="text-slate-400 text-[11px]">
                Wrap the React frontend into a full native Android app with offline storage:
              </p>
              <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 font-mono text-[11px] text-sky-400 overflow-x-auto">
{`# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Initialize project
npx cap init "VoltEdge Manufacturing" com.voltedge.finance --web-dir=dist

# 3. Add Android platform & build APK
npx cap add android
npm run build
npx cap copy
npx cap open android # builds debug APK in Android Studio`}
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SSL Secured • Offline Caching Enabled • Fullscreen Standalone</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
