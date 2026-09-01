import { useState } from 'react';
import { Folder, FolderOpen, FileText, FileImage, FileCode, FileArchive } from 'lucide-react';
import { type FileNode } from '../types';

export interface TreeNode {
  name: string;
  originalPath: string;
  type: 'file' | 'directory';
  children: Record<string, TreeNode>;
  node?: FileNode;
  autoOpen?: boolean;
}

export function buildTree(files: FileNode[], targetPath?: string): TreeNode[] {
  const root: Record<string, TreeNode> = Object.create(null);
  const targetParts = targetPath ? targetPath.replace(/\\/g, '/').split('/').filter(Boolean) : [];
  
  files.forEach(file => {
    const normalized = file.path.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    
    let currentLevel = root;
    parts.forEach((part, index) => {
      if (!Object.prototype.hasOwnProperty.call(currentLevel, part)) {
        currentLevel[part] = {
          name: part,
          originalPath: '',
          type: 'directory',
          children: Object.create(null),
          autoOpen: false
        };
      }

      let matchesTarget = targetParts.length > 0;
      for (let i = 0; i <= index; i++) {
        if (i >= targetParts.length || parts[i] !== targetParts[i]) {
          matchesTarget = false;
          break;
        }
      }
      if (matchesTarget) {
        currentLevel[part].autoOpen = true;
      }

      if (index === parts.length - 1) {
        currentLevel[part].originalPath = file.path;
        currentLevel[part].type = file.type;
        currentLevel[part].node = file;
      }
      currentLevel = currentLevel[part].children;
    });
  });
  
  return Object.values(root);
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return <FileImage className="w-4 h-4 text-purple-400 shrink-0" />;
  if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext || '')) return <FileArchive className="w-4 h-4 text-orange-400 shrink-0" />;
  if (['json', 'js', 'ts', 'html', 'css', 'tsx', 'jsx'].includes(ext || '')) return <FileCode className="w-4 h-4 text-green-400 shrink-0" />;
  return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
};

const getParentPath = (path: string) => {
  const parts = path.split(/[/\\]/);
  parts.pop();
  return parts.join('\\') || '/';
};

const TreeNodeComponent = ({ node, onFileClick }: { node: TreeNode, onFileClick: (f: FileNode) => void }) => {
  const [isOpen, setIsOpen] = useState(node.autoOpen || false);
  const isDir = node.type === 'directory' || Object.keys(node.children).length > 0;
  
  // Make sure it expands if targetPath updates to include it
  if (node.autoOpen && !isOpen) {
    setIsOpen(true);
  }

  return (
    <div className="pl-4">
      <div className="flex items-center justify-between group hover:bg-[#1A1D23] rounded transition-colors pr-2">
        <div 
          className="flex items-center gap-2 py-1.5 cursor-pointer px-2 text-sm text-[#E0E0E0] font-mono flex-1"
          onClick={() => {
            if (isDir) setIsOpen(!isOpen);
            else if (node.node) onFileClick(node.node);
          }}
        >
          {isDir ? (
            isOpen ? <FolderOpen className="w-4 h-4 text-blue-500 shrink-0" /> : <Folder className="w-4 h-4 text-gray-500 shrink-0 group-hover:text-blue-400" />
          ) : (
            getFileIcon(node.name)
          )}
          <span className={isDir ? "text-gray-300 group-hover:text-white truncate max-w-[200px] sm:max-w-md" : "text-gray-400 group-hover:text-blue-300 truncate max-w-[200px] sm:max-w-md"}>
            {node.name}
          </span>
        </div>
        {node.node && (
          <div className="hidden group-hover:flex items-center gap-2 shrink-0">
            {node.type === 'file' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onFileClick(node.node!); }}
                className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-blue-600 transition-colors text-[10px] uppercase font-bold tracking-wider"
                title="Preview file"
              >
                Open
              </button>
            )}
            {node.type === 'file' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(node.node!.path);
                }}
                className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-indigo-600 transition-colors text-[10px] uppercase font-bold tracking-wider"
                title="Copy file full path"
              >
                Copy File Path
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(node.type === 'directory' ? node.node!.path : getParentPath(node.node!.path));
              }}
              className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-indigo-600 transition-colors text-[10px] uppercase font-bold tracking-wider"
              title="Copy local directory path"
            >
              Copy Dir Path
            </button>
            <a 
              href={`/folder?path=${encodeURIComponent(node.type === 'directory' ? node.node.path : getParentPath(node.node.path))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-indigo-600 transition-colors text-[10px] uppercase font-bold tracking-wider"
              onClick={e => e.stopPropagation()}
              title="Open containing folder in tree view"
            >
              Open In Tab
            </a>
            {node.type === 'file' && (
              <a 
                href={`/api/download?path=${encodeURIComponent(node.node.path)}`}
                download={node.name}
                className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-green-600 transition-colors text-[10px] uppercase font-bold tracking-wider"
                onClick={e => e.stopPropagation()}
                title="Download via backend"
              >
                DL
              </a>
            )}
          </div>
        )}
      </div>
      {isDir && isOpen && (
        <div className="border-l border-[#2D3139] ml-2 mt-1">
          {Object.values(node.children).map((child, i) => (
            <TreeNodeComponent key={i} node={child} onFileClick={onFileClick} />
          ))}
        </div>
      )}
    </div>
  );
};

interface TreeViewProps {
  files: FileNode[];
  onFileClick: (f: FileNode) => void;
  targetPath?: string;
}

export function TreeView({ files, onFileClick, targetPath }: TreeViewProps) {
  const tree = buildTree(files, targetPath);
  return (
    <div className="py-2">
      {tree.map((node, i) => (
        <TreeNodeComponent key={i} node={node} onFileClick={onFileClick} />
      ))}
    </div>
  );
}
