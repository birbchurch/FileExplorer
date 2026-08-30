import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TreeView } from './TreeView';
import { FilePreviewModal } from './FilePreviewModal';
import { type FileNode } from '../types';
import { FolderSearch, Loader2 } from 'lucide-react';

export function FolderTreePage() {
  const [searchParams] = useSearchParams();
  const pathParam = searchParams.get('path');
  
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);

  useEffect(() => {
    if (!pathParam) {
      setError("No path specified in URL.");
      setLoading(false);
      return;
    }
    
    fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: [pathParam] })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to scan the specified directory.');
      return res.json();
    })
    .then(data => {
      setFiles(data.files || []);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [pathParam]);

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8 items-center justify-center bg-[#0F1115]">
      <div className="bg-[#16191E] border border-[#2D3139] rounded shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2D3139] bg-[#1A1D23] flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <FolderSearch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Folder Tree View</h1>
            <h2 className="text-[11px] font-mono text-blue-400 truncate mt-0.5">{pathParam}</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-[#0F1115]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-blue-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="font-mono text-sm">Scanning directory structure...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <p className="font-mono text-sm">{error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="font-mono text-sm">Folder is empty or could not be read.</p>
            </div>
          ) : (
            <TreeView files={files} onFileClick={setPreviewFile} />
          )}
        </div>
      </div>
      
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
