export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mtime: string;
}

export interface Profile {
  id: string;
  name: string;
  paths: string[];
  excludeRules?: string[];
}
