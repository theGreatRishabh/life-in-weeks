import React, { useState } from 'react';

interface ActionBarProps {
  onDownload: (includeStats: boolean) => void;
  onPrint: (includeStats: boolean) => void;
  shareData: { [key: string]: any };
  includeStats: boolean;
  setIncludeStats: (value: boolean) => void;
  isDownloading?: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onDownload,
  onPrint,
  shareData,
  includeStats,
  setIncludeStats,
  isDownloading = false,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const constructShareUrl = () => {
    const params = new URLSearchParams();
    Object.entries(shareData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, value.toString());
      }
    });
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleShare = async () => {
    const shareUrl = constructShareUrl();
    const sharePayload = {
      title: 'My Life in Weeks',
      text: 'Check out my life visualized in weeks!',
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
        showToast('Shared successfully!');
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast('Link copied to clipboard!');
      })
      .catch(() => {
        showToast('Could not copy link to clipboard');
      });
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-foreground text-background px-4 py-2.5 rounded-lg shadow-xl text-xs sm:text-sm font-medium animate-bounce flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Option to include/exclude stats in export */}
      <div className="p-3 bg-muted/40 hover:bg-muted/60 transition-colors rounded-xl border border-border flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-foreground">
              Include Statistics in Export
            </div>
            <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              {includeStats
                ? 'Full report with circle progress & age stats'
                : 'Clean poster format: calendar grid only'}
            </div>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={includeStats}
          onClick={() => setIncludeStats(!includeStats)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
            includeStats ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
          title={includeStats ? 'Disable statistics in export' : 'Enable statistics in export'}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              includeStats ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Download Button with Quick Dropdown */}
        <div className="relative">
          <div className="flex rounded-lg shadow-xs overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => onDownload(includeStats)}
              disabled={isDownloading}
              className="flex-1 bg-card hover:bg-muted/80 text-foreground px-3 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isDownloading ? (
                <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <DownloadIcon />
              )}
              <span>{isDownloading ? 'Saving...' : 'Download'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDownloadMenu(!showDownloadMenu);
                setShowPrintMenu(false);
              }}
              className="px-2 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-l border-border transition-colors flex items-center"
              title="Download options"
            >
              <ChevronDownIcon />
            </button>
          </div>

          {/* Download Dropdown */}
          {showDownloadMenu && (
            <div className="absolute left-0 sm:right-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-xl z-30 py-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  onDownload(true);
                  setShowDownloadMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex flex-col gap-0.5 text-card-foreground"
              >
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Full Report (with stats)
                </span>
                <span className="text-[11px] text-muted-foreground">Includes circular progress & age</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onDownload(false);
                  setShowDownloadMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-muted flex flex-col gap-0.5 text-card-foreground border-t border-border/50"
              >
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Calendar Only (minimalist)
                </span>
                <span className="text-[11px] text-muted-foreground">Clean life grid poster without stats</span>
              </button>
            </div>
          )}
        </div>


        {/* Print Button — simple, no dropdown needed */}
        <button
          type="button"
          onClick={() => onPrint(includeStats)}
          className="flex rounded-lg shadow-xs overflow-hidden border border-border bg-card hover:bg-muted/80 text-foreground px-3 py-2.5 text-xs sm:text-sm font-medium items-center justify-center gap-1.5 transition-colors w-full"
        >
          <PrintIcon />
          <span>Print</span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="bg-card hover:bg-muted/80 text-foreground border border-border rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <ShareIcon />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const PrintIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default ActionBar;
