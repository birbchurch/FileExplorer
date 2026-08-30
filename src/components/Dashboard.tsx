import { useState, useMemo } from 'react';
import { Search, FolderSync, FileText, Download, Folder } from 'lucide-react';
import { type FileNode } from '../types';
import { formatBytes } from '../lib/utils';
import { format } from 'date-fns';
import { FilePreviewModal } from './FilePreviewModal';
import { TreeView } from './TreeView';
import { useScannerContext } from '../contexts/ScannerContext';

export function Dashboard() {
  const { files, isScanning, error, scan } = useScannerContext();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<FileNode | null>(null);

  const handleScan = () => {
    const savedPaths = localStorage.getItem('nas_indexer_paths');
    const paths = savedPaths ? JSON.parse(savedPaths) : [];
    
    if (paths.length === 0) {
      alert('No paths configured. Please add paths in Settings first.');
      return;
    }

    scan(paths);
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    const lowerQuery = searchQuery.toLowerCase();
    return files.filter(f => 
      f.name.toLowerCase().includes(lowerQuery) || 
      f.path.toLowerCase().includes(lowerQuery)
    );
  }, [files, searchQuery]);

  const getParentPath = (path: string) => {
    const parts = path.split(/[/\\]/);
    parts.pop();
    return parts.join('\\') || '/';
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full">
      <div className="p-4 border-b border-[#2D3139] bg-[#16191E] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight">Dashboard</h2>
          <div className="h-6 w-[1px] bg-[#2D3139] hidden md:block"></div>
          <p className="text-[11px] uppercase text-gray-500 font-bold tracking-widest hidden md:block">Manage indexed files</p>
        </div>
        
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
        >
          <FolderSync className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Indexing...' : 'New Scan'}
        </button>
      </div>

      {error && (
        <div className="m-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded text-sm flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-[#2D3139] bg-[#16191E]">
          <form 
            onSubmit={(e) => { e.preventDefault(); setSearchQuery(searchInput); }}
            className="flex gap-2"
          >
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-semibold flex items-center gap-2 transition-colors shrink-0"
            >
              <Search className="w-4 h-4" /> Search
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by file name or path..."
                className="w-full bg-[#0F1115] border border-[#2D3139] rounded py-2 pl-10 pr-4 text-sm text-[#E0E0E0] placeholder:text-gray-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-auto bg-[#0F1115]">
          {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <Folder className="w-16 h-16 mb-4 text-[#2D3139]" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">No files indexed</p>
              <p className="text-[11px]">Click "New Scan" to index configured directories.</p>
            </div>
          ) : !searchQuery ? (
            <div className="p-4 h-full">
              <div className="mb-4 pb-2 border-b border-[#2D3139] flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Repository Tree</span>
                <span className="text-[10px] text-gray-600 font-mono">{files.length} Items</span>
              </div>
              <TreeView files={files} onFileClick={setPreviewFile} />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
              <Search className="w-12 h-12 mb-4 text-[#2D3139]" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No match found</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#1A1D23] shadow-sm z-10">
                <tr className="text-[10px] uppercase text-gray-500 font-bold border-b border-[#2D3139]">
                  <th className="px-4 py-2">File Name</th>
                  <th className="px-4 py-2 hidden md:table-cell">Path</th>
                  <th className="px-4 py-2 text-right hidden lg:table-cell">Size</th>
                  <th className="px-4 py-2 text-right hidden lg:table-cell">Modified</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono divide-y divide-[#1A1D23]">
                {filteredFiles.map((file, i) => (
                  <tr key={`${file.path}-${i}`} className="hover:bg-[#1A1D23] group transition-colors">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        {file.type === 'directory' ? <Folder className="w-4 h-4 text-blue-500 shrink-0" /> : <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
                        <span className="text-blue-400 truncate max-w-[200px] sm:max-w-[300px]" title={file.name}>
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-500 hidden md:table-cell truncate max-w-[200px] xl:max-w-[400px]" title={file.path}>
                      {file.path}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400 hidden lg:table-cell">
                      {file.type === 'directory' ? '--' : (file.size ? formatBytes(file.size) : '0 B')}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-500 hidden lg:table-cell whitespace-nowrap">
                      {format(new Date(file.mtime), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {file.type === 'file' && (
                          <button 
                            onClick={() => setPreviewFile(file)}
                            className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-blue-600 transition-colors text-[11px] uppercase font-bold tracking-wider"
                            title="Preview file"
                          >
                            Open
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(file.type === 'directory' ? file.path : getParentPath(file.path));
                          }}
                          className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-indigo-600 transition-colors text-[11px] uppercase font-bold tracking-wider"
                          title="Copy local folder path"
                        >
                          Copy Path
                        </button>
                        <a 
                          href={`/folder?path=${encodeURIComponent(file.type === 'directory' ? file.path : getParentPath(file.path))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-indigo-600 transition-colors text-[11px] uppercase font-bold tracking-wider"
                          title="Open containing folder in tree view"
                        >
                          Open In Tab
                        </a>
                        {file.type === 'file' && (
                          <a
                            href={`/api/download?path=${encodeURIComponent(file.path)}`}
                            download={file.name}
                            className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-green-600 transition-colors text-[11px] uppercase font-bold tracking-wider"
                            title="Download via backend"
                          >
                            DL
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
