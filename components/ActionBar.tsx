import React from 'react';

interface ActionBarProps {
    onDownload: () => void;
    shareData: { [key: string]: any };
}

const ActionBar: React.FC<ActionBarProps> = ({ onDownload, shareData }) => {
    
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
            } catch (error) {
                console.error('Error sharing:', error);
                // Fallback to clipboard if user cancels share
                copyToClipboard(shareUrl);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            copyToClipboard(shareUrl);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy link.');
        });
    };
    
    const handlePrint = () => {
        window.print();
    };

    const ActionButton: React.FC<{ onClick: () => void, icon: React.ReactNode, children: React.ReactNode }> = ({ onClick, icon, children }) => (
        <button
            onClick={onClick}
            className="w-full sm:w-auto flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700/50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-600 rounded-md px-4 py-2 text-slate-800 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        >
            {icon}
            <span>{children}</span>
        </button>
    );

    return (
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg p-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <ActionButton onClick={onDownload} icon={<DownloadIcon />}>Download</ActionButton>
                <ActionButton onClick={handleShare} icon={<ShareIcon />}>Share</ActionButton>
                <ActionButton onClick={handlePrint} icon={<PrintIcon />}>Print</ActionButton>
            </div>
        </div>
    );
};

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const PrintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;

export default ActionBar;