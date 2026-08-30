import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TreeView } from './TreeView';
import { FilePreviewModal } from './FilePreviewModal';
import { type FileNode } from '../types';
import { FolderSearch, Loader2 } from 'lucide-react';
import { useScannerContext } from '../contexts/ScannerContext';

export function FolderTreePage() {
  const [searchParams] = useSearchParams();
  const pathParam = searchParams.get('path');
  
  const { files, isScanning, error, scan } = useScannerContext();
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);

  useEffect(() => {
    const savedPaths = localStorage.getItem('nas_indexer_paths');
    const paths = savedPaths ? JSON.parse(savedPaths) : [];
    
    if (paths.length > 0) {
      scan(paths);
    }
  }, [scan]);

  return (
    <div className="flex flex-col h-full w-full p-4 md:p-8 items-center justify-center bg-[#0F1115]">
      <div className="bg-[#16191E] border border-[#2D3139] rounded shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#2D3139] bg-[#1A1D23] flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
            <FolderSearch className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Folder Tree View</h1>
            <h2 className="text-[11px] font-mono text-blue-400 truncate mt-0.5">{pathParam || 'All Indexed Paths'}</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-[#0F1115] relative">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <p className="font-mono text-sm">{error}</p>
            </div>
          ) : files.length === 0 && !isScanning ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="font-mono text-sm">Folder is empty or could not be read.</p>
            </div>
          ) : (
            <>
              <TreeView files={files} onFileClick={setPreviewFile} targetPath={pathParam || undefined} />
              {isScanning && (
                <div className="fixed bottom-12 right-12 bg-[#1A1D23] border border-[#2D3139] px-4 py-3 rounded shadow-lg flex items-center gap-3 text-blue-400 text-sm font-mono z-50">
                  <Loader2 className="w-4 h-4 animate-spin" /> Scanning...
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
