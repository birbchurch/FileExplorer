import { useState } from 'react';
import { Folder, FolderOpen, FileText, FileImage, FileCode, FileArchive } from 'lucide-react';
import { type FileNode } from '../types';

export interface TreeNode {
  name: string;
  originalPath: string;
  type: 'file' | 'directory';
  children: Record<string, TreeNode>;
  node?: FileNode;
}

export function buildTree(files: FileNode[]): TreeNode[] {
  const root: Record<string, TreeNode> = {};
  
  files.forEach(file => {
    const normalized = file.path.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);
    
    let currentLevel = root;
    parts.forEach((part, index) => {
      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          originalPath: '',
          type: 'directory',
          children: {}
        };
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

const TreeNodeComponent = ({ node, onFileClick }: { node: TreeNode, onFileClick: (f: FileNode) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDir = node.type === 'directory' || Object.keys(node.children).length > 0;
  
  return (
    <div className="pl-4">
      <div 
        className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-[#1A1D23] rounded px-2 text-sm text-[#E0E0E0] font-mono group transition-colors"
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
        <span className={isDir ? "text-gray-300 group-hover:text-white" : "text-gray-400 group-hover:text-blue-300"}>
          {node.name}
        </span>
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
}

export function TreeView({ files, onFileClick }: TreeViewProps) {
  const tree = buildTree(files);
  return (
    <div className="py-2">
      {tree.map((node, i) => (
        <TreeNodeComponent key={i} node={node} onFileClick={onFileClick} />
      ))}
    </div>
  );
}
