import { useState, useEffect } from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { type FileNode } from '../types';

interface FilePreviewModalProps {
  file: FileNode | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  if (!file || file.type === 'directory') return null;

  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ext = file.name.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
  const isText = ['txt', 'md', 'log', 'json', 'csv', 'ts', 'js', 'html', 'css'].includes(ext || '');
  const isSupported = isImage || isText;

  useEffect(() => {
    if (isText && file) {
      setLoading(true);
      setError(null);
      fetch(`/api/preview?path=${encodeURIComponent(file.path)}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load file preview.');
          return res.text();
        })
        .then(text => setContent(text))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [file, isText]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#16191E] border border-[#2D3139] rounded shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#2D3139] bg-[#0F1115]">
          <div className="flex items-center gap-3 overflow-hidden">
            {isImage ? <ImageIcon className="w-5 h-5 text-blue-400 shrink-0" /> : <FileText className="w-5 h-5 text-blue-400 shrink-0" />}
            <span className="font-mono text-sm text-[#E0E0E0] truncate">{file.path}</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 bg-[#1A1D23] rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-[#0F1115] relative">
          {!isSupported ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FileText className="w-16 h-16 mb-4 text-[#2D3139]" />
              <p className="text-sm">Preview not supported for this file type.</p>
              <p className="text-xs text-gray-600 mt-2">({ext?.toUpperCase() || 'Unknown'} file)</p>
              <a 
                href={`/api/download?path=${encodeURIComponent(file.path)}`} 
                download={file.name}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-blue-500 transition-colors"
              >
                Download File
              </a>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse flex items-center gap-2 text-blue-400 text-sm font-mono">
                <FileText className="w-4 h-4 animate-bounce" /> Loading content...
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-400 font-mono text-sm">
              <p>{error}</p>
              <a 
                href={`/api/download?path=${encodeURIComponent(file.path)}`} 
                className="mt-4 px-4 py-1.5 bg-[#1A1D23] border border-[#2D3139] text-[#E0E0E0] rounded hover:bg-[#2D3139] transition-colors"
              >
                Download Instead
              </a>
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img src={`/api/preview?path=${encodeURIComponent(file.path)}`} alt={file.name} className="max-w-full max-h-full object-contain rounded" />
            </div>
          ) : (
            <pre className="font-mono text-[13px] leading-relaxed text-gray-300 whitespace-pre-wrap break-words">{content}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
