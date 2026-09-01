import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { type FileNode } from '../types';
import { getAllFiles, upsertFiles, cleanupOldFiles } from '../lib/db';

interface ScannerContextType {
  files: FileNode[];
  isScanning: boolean;
  error: string | null;
  scan: (paths: string[]) => Promise<void>;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export function ScannerProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from IndexedDB cache on mount
  useEffect(() => {
    getAllFiles().then(setFiles).catch(console.error);
  }, []);

  const scan = useCallback(async (paths: string[]) => {
    setIsScanning(true);
    setError(null);

    try {
      const response = await fetch('/api/scan-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      });

      if (!response.ok) throw new Error('Failed to start scanning');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      let pendingFiles: FileNode[] = [];
      const allScannedPaths: string[] = [];
      let timeoutId: any = null;

      const flushFiles = async () => {
        if (pendingFiles.length > 0) {
          const currentPending = [...pendingFiles];
          pendingFiles = [];
          
          currentPending.forEach(f => allScannedPaths.push(f.path));
          
          // CRUD: Save to IndexedDB first
          await upsertFiles(currentPending);
          
          // Then update React State
          setFiles(prev => {
            const newMap = new Map(prev.map(f => [f.path, f]));
            currentPending.forEach(f => newMap.set(f.path, f));
            return Array.from(newMap.values());
          });
        }
        timeoutId = null;
      };

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (timeoutId) clearTimeout(timeoutId);
            await flushFiles();
            await cleanupOldFiles(paths, allScannedPaths);
            const finalFiles = await getAllFiles();
            setFiles(finalFiles);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.error) {
                   console.error(data.error);
                   continue;
                }
                pendingFiles.push(data);
              } catch (e) {}
            }
          }

          if (!timeoutId && pendingFiles.length > 0) {
            timeoutId = setTimeout(flushFiles, 500); // Batch updates to DB/UI
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsScanning(false);
    }
  }, []);

  return (
    <ScannerContext.Provider value={{ files, isScanning, error, scan }}>
      {children}
    </ScannerContext.Provider>
  );
}

export function useScannerContext() {
  const context = useContext(ScannerContext);
  if (context === undefined) {
    throw new Error('useScannerContext must be used within a ScannerProvider');
  }
  return context;
}
